# Dogosite App — Mobile App + API Design

Date: 2026-09-10
Status: Design approved; spec review pending

## 1. Context

PetPals is a React 19 + Vite + Tailwind v4 web storefront and admin dashboard for a
dog & cat pet supplies store. It talks directly to a Turso (libSQL) database from the
browser via `@libsql/client/web`; the database URL and token ship in the frontend env
(`VITE_TURSO_DB_URL`, `VITE_TURSO_AUTH_TOKEN`). There is no backend server.

The product is sold to store owners in two ways:

- Website only — the current product, unchanged.
- Website + mobile app — new offering; the app must share the same data as the website.

This design adds the mobile app as a strictly additive layer. The web app is not
modified, and its current deployment process is unchanged.

## 2. Goals

- A new workspace `dogositeapp` that holds the app work without touching the existing
  web repo (`dogositetwo`).
- A mobile app (customer storefront + hidden admin mode) built once and branded per
  client through configuration.
- The app and the website of the same client read and write the same Turso database.
- Push notification to the owner's device when a new order arrives.
- Per-client deployment: each client gets their own Turso DB, their own API deploy, and
  their own app build.

## 3. Non-goals (deferred to later phases)

- Customer accounts in the app (the web checkout already supports guest checkout, so
  the app ships guest-only in v1).
- Password hashing for `admins` and `users` (would require changing the web app;
  scheduled as phase 2 hardening).
- Homepage builder / site settings editing in the app (stays web-only; the app renders
  whatever the website has configured).
- Card payments (COD only, same as web).
- Offline sync via Turso embedded replicas (TanStack Query's persisted cache is enough
  for v1).
- Multi-tenant single deployment (explicitly per-client databases and deployments).

## 4. Architecture

```
Customer app ─┐
Admin app ────┼──► API (Vercel Functions, Hono) ──► Turso DB (per client)
              │        │
              │        └──► Expo Push Service ──► owner's device
              │
Web storefront + web admin ─────────────────────────► same Turso DB (direct, unchanged)
```

- The web app keeps talking directly to Turso. It is not modified.
- The mobile app never sees the Turso URL or token; it only talks to the API.
- Both surfaces write to the same tables, so data is shared with no sync layer.
- Web-created orders do not notify the API. A free external cron (for example
  cron-job.org) calls the API every 1–2 minutes; the API finds unnotified orders and
  pushes them. App-created orders are pushed immediately.
- Vercel Hobby cron jobs run at most once per day, which is why the external cron is
  used instead of Vercel Cron.

## 5. Repository layout

```
dogositeapp/
  web/                 Reference copy of dogositetwo. Not part of the workspace build.
  core/                Shared TypeScript package (@petpals/core)
  api/                 Hono app deployed as Vercel Functions
  mobile/              Expo app (customer + admin), branded per client
  docs/specs/          Design and planning documents
  package.json         npm workspaces root: ["core", "api", "mobile"]
```

Notes:

- `web/` is a reference copy for porting logic and is excluded from the workspace.
  The canonical web product remains `dogositetwo`; re-copy if the web app changes.
- `api/` and `mobile/` consume `core/` through the npm workspace (`@petpals/core`).
- The web app keeps using bun; the workspace uses npm for maximum Expo tooling
  compatibility.

## 6. Data model

### 6.1 Existing tables (created by the web app, reused as-is)

| Table | Columns |
| --- | --- |
| `admins` | id, email (unique), password |
| `users` | id, email (unique), password, name |
| `reviews` | id, product_id, user_id, user_name, rating, title, body, image_url, status (default `pending`), created_at |
| `settings` | key (PK), value |
| `categories` | id (PK), name, slug (unique) |
| `products` | id (PK), name, slug (unique), description, price, image_url, images, category, badge, tag, created_at |
| `orders` | id (PK), first_name, last_name, phone, address, items (JSON string), total, status (default `new`), created_at |
| `sections` | id, type, name, size, align, image_url, title, subtitle, button_text, button_link, grid_items, columns, product_ids, created_at |

