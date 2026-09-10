# Branding and shipping the app for a new client

1. Add `mobile/clients/<slug>.ts` (copy `petpals.ts`) with the client's name, scheme,
   bundle IDs, API URL, language, currency, hex colors and asset paths.
2. Add `mobile/assets/clients/<slug>/` with `icon.png` (1024x1024), `splash.png` and
   `logo.png`.
3. In `mobile/eas.json`, add a build profile (or change the `EXPO_PUBLIC_CLIENT` env
   value) for the client's slug.
4. Run `npm install -w mobile` (if new packages were added), then
   `EXPO_PUBLIC_CLIENT=<slug> npm run build:client -w mobile`.
5. Submit with `eas submit -p ios` / `-p android` using the client's store accounts.
6. JS-only fixes afterwards: `EXPO_PUBLIC_CLIENT=<slug> npm run update:client -w mobile`.

Note: `apiUrl` in the client config must point at that client's API deployment.