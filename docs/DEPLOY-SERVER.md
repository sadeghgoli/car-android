# دیپلوی وب `sabzevar-137-car` روی سرور لینوکس

مسیر repo: `apps/car-android` — روی سرور مثال: `/opt/car-android`

## خطای `npm run web` روی سرور

| خطا | علت |
|-----|-----|
| `spawn xdg-open ENOENT` | Expo می‌خواهد مرورگر باز کند؛ روی سرور GUI نیست |
| `Running as root without --no-sandbox` | نصب React Native DevTools (Electron) با user root |

**روی سرور از `npm run web` استفاده نکنید.**

```bash
cd /opt/car-android
git pull
npm install
npm run web:server
# بعد از تغییر config یا metro:
npm run web:server -- --clear
```

| اسکریپت | کار |
|---------|-----|
| `web:server` | `BROWSER=none` + `CI=1` + پورت **5038** (۱۳۷ citizen روی 5037 است) |

ترجیح: با user غیر root اجرا کنید.

## nginx (مثال)

پورت Metro: **5038**. دامنهٔ خودتان را جایگزین کنید.

```nginx
location / {
    proxy_pass http://127.0.0.1:5038;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;
}
```

اگر از Expo Router / HMR خطای `Unauthorized request` دیدید، در `app.json` → `extra.router.origin` دامنهٔ HTTPS عمومی را بگذارید (مثل citizen در `apps/android`).

## API

تنظیمات در `app.json` → `extra`: `ssoBaseUrl`, `requestApiUrl`, `carReferralApiUrl`, `carLocationApiUrl`.