`products.images` and the `sections` columns `align`, `columns`, `product_ids` are added
by the web app's migration code; the API assumes they exist.

### 6.2 API-owned tables

Created idempotently (`CREATE TABLE IF NOT EXISTS`) by the API. The web app ignores them.

```sql
CREATE TABLE IF NOT EXISTS push_tokens (
  id         TEXT PRIMARY KEY,
  token      TEXT NOT NULL UNIQUE,
  platform   TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notified_orders (
  order_id   TEXT PRIMARY KEY,
  notified_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

- `push_tokens` — Expo push tokens registered by admin devices.
- `notified_orders` — dedupe guard so an order is pushed at most once, whether it was
  created in the app (immediate push) or on the web (cron push).

## 7. API (`api/`)

- Stack: Hono on Vercel Functions, Node.js runtime, `@libsql/client`, `zod` validation.
- All responses are JSON. Errors: `{ "error": "message" }` with 400 (validation),
  401 (auth), 404 (missing), 500 (server).
- CORS: permissive (native apps do not send an Origin header; permissive also helps
  local development).
- Admin auth: `POST /auth/admin/login` checks the same `admins` table as the web app
  and returns a JWT (HS256, 30-day expiry, signed with `JWT_SECRET`). Admin routes
  require `Authorization: Bearer <token>`.
- Env vars per client: `TURSO_DB_URL`, `TURSO_AUTH_TOKEN`, `JWT_SECRET`, `CRON_SECRET`.

### 7.1 Public endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/products` | List products. Filters: `category`, `q` (name/category/tag LIKE), `ids` (comma-separated), `limit`. |
| GET | `/products/:slug` | One product by slug, plus up to 4 related products (same category) and approved reviews. |
| GET | `/categories` | All categories ordered by name. |
| GET | `/settings` | All settings as a key/value object. |
| GET | `/sections` | Homepage sections ordered by `created_at`. |
| GET | `/reviews` | Approved reviews. Optional `product_id`, `limit`. |
| POST | `/reviews` | Create a review with status `pending`. Body: `product_id`, `user_name`, `rating`, `title`, `body`, `image_url?`. |
| POST | `/orders` | Create a COD order. Body: `first_name`, `last_name`, `phone`, `address`, `items`, `total`. Returns `{ id }`. Triggers an immediate push to registered admin devices. |
| GET | `/orders/track` | Orders for a phone number, newest first. Query: `phone`. |

### 7.2 Admin endpoints (JWT)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/auth/admin/login` | Body: `email`, `password`. Returns `{ token, email }`. |
| GET | `/auth/admin/me` | Validates the token; returns `{ email }`. |
| GET | `/admin/orders` | List orders, newest first. Optional `status` filter. |
| PATCH | `/admin/orders/:id` | Body: `status`. |
| DELETE | `/admin/orders/:id` | Delete an order. |
| GET | `/admin/products` | List products, newest first. |
| POST | `/admin/products` | Create product. Body: `name`, `description`, `price`, `image_url`, `images?`, `category`, `badge?`, `tag?`. Slug = `slugify(name) + "-" + 4 random base36 chars`, exactly as web. |
| PATCH | `/admin/products/:id` | Update the same fields. |
| DELETE | `/admin/products/:id` | Delete product. |
| GET | `/admin/categories` | List categories. |
| POST | `/admin/categories` | Body: `name`. Slug = `slugify(name)`, exactly as web. |
| DELETE | `/admin/categories/:id` | Delete category. |
| GET | `/admin/reviews` | All reviews with product name, newest first. |
| PATCH | `/admin/reviews/:id` | Body: `status` (`approved` / `pending`). |
| DELETE | `/admin/reviews/:id` | Delete review. |
| POST | `/admin/push/register` | Body: `token`, `platform` (`ios` / `android`). Upserts the token. |

`slugify` (ported from web): lowercase, trim, replace runs of characters outside
`[a-z0-9]` with `-`, then strip leading/trailing `-`.

### 7.3 Cron endpoint

