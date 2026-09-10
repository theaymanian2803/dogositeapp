# PetPals Mobile App — Manual Smoke Matrix

This is the manual device-verification runbook for the PetPals mobile app
(plan: `docs/plans/2026-09-10-mobile-app.md`, task 20, step 2). All automated
checks already pass (`npm test` at the repo root; `npm test` + `npm run typecheck`
in `mobile/`). The 7 checks below require a running API, the web admin, and a
physical device or emulator — they cannot be executed headlessly.

---

## 0. Environment setup

### 0.1 API (local dev server)

The app's data all lives in a Turso database; the API reads/writes it and
drives the push notifications.

```powershell
# from dogositeapp/
$env:TURSO_DB_URL = "libsql://<your-db>.turso.io"
$env:TURSO_AUTH_TOKEN = "<your-turso-token>"
# optional (safe dev defaults exist): $env:JWT_SECRET = "dev-secret"; $env:CRON_SECRET = "dev-cron"
npm run dev -w api
```

- Required: `TURSO_DB_URL`, `TURSO_AUTH_TOKEN` (the same DB the web app uses —
  see `web/.env`). The server throws at startup if `TURSO_DB_URL` is missing.
- Defaults if unset: `JWT_SECRET=dev-secret`, `CRON_SECRET=dev-cron`,
  port `8787`.
- Expected: logs `API listening on http://localhost:8787`.
- Verify: `GET http://localhost:8787/health` returns `{"ok":true}`.

### 0.2 Seed the database (first run only)

```powershell
$env:TURSO_DB_URL = "libsql://<your-db>.turso.io"
$env:TURSO_AUTH_TOKEN = "<your-turso-token>"
npm run seed -w api
```

Creates the admin account **admin@gmail.com / admin123** and demo products.
Re-running duplicates products/orders (reviews are idempotent).

### 0.3 Web admin + storefront (for checks 1–4)

```powershell
# from dogositeapp/web/
npm run dev
```

- Uses `web/.env` (`VITE_TURSO_DB_URL`, `VITE_TURSO_AUTH_TOKEN`) to talk to the
  **same Turso database** as the API.
- Web admin: `http://localhost:5173/admin`. Sign in with admin@gmail.com /
  admin123.
- Vite picks the port (5173 by default; the terminal prints the exact URL).

### 0.4 Mobile app

```powershell
# from dogositeapp/mobile/
npx expo start
```

- Press `a` (Android emulator) / `i` (iOS simulator), or scan the QR with the
  Expo Go app on a physical device (both phone and computer on the same Wi-Fi).
- **API URL for the app:** the app reads `apiUrl` from
  `mobile/clients/petpals.ts` (default `http://localhost:8787`).
  - Android emulator: `localhost` reaches your machine — no change needed.
  - Physical device: change `apiUrl` to your computer's LAN IP, e.g.
    `http://192.168.1.42:8787`, then restart `expo start`. (On Windows, find it
    with `ipconfig` — the IPv4 of your Wi-Fi adapter.)
- The app is pre-branded for the `petpals` client (scheme `petpals://`,
  default language French, currency MAD).

### 0.5 Push notifications (only check 2)

Push only works on a **physical device** (never an emulator) and requires an
EAS project:

```powershell
# from dogositeapp/mobile/
$env:EAS_PROJECT_ID = "<your-eas-project-id>"   # must be set BEFORE expo start
npx expo start
```

- The device must be running a development build (or an EAS build) — Expo Go
  does not receive remote push notifications.
- The admin device registers its Expo push token automatically the first time
  the **admin area** is opened while signed in (`lib/push.ts`).
- See `docs/DEPLOY-API.md` for the production push/cron setup; the steps below
  cover the local equivalent.

---

## The 7 checks

### Check 1 — Order placed in the app appears in the web admin

1. In the app: add a product to the cart, check out (COD), complete the order.
2. In the browser: open the web admin (`http://localhost:5173/admin`).

