# TODO — Dogosite App (where we left off)

> Handoff document — created 2026-09-11. Read this first when resuming work.

## What this project is

`dogositeapp` is the mobile-app product for the PetPals store. Three pieces in one npm workspace:

| Folder | What | GitHub repo |
| --- | --- | --- |
| `core/` | Shared TS package: types, zod schemas, web DB schema, slug/shipping/currency helpers, fr/en/ar dictionaries, sample data | `theaymanian2803/dogositeapp` |
| `api/` | Hono serverless API (Vercel-ready): public + admin endpoints, JWT auth, Expo push, cron | `theaymanian2803/dogositeapp` |
| `mobile/` | One Expo app: customer storefront + hidden admin, per-client branding via `clients/<slug>.ts` | `theaymanian2803/dogositeapp` |
| `web/` (gitignored) | Reference copy of the web app — **never modify**; canonical web source is `dogositetwo` | `theaymanian2803/dogositetwo` |

The old web app repo is `theaymanian2803/dogositeone` (not part of this project).

## Current status (all green)

- Tests: core **16/16**, api **49/49**, mobile **23/23**, mobile typecheck clean
- Full QA pass done: live API contract test **57/57** checks passed; mobile code audit **0 critical** (3 important + minors all fixed)
- Everything committed and pushed to `main` on GitHub (both repos)

## How to run the local test environment (phone testing)

Two windows must stay open on the PC:

1. **API window** — PowerShell:
```powershell
Set-Location C:\Users\PC\Desktop\dogocat\dogositeapp
# reads TURSO creds from web/.env (VITE_* names) at runtime:
$env:JWT_SECRET = "dev-secret"; $env:CRON_SECRET = "dev-cron"
npm run dev -w api
```
2. **Expo window** — PowerShell:
```powershell
Set-Location C:\Users\PC\Desktop\dogocat\dogositeapp\mobile
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "192.168.100.41"   # PC's LAN IP — check with ipconfig if changed
npx expo start --clear
```

Phone (Expo Go, same Wi-Fi as PC): **Enter URL manually** → `exp://192.168.100.41:8081`

- Admin login: `admin@gmail.com` / `admin123` — hidden "Admin" link at the bottom of the Track tab
- The API client URL is `http://192.168.100.41:8787` in `mobile/clients/petpals.ts` (dev value; production builds use `EXPO_PUBLIC_API_URL` override or per-client config)

## Common gotchas (learned the hard way)

- `expo start` must run in `mobile/`, NOT the `dogositeapp` root — root gives the `expo/AppEntry.js` / `../../App` error
- Two Expo instances can't share port 8081 — kill stale ones before starting (`Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match "expo" } | Stop-Process -Force`)
- Restart Expo with `--clear` after any dependency change (Metro caches module resolution)
- AsyncStorage must stay at 2.2.0 (SDK 57's native version) — `npx expo install` to fix mismatches
- Push notifications don't work in Expo Go (SDK 53+ limitation) — they work in real EAS builds only; the app skips push setup in Expo Go automatically
- If the phone shows errors from an old session, fully close and reopen Expo Go

## Next steps (when you resume)

1. **[You test on the phone]** — walk the storefront: browse → add to cart → checkout (COD) → track; then admin: orders status updates, product creation with photo, reviews moderation. The smoke-matrix runbook is at `docs/SMOKE-MATRIX.md`.
2. **Deploy the API to Vercel** for real clients — follow `docs/DEPLOY-API.md` (Root Directory `api`, Build Command `npm run build:vercel`, env vars, cron-job.org job).
3. **Branding + shipping a client app** — follow `docs/BRANDING-A-CLIENT.md` (add `clients/<slug>.ts`, assets, EAS build, EAS Submit under the client's store accounts).
4. **EAS setup** — create the EAS project (`eas init`) so `eas build`/`eas update` work; needed for push + real builds.
5. **Seed a fresh client DB** — `TURSO_DB_URL=... TURSO_AUTH_TOKEN=... npm run seed -w api` (fresh-DB only; re-running duplicates products/orders).
6. Optional: translate the static info pages (About/FAQ/etc.) — currently English-only, matching the web app.

## Known limitations / deferred

- Info pages content is English-only (web parity; translation is a content task)
- Push notifications need a real EAS build + device (documented in the runbook)
- `web/.env` holds the live Turso token (gitignored) — rotate it before sharing the machine
- Cosmetic backlog (non-blocking): trailing newlines, a11y labels on steppers/stars, `Stars` component duplication, `Loading` centering inside ScrollView, per-line totals in cart summary, `interpolate` regex for digit placeholders

## Useful commands

```powershell
# tests (root builds core first)
npm test
# mobile only
cd mobile; npm test; npm run typecheck
# api only
npm test -w api
# seed
TURSO_DB_URL=... TURSO_AUTH_TOKEN=... npm run seed -w api
# git
git add -A; git commit -m "..."; git push
```