| Method | Path | Description |
| --- | --- | --- |
| GET | `/cron/new-orders` | Requires `?secret=CRON_SECRET`. Finds orders created in the last 24 hours whose id is not in `notified_orders`, sends one Expo push per order, and records each in `notified_orders`. |

Push sending uses the Expo Push API (`https://exp.host/--/api/v2/push/send`). Invalid
tokens reported by Expo are removed from `push_tokens`.

## 8. Mobile app (`mobile/`)

### 8.1 Stack

- Expo (latest SDK) + expo-router, TypeScript.
- UI: NativeWind v4 + react-native-reusables (shadcn-style components), lucide-react-native
  icons, sonner-native toasts, @gorhom/bottom-sheet for dialogs/sheets.
- Forms and data: react-hook-form + zod (same patterns as web), TanStack Query with an
  AsyncStorage persister.
- Device: expo-image, expo-image-picker + expo-image-manipulator (admin product images),
  expo-secure-store (admin session), expo-notifications, expo-localization.
- Cart and language preference persist in AsyncStorage.

### 8.2 Navigation

```
(tabs)                 Home | Shop | Cart | Track
product/[slug]         Product detail (gallery, related, reviews, add to cart)
category/[category]    Category listing
checkout               Guest checkout (COD)
order-confirmed        Confirmation with link to Track
info/[page]            Info pages (port of web infoPages)
(admin)/login          Admin login
(admin)/(tabs)         Orders | Products | Categories | Reviews
```

- The admin area is not visible to customers. Entry points: a discreet "Admin" link in
  the Track/More area and a deep link (`<scheme>://admin`). Once logged in, the admin
  tab set replaces the customer tabs until logout.
- Home renders the same section types as web (hero, categories, products, promo, best,
  reviews) natively, in the order and visibility defined by the `homepage_sections`
  setting. Unknown section types are skipped.

### 8.3 Feature parity (customer mode)

- Home, Shop (search + category filters), Product detail (gallery, related, review
  submission), Category, Cart, Checkout (guest, COD, shipping fee from settings),
  Order confirmed, Track by phone, Info pages, WhatsApp contact, fr/en/ar with RTL.
- Currency formatting ports `lib/currency.ts`; shipping rules port `lib/shipping.ts`
  (threshold and fee from settings).
- Settings from the API are merged over the default settings object ported into
  `core/`, so missing keys fall back to the same defaults the web app uses.

### 8.4 Admin mode

- Orders: list with status chips, pull-to-refresh, status update, delete with
  confirmation. Primary tab.
- Products: list, create, edit, delete; image via photo picker (resized/compressed to
  stay under 2 MB, stored as base64 data URL in `image_url`, same rule as web) or image
  URL; slug auto-generated; fields match the web form.
- Categories: list, add, delete (same capabilities as web).
- Reviews: approve/pending toggle, delete.
- Push: after admin login, request notification permission and register the Expo push
  token with `POST /admin/push/register`. Android notification channel configured.

### 8.5 Internationalization and RTL

- Dictionaries copied from `web/src/lib/i18n.tsx` into `core/`.
- Default language comes from the client config; the user's choice persists in
  AsyncStorage.
- Arabic uses RTL via `I18nManager` (`allowRTL`, `forceRTL`). Changing language to or
  from Arabic requires an app reload; the app prompts the user and reloads.

### 8.6 Per-client branding

`mobile/clients/<slug>.ts`:

```ts
export default {
  slug: "petpals",
  appName: "PetPals",
  scheme: "petpals",
  iosBundleId: "com.petpals.app",
  androidPackage: "com.petpals.app",
  apiUrl: "https://petpals-api.vercel.app",
  defaultLanguage: "fr",
  currency: "MAD",
  colors: {
    accent: "#2F6B58",
    background: "#FFFFFF",
    foreground: "#1C3B31",
    secondary: "#F4F6F5",
    muted: "#F3F5F4",
    card: "#FFFFFF",
    border: "#E4E8E6",
  },
  assets: {
    icon: "./assets/clients/petpals/icon.png",
    splash: "./assets/clients/petpals/splash.png",
    logo: "./assets/clients/petpals/logo.png",
  },
};
```