**Expected:** the order (items, customer name, phone, total) appears in the
web admin order list shortly after placement.

### Check 2 — Order placed on the web appears in the app admin and triggers a push

1. Open the web storefront (`http://localhost:5173`), place an order as a guest.
2. In the app: sign in to the admin area (Track tab → `Admin` → login with
   admin@gmail.com / admin123).
3. Make sure the API-side "cron" runs at least once per minute (it is the
   only thing that detects web orders and sends the push):
   - Local equivalent of the production cron-job.org job: hit
     `http://localhost:8787/cron/new-orders?secret=dev-cron` every ~60s, e.g. a
     PowerShell loop:
     ```powershell
     while ($true) { Invoke-RestMethod "http://localhost:8787/cron/new-orders?secret=dev-cron"; Start-Sleep -Seconds 60 }
     ```
     (Or use cron-job.org against a publicly reachable dev tunnel.)
4. Keep the app open (or foregrounded) with the admin signed in.

**Expected:** within 2 minutes of placing the web order, the app admin order
list shows the order, and the device receives a push notification
("New order — You have a new order in the app").

### Check 3 — Status change in the app is reflected on the web

1. In the app admin (Orders tab), change an order's status (e.g. `new` →
   `processing` → `shipped`).
2. In the browser, refresh the web admin order list.

**Expected:** the web admin shows the same status the app set.

### Check 4 — Product created in the app (with photo) appears on the web storefront

1. In the app admin (Products tab): create a product, pick a photo from the
   gallery, save.
2. In the browser: refresh the web storefront (`http://localhost:5173`) and
   search/browse for the new product.

**Expected:** the product (name, price, category, photo) is live on the web
storefront.

### Check 5 — fr/en/ar switching works, including RTL for Arabic

1. In the app, open the **Track tab** — the language selector
   (Français / English / العربية) sits above the faint "Admin" link.
2. Tap **English**: UI text switches to English immediately.
3. Tap **العربية**: UI switches to Arabic **and the app reloads** with an
   RTL (right-to-left) layout — text and icons mirror to the right.
4. Tap **Français**: app reloads back to LTR French.

**Expected:** every screen reflects the chosen language; switching to/from
Arabic triggers an app reload; Arabic layout is right-to-left. (Switching
English ↔ French does not reload.)

### Check 6 — Admin area is inaccessible without login; deep link opens login

1. Close/reopen the app so no admin session remains (or clear app data).
2. Tap the faint **Admin** link on the Track tab.

**Expected:** you are redirected to the admin **login** screen, never the
admin content.

3. With the app open, open the deep link `petpals://admin` (on Android:
   `adb shell am start -a android.intent.action.VIEW -d "petpals://admin"`; on
   iOS: `xcrun simctl openurl booted "petpals://admin"` or Safari on a device).

**Expected:** the app opens on the admin login screen (not signed in) or the
admin Orders tab (already signed in).

### Check 7 — Cart and language survive an app restart

1. Add at least one product to the cart.
2. Switch the language to English (or Arabic).
3. Fully kill the app (swipe from recents) and reopen it.

**Expected:** the cart badge/count and the cart contents are intact, and the
app still shows the chosen language (no reset to French).

---

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| App can't reach the API | Wrong `apiUrl` (physical device needs your LAN IP, not `localhost`); API not running; Windows Firewall blocking port 8787. |
| `Missing TURSO_DB_URL` at API startup | Set `TURSO_DB_URL` + `TURSO_AUTH_TOKEN` before `npm run dev -w api` (same DB as `web/.env`). |
| No push received (check 2) | Must be a physical device with an EAS development build (Expo Go doesn't get remote pushes); `EAS_PROJECT_ID` must be set before `expo start`; admin must be signed in once so the token registers; cron must actually run every ~60s. |
| No language selector visible | It lives at the bottom of the Track tab, above the faint Admin link — scroll down. |
| Deep link does nothing | The app must be installed with the `petpals` scheme (development/EAS build, not Expo Go) — see check 6. |