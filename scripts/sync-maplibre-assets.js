/**
 * Regenerates src/assets/maplibre/bundledAssets.ts from design-assets/.
 * Run: node scripts/sync-maplibre-assets.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const design = path.join(root, 'design-assets');
const out = path.join(root, 'src', 'assets', 'maplibre', 'bundledAssets.ts');
const publicDir = path.join(root, 'public', 'maplibre');

const files = {
  css: 'maplibre-gl.min.css',
  js: 'maplibre-gl.min.js',
  rtl: 'mapbox-gl-rtl-text.js',
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

const css = fs.readFileSync(path.join(design, files.css), 'utf8');
const js = fs.readFileSync(path.join(design, files.js), 'utf8');
const rtl = fs.readFileSync(path.join(design, files.rtl), 'utf8');

for (const name of Object.values(files)) {
  fs.copyFileSync(path.join(design, name), path.join(publicDir, name));
}

const body = [
  '// Generated from design-assets — do not edit by hand.',
  '// Refresh with: node scripts/sync-maplibre-assets.js',
  `export const MAPLIBRE_CSS = ${JSON.stringify(css)};`,
  `export const MAPLIBRE_JS = ${JSON.stringify(js)};`,
  `export const MAPLIBRE_RTL_JS = ${JSON.stringify(rtl)};`,
  '',
].join('\n');

fs.writeFileSync(out, body);
console.log('Synced MapLibre assets →', path.relative(root, out));