- Colors are hex. The web app defines its tokens in `oklch`, which React Native does not
  support; each client's tokens are converted to hex once (the values above are
  approximations of the current PetPals tokens).
- `EXPO_PUBLIC_CLIENT=<slug>` selects the config at build time (default: `petpals`).
- `app.config.ts` derives the app name, scheme, bundle identifiers, icon, splash, and
  theme from the selected config.
- `eas.json` production profile passes `EXPO_PUBLIC_CLIENT` per client.

### 8.7 Delivery

- EAS Build for iOS and Android (cloud builds; no Mac required).
- EAS Submit for store uploads.
- EAS Update for JS-only fixes without a store re-review.
- Each client's app is published under the client's Apple/Google developer accounts
  (Apple: $99/year; Google: $25 one-time), with unique bundle IDs/package names.

## 9. Shared core (`core/`)

- `src/types.ts` — Product, Category, Order, OrderItem, Review, Settings, Section.
- `src/schemas.ts` — zod schemas: order creation, review creation, product upsert,
  category creation, admin login.
- `src/shipping.ts`, `src/currency.ts` — ported from web `lib/`.
- `src/i18n/` — fr/en/ar dictionaries ported from web `lib/i18n.tsx`.
- Consumed by `api/` and `mobile/` as `@petpals/core`.

## 10. Per-client workflow

1. Create the client's Turso database; run schema and seed (seed scripts adapted from
   `web/scripts/`, run with bun against the client DB).
2. Deploy the website exactly as today.
3. Deploy the API: Vercel project rooted at `api/`; set `TURSO_DB_URL`,
   `TURSO_AUTH_TOKEN`, `JWT_SECRET`, `CRON_SECRET`. The API creates its own tables on
   first request.
4. Create the external cron job: `GET https://<api-host>/cron/new-orders?secret=...`
   every 1–2 minutes.
5. Add `mobile/clients/<slug>.ts` and brand assets, then
   `EXPO_PUBLIC_CLIENT=<slug> eas build --profile production --platform all`.
6. `eas submit` to the client's store accounts.
7. Later fixes: `eas update` for JS changes; rebuild for native or config changes.

## 11. Security and known tradeoffs

- The Turso URL and token exist only in the API environment; they are never bundled
  into the app.
- Admin sessions are JWTs stored in expo-secure-store; `JWT_SECRET` is unique per client.
- The cron endpoint is protected by `CRON_SECRET`.
- Accepted tradeoff for v1: admin and user passwords remain plaintext, matching the web
  app exactly (login parity). Hashing both sides is phase 2 and requires a web app
  change.
- Accepted tradeoff for v1: `POST /reviews` is public like the web app; no rate limiting
  in v1.
- `web/` inside the workspace is a copy. It must never be deployed from here; the
  canonical web source is `dogositetwo`.

## 12. Testing and verification

- API: Vitest against a local libSQL file database (`file:test.db`); endpoint tests plus
  push dedupe logic with the Expo push HTTP call mocked.
- Mobile: Jest + React Native Testing Library for cart, shipping, currency, and i18n
  logic; manual smoke tests with an Expo development build against a development Turso
  database.
- Manual smoke matrix:
  - Order placed in the app appears in the web admin.
  - Order placed on the web appears in the app admin and triggers a push within 2 minutes.
  - Status change in the app is reflected on the web.
  - Product created in the app (with photo) appears on the web storefront.
  - fr/en/ar switching works, including RTL layout for Arabic.
  - Admin mode is inaccessible without login.

## 13. Delivery sequence

1. Workspace root, `core/` package, API skeleton with schema bootstrap.
2. Public endpoints (products, categories, settings, sections, reviews, orders, track).
3. Admin auth and admin endpoints.
4. Push notifications (register, immediate send, cron).
5. Mobile customer mode.
6. Mobile admin mode.
7. Per-client branding, EAS configuration, per-client workflow docs.
