const { getDefaultConfig } = require('expo/metro-config');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { execSync } = require('child_process');
const { HttpsProxyAgent } = require('https-proxy-agent');

const config = getDefaultConfig(__dirname);

const UPSTREAM_TIMEOUT_MS = 120000;

/**
 * Resolve HTTP proxy for geo.sabzevar.ir upstream.
 * Browser/filter-shikan often reaches geo via a local proxy; Node/Metro does not
 * unless we wire it explicitly.
 */
function resolveUpstreamProxy() {
  const fromEnv = (
    process.env.MAP_HTTP_PROXY ||
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.https_proxy ||
    process.env.http_proxy ||
    ''
  ).trim();
  if (fromEnv) {
    return fromEnv;
  }

  if (process.platform !== 'win32') {
    return null;
  }

  try {
    const enableOut = execSync(
      'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable',
      { encoding: 'utf8' },
    );
    const enabled = /ProxyEnable\s+REG_DWORD\s+0x0*1\b/i.test(enableOut);

    const serverOut = execSync(
      'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer',
      { encoding: 'utf8' },
    );
    const match = serverOut.match(/ProxyServer\s+REG_SZ\s+(\S+)/i);
    if (!match) {
      return null;
    }

    let server = match[1].trim();
    // Some apps store "http=127.0.0.1:port;https=..."
    const httpsPart = server.match(/(?:^|;)\s*https?=([^;]+)/i);
    if (httpsPart) {
      server = httpsPart[1].trim();
    }
    if (!/^https?:\/\//i.test(server)) {
      server = `http://${server}`;
    }

    // Only when Windows proxy is enabled, or user forces it (stale ProxyServer
    // with ProxyEnable=0 is common after closing filter-shikan).
    if (enabled || process.env.MAP_USE_WIN_PROXY === '1') {
      return server;
    }
  } catch {
    // Registry missing or inaccessible — fall through to direct.
  }

  return null;
}

const upstreamProxy = resolveUpstreamProxy();
let httpsAgent = null;
if (upstreamProxy) {
  try {
    httpsAgent = new HttpsProxyAgent(upstreamProxy);
    console.log(
      `[map-proxy] upstream via ${upstreamProxy} (timeout ${UPSTREAM_TIMEOUT_MS}ms)`,
    );
  } catch (error) {
    console.warn(
      `[map-proxy] bad proxy URL ${upstreamProxy}: ${
        error && error.message ? error.message : error
      }`,
    );
  }
} else {
  console.log(
    `[map-proxy] no MAP_HTTP_PROXY / system proxy — direct geo (timeout ${UPSTREAM_TIMEOUT_MS}ms)`,
  );
}

/**
 * Proxy Sabzevar map traffic through Metro so Android WebView can load
 * tiles via Metro http origin instead of talking to geo.sabzevar.ir:7001
 * directly (TLS / custom-port issues in WebView).
 */
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      try {
        const rawUrl = req.url || '';

        // Diagnostic for the in-app MAP DEBUG panel
        if (rawUrl.startsWith('/map-proxy-status')) {
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store',
          });
          res.end(
            JSON.stringify({
              ok: true,
              upstreamProxy: upstreamProxy || null,
              timeoutMs: UPSTREAM_TIMEOUT_MS,
              hint: upstreamProxy
                ? null
                : 'Set MAP_HTTP_PROXY=http://127.0.0.1:PORT then restart Metro (filter-shikan HTTP port)',
            }),
          );
          return;
        }

        if (!rawUrl.startsWith('/map-proxy')) {
          return middleware(req, res, next);
        }

        const parsed = new URL(rawUrl, 'http://localhost');
        const target = parsed.searchParams.get('url');
        if (
          !target ||
          !/^https?:\/\/geo\.sabzevar\.ir(?::\d+)?\//i.test(target)
        ) {
          res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Invalid or missing url');
          return;
        }

        const targetUrl = new URL(target);
        const transport = targetUrl.protocol === 'http:' ? http : https;
        const headers = {
          'User-Agent': 'Sabzevar137-MapProxy/1.0',
          Accept: '*/*',
        };
        if (req.headers.range) {
          headers.Range = req.headers.range;
        }

        const requestOpts = {
          protocol: targetUrl.protocol,
          hostname: targetUrl.hostname,
          port: targetUrl.port || (targetUrl.protocol === 'http:' ? 80 : 443),
          path: targetUrl.pathname + targetUrl.search,
          method: 'GET',
          headers,
          timeout: UPSTREAM_TIMEOUT_MS,
          rejectUnauthorized: false,
        };

        // HTTPS through local HTTP proxy (filter-shikan / Clash / v2ray)
        if (httpsAgent && targetUrl.protocol === 'https:') {
          requestOpts.agent = httpsAgent;
        }

        const upstream = transport.request(requestOpts, (upRes) => {
          const outHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=300',
          };
          if (upRes.headers['content-type']) {
            outHeaders['Content-Type'] = upRes.headers['content-type'];
          }
          if (upRes.headers['content-length']) {
            outHeaders['Content-Length'] = upRes.headers['content-length'];
          }
          if (upRes.headers['content-encoding']) {
            outHeaders['Content-Encoding'] = upRes.headers['content-encoding'];
          }
          res.writeHead(upRes.statusCode || 502, outHeaders);
          upRes.pipe(res);
        });

        upstream.on('timeout', () => {
          upstream.destroy();
          if (!res.headersSent) {
            res.writeHead(504, {
              'Content-Type': 'text/plain; charset=utf-8',
            });
            res.end(
              `Upstream timeout after ${UPSTREAM_TIMEOUT_MS}ms` +
                (upstreamProxy ? ` (proxy ${upstreamProxy})` : ' (direct)'),
            );
          }
        });

        upstream.on('error', (error) => {
          if (!res.headersSent) {
            res.writeHead(502, {
              'Content-Type': 'text/plain; charset=utf-8',
            });
            res.end(
              `Upstream error: ${error.message}` +
                (upstreamProxy
                  ? ` via ${upstreamProxy}`
                  : ' (set MAP_HTTP_PROXY=http://127.0.0.1:PORT)'),
            );
          }
        });

        upstream.end();
      } catch (error) {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(
            String(error && error.message ? error.message : error),
          );
        }
      }
    };
  },
};

module.exports = config;
