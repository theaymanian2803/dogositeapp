# Mobile App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one Expo mobile app (customer storefront + hidden admin mode) that is branded per client through a config file and talks to the client's own API from the core+API plan.

**Architecture:** Expo + expo-router inside the `dogositeapp` npm workspace, consuming `@petpals/core` for types, schemas, dictionaries and helpers. TanStack Query fetches from the client's API URL; cart and language persist in AsyncStorage; the admin JWT lives in expo-secure-store. Brand colors come from `clients/<slug>.ts` at runtime through a theme provider, so one codebase serves many clients.

**Tech Stack:** Expo (latest SDK) + expo-router, TypeScript, NativeWind v4, TanStack Query + AsyncStorage persister, react-hook-form + zod, expo-secure-store, expo-notifications, expo-image-picker, expo-image-manipulator, Jest + React Native Testing Library.

**Spec:** `docs/specs/2026-09-10-dogositeapp-mobile-app-design.md`
**Depends on:** `docs/plans/2026-09-10-core-api.md` (core package and API must exist and pass tests).

## Global Constraints

- Work only inside `dogositeapp/mobile` (plus the root `package.json` workspaces entry); never modify `web/`.
- npm only (not bun) for the mobile workspace.
- TypeScript strict; all server data goes through the API (never direct Turso access).
- Brand colors are hex, provided by the client config at runtime — no hardcoded brand hex in components.
- Every user-visible string uses the i18n `t()` helper (fr/en/ar); no literal copy in components.
- UI conventions: screens use the `Screen` wrapper, `useTheme()` colors (no hardcoded brand hex), and the primitives from Task 5. Use the web pages in `web/src/pages/` as the parity reference for layout and behavior.
- Admin area is unreachable without a valid session; the JWT lives only in expo-secure-store.
- Image uploads for products stay under 2 MB (resize + compress, then base64 data URL).
- Verification for every task: `npm run typecheck -w mobile` plus the task's tests.
- Commit after every task with a conventional message.

---

### Task 1: Mobile workspace + Expo scaffold + NativeWind

**Files:**
- Modify: `package.json` (root — add `mobile` to workspaces)
- Create: `mobile/` (via create-expo-app), `mobile/metro.config.js`, `mobile/babel.config.js`, `mobile/tailwind.config.js`, `mobile/global.css`, `mobile/.gitignore`
- Modify: `mobile/app/_layout.tsx` (import global.css)
- Modify: `mobile/package.json` (scripts: `typecheck`, `test`)

**Interfaces:**
- Consumes: `@petpals/core` (workspace package).
- Produces: a bundling Expo app with NativeWind configured; workspace wiring for all later tasks.

- [ ] **Step 1: Create the Expo app without installing**

Run (from `dogositeapp/`):
```bash
npx create-expo-app@latest mobile --template default --no-install
```

- [ ] **Step 2: Add mobile to the workspace and install**

Root `package.json` → `"workspaces": ["core", "api", "mobile"]`.

`mobile/package.json` → add `"@petpals/core": "*"` to dependencies, plus scripts:
```json
"typecheck": "tsc --noEmit",
"test": "jest"
```

Run (from `dogositeapp/`): `npm install`

- [ ] **Step 3: Install NativeWind and test tooling**

Run (from `dogositeapp/mobile/`):
```bash
npx expo install nativewind tailwindcss react-native-reanimated react-native-safe-area-context expo-image
npx expo install --dev jest-expo jest @types/jest @testing-library/react-native
```

- [ ] **Step 4: Configure NativeWind**

`mobile/babel.config.js`:
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

`mobile/metro.config.js`:
```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = withNativeWind(config, { input: "./global.css" });
```

`mobile/tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
};
```

`mobile/global.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`mobile/app/_layout.tsx` — first line: `import "../global.css";`

- [ ] **Step 5: Configure Jest and typecheck**

`mobile/package.json` → add:
```json
"jest": {
  "preset": "jest-expo",
  "transformIgnorePatterns": [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|nativewind|@petpals/core))"
  ]
}
```

- [ ] **Step 6: Verify bundling**

Run (from `dogositeapp/mobile/`):
```bash
npm run typecheck
npx expo export --platform ios --output-dir .expo-smoke
```
Expected: typecheck clean; export completes. Delete `.expo-smoke` afterwards.

- [ ] **Step 7: Commit**

```bash
git add package.json mobile
git commit -m "feat(mobile): scaffold Expo app with NativeWind in workspace"
```

---

### Task 2: Client config, app config, runtime theme

**Files:**
- Create: `mobile/clients/petpals.ts`
- Create: `mobile/app.config.ts` (replaces `app.json` usage), delete `mobile/app.json` if present
- Create: `mobile/theme/theme.tsx`
- Test: `mobile/theme/theme.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ClientConfig` type + `petpals` config; `getClientConfig(): ClientConfig` reads `EXPO_PUBLIC_CLIENT`.
  - `ThemeProvider` + `useTheme(): { colors: ClientConfig["colors"]; currency: string }`.

- [ ] **Step 1: Write the failing test `mobile/theme/theme.test.ts`**

```ts
import { resolveClient } from "./resolveClient";

const clients = {
  petpals: { slug: "petpals", appName: "PetPals" },
  other: { slug: "other", appName: "Other" },
} as const;

describe("resolveClient", () => {
  it("returns the requested client", () => {
    expect(resolveClient(clients, "other").appName).toBe("Other");
  });
  it("falls back to petpals for unknown or missing slugs", () => {
    expect(resolveClient(clients, "nope").appName).toBe("PetPals");
    expect(resolveClient(clients, undefined).appName).toBe("PetPals");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w mobile`
Expected: FAIL — cannot resolve `./resolveClient`.

- [ ] **Step 3: Implement the config system**

`mobile/clients/petpals.ts`:
```ts
export type ClientConfig = {
  slug: string;
  appName: string;
  scheme: string;
  iosBundleId: string;
  androidPackage: string;
  apiUrl: string;
  defaultLanguage: "en" | "fr" | "ar";
  currency: string;
  colors: {
    accent: string;
    background: string;
    foreground: string;
    secondary: string;
    muted: string;
    card: string;
    border: string;
  };
  assets: { icon: string; splash: string; logo: string };
};

export const petpals: ClientConfig = {
  slug: "petpals",
  appName: "PetPals",
  scheme: "petpals",
  iosBundleId: "com.petpals.app",
  androidPackage: "com.petpals.app",
  apiUrl: "http://localhost:8787",
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

`mobile/theme/resolveClient.ts`:
```ts
export function resolveClient<T extends { slug: string }>(
  clients: Record<string, T>,
  slug: string | undefined,
): T {
  const fallbackKey = Object.keys(clients)[0];
  return (slug && clients[slug]) || clients[fallbackKey];
}
```

`mobile/app.config.ts`:
```ts
import type { ExpoConfig } from "expo/config";
import { petpals } from "./clients/petpals";
import { resolveClient } from "./theme/resolveClient";

const clients = { petpals };
const client = resolveClient(clients, process.env.EXPO_PUBLIC_CLIENT);

const config: ExpoConfig = {
  name: client.appName,
  slug: client.slug,
  scheme: client.scheme,
  icon: client.assets.icon,
  userInterfaceStyle: "light",
  splash: {
    image: client.assets.splash,
    resizeMode: "contain",
    backgroundColor: client.colors.background,
  },
  ios: { bundleIdentifier: client.iosBundleId, supportsTablet: true },
  android: { package: client.androidPackage },
  plugins: ["expo-router", "expo-secure-store", "expo-notifications", "expo-localization"],
  experiments: { typedRoutes: true },
  extra: {
    client: client.slug,
    apiUrl: client.apiUrl,
    defaultLanguage: client.defaultLanguage,
    currency: client.currency,
    eas: { projectId: process.env.EAS_PROJECT_ID },
  },
};

export default config;
```

Delete `mobile/app.json` (app.config.ts replaces it).

- [ ] **Step 4: Copy placeholder brand assets**

Create `mobile/assets/clients/petpals/` and copy the template's `assets/icon.png` and
`splash-icon.png` there as `icon.png` and `splash.png`; copy the template logo if present
(else reuse icon.png as `logo.png`). Later clients get their own folder.

- [ ] **Step 5: Implement `mobile/theme/theme.tsx`**

```tsx
import { createContext, useContext, type ReactNode } from "react";
import Constants from "expo-constants";
import { petpals, type ClientConfig } from "../clients/petpals";

type ThemeValue = { colors: ClientConfig["colors"]; currency: string };

const ThemeContext = createContext<ThemeValue>({
  colors: petpals.colors,
  currency: petpals.currency,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const extra = Constants.expoConfig?.extra ?? {};
  const colors = petpals.colors;
  const currency = typeof extra.currency === "string" ? extra.currency : petpals.currency;
  return (
    <ThemeContext.Provider value={{ colors, currency }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

- [ ] **Step 6: Run tests + verify config**

Run: `npm test -w mobile && npx expo config --type public`
Expected: tests PASS; config output shows `name: "PetPals"`.

- [ ] **Step 7: Commit**

```bash
git add mobile
git commit -m "feat(mobile): add per-client config and runtime theme"
```

---

### Task 3: API client, providers, i18n, cart

**Files:**
- Create: `mobile/lib/api.ts`
- Create: `mobile/lib/i18n.tsx`
- Create: `mobile/lib/cart.tsx`
- Create: `mobile/components/AppProviders.tsx`
- Modify: `mobile/app/_layout.tsx`
- Test: `mobile/lib/api.test.ts`, `mobile/lib/i18n.test.ts`, `mobile/lib/cart.test.ts`

**Interfaces:**
- Consumes: `@petpals/core` (`getDict`, `LANGS`, `Lang`, `CartItem` shape), `resolveClient`.
- Produces:
  - `apiFetch<T>(path, init?): Promise<T>`, `adminFetch<T>(path, init?): Promise<T>` (adds Bearer token), `apiBaseUrl()`
  - `useI18n(): { lang: Lang; setLang(l: Lang): Promise<void>; t(key: string, vars?: Record<string, string>): string }`
  - `useCart(): { items: CartItem[]; count: number; subtotal: number; add(item, qty?): void; remove(id): void; setQty(id, qty): void; clear(): void }`
  - `AppProviders` wrapping QueryClient (AsyncStorage-persisted), Theme, I18n, Cart.

- [ ] **Step 1: Write the failing tests**

`mobile/lib/api.test.ts`:
```ts
import { buildUrl, parseError } from "./api";

describe("buildUrl", () => {
  it("joins base and path", () => {
    expect(buildUrl("https://x.dev", "/products")).toBe("https://x.dev/products");
    expect(buildUrl("https://x.dev/", "products?q=a")).toBe("https://x.dev/products?q=a");
  });
});

describe("parseError", () => {
  it("reads the error field from JSON bodies", async () => {
    const res = new Response(JSON.stringify({ error: "Nope" }), { status: 400 });
    await expect(parseError(res)).resolves.toBe("Nope");
  });
  it("falls back to the status", async () => {
    const res = new Response("bad", { status: 500 });
    await expect(parseError(res)).resolves.toBe("Request failed (500)");
  });
});
```

`mobile/lib/i18n.test.ts`:
```ts
import { interpolate, makeT } from "./i18n";

describe("makeT", () => {
  it("translates and falls back to the key", () => {
    const t = makeT({ "nav.home": "Home" });
    expect(t("nav.home")).toBe("Home");
    expect(t("missing.key")).toBe("missing.key");
  });
  it("interpolates variables", () => {
    const t = makeT({ "trust.free": "Free over {threshold} MAD" });
    expect(t("trust.free", { threshold: "500" })).toBe("Free over 500 MAD");
  });
});

describe("interpolate", () => {
  it("leaves unknown placeholders intact", () => {
    expect(interpolate("Hi {name}", {})).toBe("Hi {name}");
  });
});
```

`mobile/lib/cart.test.ts`:
```ts
import { cartReducer, initialCart } from "./cart";

const item = { id: "p1", name: "Food", slug: "food", price: 10, image_url: "i" };

describe("cartReducer", () => {
  it("adds items and merges duplicates", () => {
    let state = cartReducer(initialCart, { type: "add", item });
    state = cartReducer(state, { type: "add", item, qty: 2 });
    expect(state.items).toHaveLength(1);
    expect(state.items[0].qty).toBe(3);
  });
  it("removes and clamps quantity", () => {
    let state = cartReducer(initialCart, { type: "add", item });
    state = cartReducer(state, { type: "setQty", id: "p1", qty: 0 });
    expect(state.items[0].qty).toBe(1);
    state = cartReducer(state, { type: "remove", id: "p1" });
    expect(state.items).toHaveLength(0);
  });
  it("computes count and subtotal", () => {
    let state = cartReducer(initialCart, { type: "add", item, qty: 2 });
    state = cartReducer(state, { type: "add", item: { ...item, id: "p2", price: 5 } });
    expect(state.count).toBe(3);
    expect(state.subtotal).toBe(25);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -w mobile`
Expected: FAIL — modules missing.

- [ ] **Step 3: Implement `mobile/lib/api.ts`**

```ts
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const ADMIN_TOKEN_KEY = "petpals_admin_token";

export function apiBaseUrl(): string {
  const extra = Constants.expoConfig?.extra ?? {};
  return typeof extra.apiUrl === "string" ? extra.apiUrl : "http://localhost:8787";
}

export function buildUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) return body.error;
  } catch {
    /* ignore */
  }
  return `Request failed (${res.status})`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(buildUrl(apiBaseUrl(), path), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(await parseError(res));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function getAdminToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ADMIN_TOKEN_KEY);
}

export async function setAdminToken(token: string | null): Promise<void> {
  if (token) await SecureStore.setItemAsync(ADMIN_TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(ADMIN_TOKEN_KEY);
}

export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAdminToken();
  return apiFetch<T>(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
```

- [ ] **Step 4: Implement `mobile/lib/i18n.tsx`**

```tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Alert, DevSettings, I18nManager } from "react-native";
import * as Updates from "expo-updates";
import { getDict, type Lang } from "@petpals/core";

const STORAGE_KEY = "petpals_lang";

async function applyRtl(next: Lang): Promise<void> {
  const shouldRtl = next === "ar";
  if (I18nManager.isRTL === shouldRtl) return;
  I18nManager.allowRTL(shouldRtl);
  I18nManager.forceRTL(shouldRtl);
  try {
    if (__DEV__) DevSettings.reload();
    else await Updates.reloadAsync();
  } catch {
    Alert.alert("Restart required", "Please restart the app to apply the layout direction.");
  }
}

export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{([a-z_]+)\}/g, (match, name: string) =>
    vars[name] !== undefined ? vars[name] : match,
  );
}

export function makeT(dict: Record<string, string>) {
  return (key: string, vars?: Record<string, string>): string => {
    const template = dict[key] ?? key;
    return vars ? interpolate(template, vars) : template;
  };
}

type I18nValue = {
  lang: Lang;
  setLang: (lang: Lang) => Promise<void>;
  t: (key: string, vars?: Record<string, string>) => string;
};

const I18nContext = createContext<I18nValue>({
  lang: "fr",
  setLang: async () => {},
  t: makeT(getDict("fr")),
});

export function I18nProvider({
  defaultLanguage,
  children,
}: {
  defaultLanguage: Lang;
  children: ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(defaultLanguage);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "en" || stored === "fr" || stored === "ar") setLangState(stored);
    });
  }, []);

  const setLang = useCallback(async (next: Lang) => {
    setLangState(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
    await applyRtl(next);
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, t: makeT(getDict(lang)) }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
```

- [ ] **Step 5: Implement `mobile/lib/cart.tsx`**

```tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string;
  qty: number;
};

export type CartState = { items: CartItem[]; count: number; subtotal: number };

type CartAction =
  | { type: "add"; item: Omit<CartItem, "qty">; qty?: number }
  | { type: "remove"; id: string }
  | { type: "setQty"; id: string; qty: number }
  | { type: "clear" };

export const initialCart: CartState = { items: [], count: 0, subtotal: 0 };

function withTotals(items: CartItem[]): CartState {
  return {
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal: items.reduce((s, i) => s + i.qty * Number(i.price), 0),
  };
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "add": {
      const qty = action.qty ?? 1;
      const existing = state.items.find((i) => i.id === action.item.id);
      const items = existing
        ? state.items.map((i) => (i.id === action.item.id ? { ...i, qty: i.qty + qty } : i))
        : [...state.items, { ...action.item, qty }];
      return withTotals(items);
    }
    case "remove":
      return withTotals(state.items.filter((i) => i.id !== action.id));
    case "setQty":
      return withTotals(
        state.items.map((i) => (i.id === action.id ? { ...i, qty: Math.max(1, action.qty) } : i)),
      );
    case "clear":
      return initialCart;
  }
}

const STORAGE_KEY = "petpals_cart";

type CartValue = CartState & {
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue>({
  ...initialCart,
  add: () => {},
  remove: () => {},
  setQty: () => {},
  clear: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(initialCart);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        setState(withTotals(JSON.parse(raw) as CartItem[]));
      } catch {
        /* ignore */
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.items)).catch(() => {});
  }, [state.items]);

  const add = useCallback(
    (item: Omit<CartItem, "qty">, qty?: number) =>
      setState((s) => cartReducer(s, { type: "add", item, qty })),
    [],
  );
  const remove = useCallback((id: string) => setState((s) => cartReducer(s, { type: "remove", id })), []);
  const setQty = useCallback(
    (id: string, qty: number) => setState((s) => cartReducer(s, { type: "setQty", id, qty })),
    [],
  );
  const clear = useCallback(() => setState((s) => cartReducer(s, { type: "clear" })), []);

  const value = useMemo(
    () => ({ ...state, add, remove, setQty, clear }),
    [state, add, remove, setQty, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
```

- [ ] **Step 6: Implement `mobile/components/AppProviders.tsx`**

```tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import Constants from "expo-constants";
import type { ReactNode } from "react";
import type { Lang } from "@petpals/core";
import { CartProvider } from "../lib/cart";
import { I18nProvider } from "../lib/i18n";
import { ThemeProvider } from "../theme/theme";
import { petpals } from "../clients/petpals";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "petpals_query_cache",
});

export function AppProviders({ children }: { children: ReactNode }) {
  const extra = Constants.expoConfig?.extra ?? {};
  const defaultLanguage = (extra.defaultLanguage as Lang | undefined) ?? petpals.defaultLanguage;

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <ThemeProvider>
        <I18nProvider defaultLanguage={defaultLanguage}>
          <CartProvider>{children}</CartProvider>
        </I18nProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
```

Install the query packages first:
```bash
npm install -w mobile @tanstack/react-query @tanstack/react-query-persist-client @tanstack/query-async-storage-persister @react-native-async-storage/async-storage
npm install -w mobile react-hook-form @hookform/resolvers zod
npx expo install expo-updates
```

- [ ] **Step 7: Wrap the app root in `mobile/app/_layout.tsx`**

Replace the template layout body with:
```tsx
import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProviders } from "../components/AppProviders";

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}
```

- [ ] **Step 8: Run tests + typecheck**

Run: `npm test -w mobile && npm run typecheck -w mobile`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add mobile
git commit -m "feat(mobile): add api client, providers, i18n and cart"
```

---

### Task 4: Data hooks (queries + mutations)

**Files:**
- Create: `mobile/lib/queries.ts`
- Test: none (thin wrappers over `apiFetch`; behavior covered by screen smoke tests and the API test suite)

**Interfaces:**
- Consumes: `apiFetch`, `adminFetch`, `@petpals/core` types.
- Produces hooks:
  - Public: `useProducts(params?)`, `useProduct(slug)`, `useCategories()`, `useSettings()`, `useSections()`, `useReviews(productId?)`, `useCreateReview()`, `useTrackOrders(phone)`, `useCreateOrder()`
  - Admin: `useAdminOrders(status?)`, `useUpdateOrderStatus()`, `useDeleteOrder()`, `useAdminProducts()`, `useCreateProduct()`, `useUpdateProduct()`, `useDeleteProduct()`, `useAdminCategories()`, `useCreateCategory()`, `useDeleteCategory()`, `useAdminReviews()`, `useUpdateReviewStatus()`, `useDeleteReview()`

- [ ] **Step 1: Implement `mobile/lib/queries.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Category,
  Order,
  Product,
  Review,
  Section,
  Settings,
} from "@petpals/core";
import { adminFetch, apiFetch } from "./api";

export function useProducts(params?: { category?: string; q?: string; ids?: string[]; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.category) search.set("category", params.category);
  if (params?.q) search.set("q", params.q);
  if (params?.ids?.length) search.set("ids", params.ids.join(","));
  if (params?.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => apiFetch<Product[]>(`/products${qs ? `?${qs}` : ""}`),
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () =>
      apiFetch<{ product: Product; related: Product[]; reviews: Review[] }>(
        `/products/${encodeURIComponent(slug)}`,
      ),
    enabled: slug.length > 0,
  });
}

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: () => apiFetch<Category[]>("/categories") });
}

export function useSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: () => apiFetch<Partial<Settings>>("/settings") });
}

export function useSections() {
  return useQuery({ queryKey: ["sections"], queryFn: () => apiFetch<Section[]>("/sections") });
}

export function useReviews(productId?: string, limit?: number) {
  const search = new URLSearchParams();
  if (productId) search.set("product_id", productId);
  if (limit) search.set("limit", String(limit));
  const qs = search.toString();
  return useQuery({
    queryKey: ["reviews", productId, limit],
    queryFn: () => apiFetch<Review[]>(`/reviews${qs ? `?${qs}` : ""}`),
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      product_id: string;
      user_name: string;
      rating: number;
      title?: string;
      body: string;
    }) => apiFetch<{ id: string }>("/reviews", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
  });
}

export function useTrackOrders(phone: string) {
  return useQuery({
    queryKey: ["track", phone],
    queryFn: () => apiFetch<Order[]>(`/orders/track?phone=${encodeURIComponent(phone)}`),
    enabled: phone.length >= 4,
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: (input: {
      first_name: string;
      last_name: string;
      phone: string;
      address: string;
      items: { id: string; name: string; qty: number; price: number; image_url: string }[];
      total: number;
    }) => apiFetch<{ id: string }>("/orders", { method: "POST", body: JSON.stringify(input) }),
  });
}

export function useAdminOrders(status?: string) {
  return useQuery({
    queryKey: ["admin", "orders", status],
    queryFn: () => adminFetch<Order[]>(`/admin/orders${status ? `?status=${status}` : ""}`),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminFetch(`/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminFetch(`/admin/orders/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => adminFetch<Product[]>("/admin/products"),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      adminFetch<{ id: string }>("/admin/products", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
      adminFetch(`/admin/products/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminFetch(`/admin/products/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => adminFetch<Category[]>("/admin/categories"),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      adminFetch<{ id: string }>("/admin/categories", { method: "POST", body: JSON.stringify({ name }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminFetch(`/admin/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

export function useAdminReviews() {
  return useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: () => adminFetch<(Review & { product_name?: string })[]>("/admin/reviews"),
  });
}

export function useUpdateReviewStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "pending" | "approved" }) =>
      adminFetch(`/admin/reviews/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reviews"] }),
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminFetch(`/admin/reviews/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reviews"] }),
  });
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck -w mobile`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add mobile
git commit -m "feat(mobile): add query and mutation hooks"
```

---

### Task 5: UI primitives

**Files:**
- Create: `mobile/components/ui/Screen.tsx`, `Button.tsx`, `Input.tsx`, `Card.tsx`, `Badge.tsx`, `PriceText.tsx`, `EmptyState.tsx`, `Loading.tsx`, `ConfirmDialog.tsx`
- Test: `mobile/components/ui/ui.test.tsx`

**Interfaces:**
- Consumes: `useTheme`, `formatPrice`.
- Produces: `Screen` (safe area + background), `Button` (`variant: "primary" | "outline" | "ghost"`, `loading`), `Input` (label + error), `Card`, `Badge`, `PriceText`, `EmptyState`, `Loading`, `ConfirmDialog` (uses RN `Modal`).

- [ ] **Step 1: Write the failing test `mobile/components/ui/ui.test.tsx`**

```tsx
import { render, fireEvent } from "@testing-library/react-native";
import { Button } from "./Button";

jest.mock("../../theme/theme", () => ({
  useTheme: () => ({
    colors: {
      accent: "#2F6B58",
      background: "#FFFFFF",
      foreground: "#1C3B31",
      secondary: "#F4F6F5",
      muted: "#F3F5F4",
      card: "#FFFFFF",
      border: "#E4E8E6",
    },
    currency: "MAD",
  }),
}));

describe("Button", () => {
  it("renders its label and handles presses", () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Add to Cart" onPress={onPress} />);
    fireEvent.press(getByText("Add to Cart"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
  it("does not fire while loading", () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Saving" onPress={onPress} loading />);
    fireEvent.press(getByText("Saving"));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w mobile`
Expected: FAIL — cannot resolve `./Button`.

- [ ] **Step 3: Implement the primitives**

`mobile/components/ui/Button.tsx`:
```tsx
import { ActivityIndicator, Pressable, Text } from "react-native";
import { useTheme } from "../../theme/theme";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "ghost";
  loading?: boolean;
  disabled?: boolean;
};

export function Button({ label, onPress, variant = "primary", loading, disabled }: Props) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const backgroundColor =
    variant === "primary" ? colors.accent : variant === "outline" ? "transparent" : "transparent";
  const textColor = variant === "primary" ? "#FFFFFF" : colors.accent;
  const borderColor = variant === "outline" ? colors.accent : "transparent";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        if (!isDisabled) onPress();
      }}
      style={{
        backgroundColor,
        borderColor,
        borderWidth: variant === "outline" ? 1 : 0,
        borderRadius: 9999,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: "center",
        justifyContent: "center",
        opacity: isDisabled ? 0.6 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={{ color: textColor, fontWeight: "600", fontSize: 16 }}>{label}</Text>
      )}
    </Pressable>
  );
}
```

`mobile/components/ui/Input.tsx`:
```tsx
import { Text, TextInput, View } from "react-native";
import { useTheme } from "../../theme/theme";

type Props = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  keyboardType?: "default" | "phone-pad" | "numeric" | "email-address";
};

export function Input({ label, value, onChangeText, placeholder, error, multiline, keyboardType }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: colors.foreground, fontWeight: "500" }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        keyboardType={keyboardType}
        style={{
          borderWidth: 1,
          borderColor: error ? "#DC2626" : colors.border,
          backgroundColor: colors.card,
          color: colors.foreground,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          minHeight: multiline ? 96 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
      {error ? <Text style={{ color: "#DC2626", fontSize: 12 }}>{error}</Text> : null}
    </View>
  );
}
```

`mobile/components/ui/Screen.tsx`:
```tsx
import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../theme/theme";

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {scroll ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>{children}</ScrollView>
      ) : (
        <View style={{ flex: 1, padding: 16, gap: 16 }}>{children}</View>
      )}
    </SafeAreaView>
  );
}
```

`mobile/components/ui/Card.tsx`, `Badge.tsx`, `PriceText.tsx`, `EmptyState.tsx`,
`Loading.tsx`, `ConfirmDialog.tsx` — implement as small components following the same
`useTheme()` pattern: Card is a bordered `View` with `colors.card` background and radius
12; Badge is a pill `View` with `colors.secondary` and small text; EmptyState centers a
message with `colors.muted`; Loading centers an `ActivityIndicator` with `colors.accent`.

`mobile/components/ui/PriceText.tsx`:
```tsx
import { Text } from "react-native";
import { formatPrice } from "@petpals/core";
import { useTheme } from "../../theme/theme";

export function PriceText({ value, size = 16 }: { value: number | string; size?: number }) {
  const { colors } = useTheme();
  return (
    <Text style={{ color: colors.accent, fontWeight: "700", fontSize: size }}>
      {formatPrice(value)}
    </Text>
  );
}
```

`mobile/components/ui/ConfirmDialog.tsx`:
```tsx
import { Modal, Pressable, Text, View } from "react-native";
import { useTheme } from "../../theme/theme";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: Props) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20, gap: 12, width: "100%" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>{title}</Text>
          <Text style={{ color: colors.foreground }}>{message}</Text>
          <Pressable onPress={onConfirm} style={{ backgroundColor: "#DC2626", borderRadius: 9999, padding: 14, alignItems: "center" }}>
            <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>{confirmLabel}</Text>
          </Pressable>
          <Pressable onPress={onCancel} style={{ borderColor: colors.border, borderWidth: 1, borderRadius: 9999, padding: 14, alignItems: "center" }}>
            <Text style={{ color: colors.foreground, fontWeight: "600" }}>{cancelLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
```

- [ ] **Step 4: Wire toasts**

Run: `npm install -w mobile sonner-native`

In `mobile/components/AppProviders.tsx`, render `<Toaster />` from `sonner-native` as
the last child inside `CartProvider`. Screens use `toast.success(...)` /
`toast.error(...)` for mutation feedback (successful order, save failures, etc.).

- [ ] **Step 5: Run tests + typecheck**

Run: `npm test -w mobile && npm run typecheck -w mobile`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add mobile
git commit -m "feat(mobile): add UI primitives"
```

---

### Task 6: Navigation shell — tabs

**Files:**
- Create: `mobile/app/(tabs)/_layout.tsx`, `mobile/app/(tabs)/index.tsx`, `mobile/app/(tabs)/shop.tsx`, `mobile/app/(tabs)/cart.tsx`, `mobile/app/(tabs)/track.tsx`
- Modify: `mobile/app/_layout.tsx` (Stack routes list)

**Interfaces:**
- Consumes: `useI18n`, `useCart`, `useTheme`.
- Produces: tab navigator with Home / Shop / Cart / Track; placeholder screens replaced in later tasks.

- [ ] **Step 1: Implement `mobile/app/(tabs)/_layout.tsx`**

```tsx
import { Tabs } from "expo-router";
import { Home, ShoppingBag, ShoppingCart, Truck } from "lucide-react-native";
import { useI18n } from "../../lib/i18n";
import { useCart } from "../../lib/cart";
import { useTheme } from "../../theme/theme";

export default function TabsLayout() {
  const { t } = useI18n();
  const { count } = useCart();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: "#9CA3AF",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("nav.home"),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: t("nav.shop"),
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t("nav.cart"),
          tabBarBadge: count > 0 ? count : undefined,
          tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: t("footer.track"),
          tabBarIcon: ({ color, size }) => <Truck color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
```

Install icons: `npx expo install lucide-react-native react-native-svg`.

- [ ] **Step 2: Add placeholder screens**

Each of `index.tsx`, `shop.tsx`, `cart.tsx`, `track.tsx` renders a `Screen` with the
screen title text for now. They are replaced in Tasks 7–13.

- [ ] **Step 3: Update the root Stack in `mobile/app/_layout.tsx`**

```tsx
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="product/[slug]" />
  <Stack.Screen name="category/[category]" />
  <Stack.Screen name="checkout" />
  <Stack.Screen name="order-confirmed" />
  <Stack.Screen name="info/[page]" />
  <Stack.Screen name="admin" />
</Stack>
```

- [ ] **Step 4: Verify bundle**

Run: `npm run typecheck -w mobile && npx expo export --platform ios --output-dir .expo-smoke`
Expected: succeeds. Delete `.expo-smoke`.

- [ ] **Step 5: Commit**

```bash
git add mobile
git commit -m "feat(mobile): add tab navigation shell"
```

---

### Task 7: Home screen with native section rendering

**Files:**
- Create: `mobile/lib/homeSections.ts`
- Create: `mobile/components/home/HeroSection.tsx`, `CategoriesSection.tsx`, `ProductsSection.tsx`, `PromoSection.tsx`, `BestSection.tsx`, `ReviewsSection.tsx`
- Modify: `mobile/app/(tabs)/index.tsx`
- Test: `mobile/lib/homeSections.test.ts`

**Interfaces:**
- Consumes: `useSettings`, `useSections`, `useProducts`, `useCategories`, `useReviews`, UI primitives, `useI18n`.
- Produces: `parseHomepageSections(json: string): HomeSectionId[]`.

- [ ] **Step 1: Write the failing test `mobile/lib/homeSections.test.ts`**

```ts
import { parseHomepageSections } from "./homeSections";

describe("parseHomepageSections", () => {
  it("keeps known visible sections in order", () => {
    const json = JSON.stringify([
      { id: "hero", visible: true },
      { id: "categories", visible: false },
      { id: "products", visible: true },
      { id: "unknown", visible: true },
    ]);
    expect(parseHomepageSections(json)).toEqual(["hero", "products"]);
  });
  it("falls back to the full default order on bad JSON", () => {
    expect(parseHomepageSections("not json")).toEqual([
      "hero",
      "categories",
      "products",
      "promo",
      "best",
      "reviews",
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w mobile`
Expected: FAIL — cannot resolve `./homeSections`.

- [ ] **Step 3: Implement `mobile/lib/homeSections.ts`**

```ts
export const HOME_SECTION_IDS = [
  "hero",
  "categories",
  "products",
  "promo",
  "best",
  "reviews",
] as const;

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];

const KNOWN = new Set<string>(HOME_SECTION_IDS);

export function parseHomepageSections(json: string): HomeSectionId[] {
  try {
    const parsed = JSON.parse(json) as { id: string; visible?: boolean }[];
    const visible = parsed
      .filter((s) => s.visible !== false && KNOWN.has(s.id))
      .map((s) => s.id as HomeSectionId);
    return visible.length > 0 ? visible : [...HOME_SECTION_IDS];
  } catch {
    return [...HOME_SECTION_IDS];
  }
}
```

- [ ] **Step 4: Implement the section components**

Each component is a small, self-contained piece that takes its data as props:

- `HeroSection` — settings `hero_badge`, `hero_title`, `hero_subtitle`, optional
  `hero_image`; a "Shop Now" `Button` linking to `/shop`.
- `CategoriesSection` — `useCategories()`; horizontal scroll of category cards linking
  to `/category/[slug]`.
- `ProductsSection` — `useProducts({ limit: 8 })`; two-column grid of product cards
  (image via `expo-image`, name, `PriceText`, tap → `/product/[slug]`).
- `PromoSection` — settings `promo_title`, `promo_old_price`, `promo_price`; accent
  background card with a shop button.
- `BestSection` — `useProducts({ limit: 4 })`; horizontal list of best products.
- `ReviewsSection` — `useReviews(undefined, 6)`; review cards with star rating.

- [ ] **Step 5: Implement `mobile/app/(tabs)/index.tsx`**

```tsx
import { Screen } from "../../components/ui/Screen";
import { Loading } from "../../components/ui/Loading";
import { useSettings } from "../../lib/queries";
import { parseHomepageSections } from "../../lib/homeSections";
import { HeroSection } from "../../components/home/HeroSection";
import { CategoriesSection } from "../../components/home/CategoriesSection";
import { ProductsSection } from "../../components/home/ProductsSection";
import { PromoSection } from "../../components/home/PromoSection";
import { BestSection } from "../../components/home/BestSection";
import { ReviewsSection } from "../../components/home/ReviewsSection";
import { defaultSettings } from "@petpals/core";

const RENDERERS = {
  hero: HeroSection,
  categories: CategoriesSection,
  products: ProductsSection,
  promo: PromoSection,
  best: BestSection,
  reviews: ReviewsSection,
} as const;

export default function HomeScreen() {
  const { data: settings, isLoading } = useSettings();
  if (isLoading) return <Screen><Loading /></Screen>;
  const merged = { ...defaultSettings, ...(settings ?? {}) };
  const sections = parseHomepageSections(merged.homepage_sections);
  return (
    <Screen>
      {sections.map((id) => {
        const Section = RENDERERS[id];
        return <Section key={id} settings={merged} />;
      })}
    </Screen>
  );
}
```

Section components accept `{ settings }` (typed as `Settings`) and fetch their own data.

- [ ] **Step 6: Run tests + typecheck + bundle**

Run: `npm test -w mobile && npm run typecheck -w mobile`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add mobile
git commit -m "feat(mobile): add home screen with native section rendering"
```

---

### Task 8: Shop screen — list, search, category filter

**Files:**
- Modify: `mobile/app/(tabs)/shop.tsx`

**Interfaces:**
- Consumes: `useProducts`, `useCategories`, `useI18n`, UI primitives.
- Produces: searchable product list with category filter chips (multi-select like web).

- [ ] **Step 1: Implement the screen**

Behavior:
- `TextInput` search box bound to local state (debounced 300 ms) → `useProducts({ q })`.
- Category chips from `useCategories()`; selected slugs in a `Set`; filtering is
  client-side on `product.category` (mirrors web `Shop.tsx`).
- Two-column product grid; each card shows image, name, `PriceText`; tap navigates to
  `/product/[slug]`.
- Empty result shows `EmptyState` with `t("shop.noResults")` (fallback key is fine if
  the dictionary lacks it — add the key to all three dictionaries in `core/src/i18n/`
  if missing, with the English copy from the web app).

- [ ] **Step 2: Verify**

Run: `npm run typecheck -w mobile`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add mobile
git commit -m "feat(mobile): add shop screen"
```

---

### Task 9: Product detail — gallery, related, reviews

**Files:**
- Create: `mobile/app/product/[slug].tsx`

**Interfaces:**
- Consumes: `useProduct`, `useCreateReview`, `useCart`, `useI18n`, UI primitives.
- Produces: product detail screen.

- [ ] **Step 1: Implement the screen**

Behavior:
- `useLocalSearchParams<{ slug: string }>()` → `useProduct(slug)`.
- Image gallery: if `product.images` parses to a non-empty array, horizontal pager;
  otherwise single `expo-image`.
- Name, `PriceText`, description, badge/tag pills.
- Quantity stepper + "Add to Cart" `Button` → `add({ id, name, slug, price, image_url })`.
- Related products horizontal list linking to their detail pages.
- Reviews: approved list with stars; a "Write a review" form (name, rating 1–5, title,
  body) posting via `useCreateReview`; show a success message that the review is pending
  approval.

- [ ] **Step 2: Verify**

Run: `npm run typecheck -w mobile`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add mobile
git commit -m "feat(mobile): add product detail screen"
```

---

### Task 10: Category screen

**Files:**
- Create: `mobile/app/category/[category].tsx`

**Interfaces:**
- Consumes: `useProducts({ category })`, `useCategories`, UI primitives.
- Produces: category listing screen.

- [ ] **Step 1: Implement the screen**

Behavior: read `category` param; resolve display name from `useCategories()`; render the
same product grid as Shop; empty state when no products.

- [ ] **Step 2: Verify + commit**

Run: `npm run typecheck -w mobile`
```bash
git add mobile
git commit -m "feat(mobile): add category screen"
```

---

### Task 11: Cart screen

**Files:**
- Modify: `mobile/app/(tabs)/cart.tsx`

**Interfaces:**
- Consumes: `useCart`, `useSettings`, `useI18n`, `shippingFor`, UI primitives.
- Produces: cart screen with quantity editing and checkout entry.

- [ ] **Step 1: Implement the screen**

Behavior:
- List items with image, name, `PriceText`, quantity stepper, remove button.
- Summary: subtotal, shipping via `shippingFor(subtotal, { threshold, fee })` using
  settings, total.
- "Checkout" button navigates to `/checkout`; disabled when empty.
- Empty state with a "Shop" button navigating to `/shop`.

- [ ] **Step 2: Verify + commit**

Run: `npm run typecheck -w mobile`
```bash
git add mobile
git commit -m "feat(mobile): add cart screen"
```

---

### Task 12: Checkout + order confirmed

**Files:**
- Create: `mobile/app/checkout.tsx`, `mobile/app/order-confirmed.tsx`
- Test: `mobile/lib/checkout.test.ts`

**Interfaces:**
- Consumes: `useCart`, `useSettings`, `useCreateOrder`, `shippingFor`, UI primitives.
- Produces: `validateCheckout(form): Record<string, string>` (empty = valid).

- [ ] **Step 1: Write the failing test `mobile/lib/checkout.test.ts`**

```ts
import { validateCheckout } from "./checkout";

describe("validateCheckout", () => {
  const valid = {
    first_name: "Ana",
    last_name: "Lopez",
    phone: "0601020304",
    address: "1 rue X",
  };
  it("accepts a complete form", () => {
    expect(validateCheckout(valid)).toEqual({});
  });
  it("flags every missing field", () => {
    expect(validateCheckout({ ...valid, phone: " " })).toHaveProperty("phone");
    expect(validateCheckout({ ...valid, first_name: "" })).toHaveProperty("first_name");
    expect(validateCheckout({ ...valid, address: "" })).toHaveProperty("address");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w mobile`
Expected: FAIL — cannot resolve `./checkout`.

- [ ] **Step 3: Implement `mobile/lib/checkout.ts`**

```ts
export type CheckoutForm = {
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
};

export function validateCheckout(form: CheckoutForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.first_name.trim()) errors.first_name = "Required";
  if (!form.last_name.trim()) errors.last_name = "Required";
  if (!form.phone.trim()) errors.phone = "Required";
  if (!form.address.trim()) errors.address = "Required";
  return errors;
}
```

- [ ] **Step 4: Implement `mobile/app/checkout.tsx`**

Behavior:
- If cart is empty, redirect to `/cart`.
- Form fields via `Input`; errors from `validateCheckout`.
- Order summary (items, subtotal, shipping, total) using settings + `shippingFor`.
- Submit: `useCreateOrder().mutateAsync({ ...form, items: cart items mapped to
  { id, name, qty, price, image_url }, total })`; on success save the phone to
  AsyncStorage key `petpals_last_phone`, `clear()` the cart, and
  `router.replace(`/order-confirmed?phone=${encodeURIComponent(phone)}`)`.
- Show error text on failure.

- [ ] **Step 5: Implement `mobile/app/order-confirmed.tsx`**

Behavior: thank-you copy from the dictionary (`checkout.thanks` or fallback), phone from
params, buttons: "Track order" → `/track` (prefill phone via AsyncStorage) and "Continue
shopping" → `/shop`.

- [ ] **Step 6: Run tests + verify + commit**

Run: `npm test -w mobile && npm run typecheck -w mobile`
```bash
git add mobile
git commit -m "feat(mobile): add checkout and order confirmation"
```

---

### Task 13: Track, info pages, WhatsApp

**Files:**
- Modify: `mobile/app/(tabs)/track.tsx`
- Create: `mobile/app/info/[page].tsx`
- Create: `mobile/components/FloatingWhatsApp.tsx`
- Modify: `mobile/app/(tabs)/index.tsx` (mount FloatingWhatsApp)

**Interfaces:**
- Consumes: `useTrackOrders`, `useSettings`, `waLinkFrom`, `infoPages` content (ported).
- Produces: track screen with order status timeline; info pages; WhatsApp button.

- [ ] **Step 1: Port info pages content**

Copy the `infoPages` data from `web/src/lib/infoPages.tsx` into
`mobile/lib/infoPages.tsx` (data only; drop the JSX). Keep slugs and copy identical.

- [ ] **Step 2: Implement the track screen**

Behavior: phone input (prefilled from AsyncStorage `petpals_last_phone`), search button,
`useTrackOrders(phone)`; each order shows id short code, date, item count, total, and a
status stepper (new → processing → shipped → delivered; cancelled shown as a red badge).

- [ ] **Step 3: Implement the info page**

`useLocalSearchParams<{ page: string }>()`; find the page by slug; render title and
paragraph sections with `Screen`; "contact" page also shows contact details from settings.

- [ ] **Step 4: Implement `FloatingWhatsApp`**

If `settings.whatsapp_number` is set, render a floating round accent button
(`colors.accent`) that opens `waLinkFrom(settings.whatsapp_number, "Hello!")` with
`Linking.openURL`.

- [ ] **Step 5: Verify + commit**

Run: `npm run typecheck -w mobile`
```bash
git add mobile
git commit -m "feat(mobile): add track, info pages and WhatsApp contact"
```

---

### Task 14: Admin auth + gated navigation

**Files:**
- Create: `mobile/app/admin/_layout.tsx`, `mobile/app/admin/login.tsx`, `mobile/app/admin/(tabs)/_layout.tsx`
- Create: `mobile/lib/adminSession.tsx`
- Modify: `mobile/app/(tabs)/track.tsx` (hidden Admin link)
- Test: `mobile/lib/adminSession.test.ts`

**Interfaces:**
- Consumes: `adminFetch`, `getAdminToken`, `setAdminToken`.
- Produces: `AdminSessionProvider` + `useAdminSession(): { email: string | null; ready: boolean; signIn(email, password): Promise<void>; signOut(): Promise<void> }`.

- [ ] **Step 1: Write the failing test `mobile/lib/adminSession.test.ts`**

```ts
import { parseLoginResponse } from "./adminSession";

describe("parseLoginResponse", () => {
  it("accepts a token and email", () => {
    expect(parseLoginResponse({ token: "t", email: "a@b.c" })).toEqual({
      token: "t",
      email: "a@b.c",
    });
  });
  it("rejects malformed responses", () => {
    expect(parseLoginResponse({})).toBeNull();
    expect(parseLoginResponse({ token: 1, email: null })).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w mobile`
Expected: FAIL.

- [ ] **Step 3: Implement `mobile/lib/adminSession.tsx`**

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { adminFetch, getAdminToken, setAdminToken } from "./api";

export function parseLoginResponse(value: unknown): { token: string; email: string } | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.token !== "string" || typeof v.email !== "string") return null;
  return { token: v.token, email: v.email };
}

type AdminSessionValue = {
  email: string | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AdminSessionContext = createContext<AdminSessionValue>({
  email: null,
  ready: false,
  signIn: async () => {},
  signOut: async () => {},
});

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getAdminToken();
      if (token) {
        try {
          const me = await adminFetch<{ email: string }>("/auth/admin/me");
          setEmail(me.email);
        } catch {
          await setAdminToken(null);
        }
      }
      setReady(true);
    })();
  }, []);

  const signIn = useCallback(async (loginEmail: string, password: string) => {
    const res = await adminFetch<unknown>("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({ email: loginEmail, password }),
    });
    const parsed = parseLoginResponse(res);
    if (!parsed) throw new Error("Invalid response");
    await setAdminToken(parsed.token);
    setEmail(parsed.email);
  }, []);

  const signOut = useCallback(async () => {
    await setAdminToken(null);
    setEmail(null);
  }, []);

  return (
    <AdminSessionContext.Provider value={{ email, ready, signIn, signOut }}>
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession() {
  return useContext(AdminSessionContext);
}
```

Note: `/auth/admin/login` is public, so `adminFetch` sending no token is fine.

- [ ] **Step 4: Implement `mobile/app/admin/_layout.tsx`**

```tsx
import { Redirect, Stack, usePathname } from "expo-router";
import { AdminSessionProvider, useAdminSession } from "../../lib/adminSession";
import { Loading } from "../../components/ui/Loading";

function AdminGate() {
  const { email, ready } = useAdminSession();
  const pathname = usePathname();
  if (!ready) return <Loading />;
  if (!email && pathname !== "/admin/login") return <Redirect href="/admin/login" />;
  if (email && pathname === "/admin/login") return <Redirect href="/admin/orders" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function AdminLayout() {
  return (
    <AdminSessionProvider>
      <AdminGate />
    </AdminSessionProvider>
  );
}
```

- [ ] **Step 5: Implement `mobile/app/admin/login.tsx`**

Email + password `Input`s, error text, submit calls `signIn`; a small "Customer mode"
link calls `router.replace("/")`. On success the gate redirects to `/admin/orders`.

- [ ] **Step 6: Implement `mobile/app/admin/(tabs)/_layout.tsx`**

Tabs: Orders (`orders`), Products (`products`), Categories (`categories`), Reviews
(`reviews`); accent active color; a header-right sign-out button calling `signOut` then
`router.replace("/")`.

- [ ] **Step 7: Add the hidden entry**

At the bottom of `mobile/app/(tabs)/track.tsx`, add a discreet text button
(`accessibilityLabel="Admin"`, low-contrast, small) that navigates to `/admin`.
The deep link `petpals://admin` also lands there via the scheme.

- [ ] **Step 8: Create placeholder admin tab screens**

`orders.tsx`, `products.tsx`, `categories.tsx`, `reviews.tsx` render their titles for
now (replaced in Tasks 15–17).

- [ ] **Step 9: Run tests + verify + commit**

Run: `npm test -w mobile && npm run typecheck -w mobile`
```bash
git add mobile
git commit -m "feat(mobile): add gated admin auth"
```

---

### Task 15: Admin orders screen

**Files:**
- Modify: `mobile/app/admin/(tabs)/orders.tsx`

**Interfaces:**
- Consumes: `useAdminOrders`, `useUpdateOrderStatus`, `useDeleteOrder`, UI primitives, `useI18n`.
- Produces: orders list with status filter, status update, delete confirmation, pull-to-refresh.

- [ ] **Step 1: Implement the screen**

Behavior:
- Status filter chips: All + the five statuses.
- `FlatList` with `RefreshControl` (`refetch`).
- Each order card: customer name, phone, address, date, total, item count, status badge.
- Tap status badge → action sheet (`@gorhom/bottom-sheet` or RN `Modal`) listing the five
  statuses; selecting one calls `useUpdateOrderStatus`.
- Delete via `ConfirmDialog` → `useDeleteOrder`.
- Errors from mutations surface in a small banner.

Install if not present: `npm install -w mobile @gorhom/bottom-sheet`.

- [ ] **Step 2: Verify + commit**

Run: `npm run typecheck -w mobile`
```bash
git add mobile
git commit -m "feat(mobile): add admin orders screen"
```

---

### Task 16: Admin products — list, form, image upload

**Files:**
- Modify: `mobile/app/admin/(tabs)/products.tsx`
- Create: `mobile/app/admin/product-form.tsx`
- Create: `mobile/lib/imageUpload.ts`
- Test: `mobile/lib/imageUpload.test.ts`

**Interfaces:**
- Consumes: `useAdminProducts`, `useCreateProduct`, `useUpdateProduct`, `useDeleteProduct`, `expo-image-picker`, `expo-image-manipulator`.
- Produces: `toDataUrl(base64: string): string`, `MAX_IMAGE_BYTES = 2 * 1024 * 1024`.

- [ ] **Step 1: Write the failing test `mobile/lib/imageUpload.test.ts`**

```ts
import { toDataUrl, isUnderLimit } from "./imageUpload";

describe("toDataUrl", () => {
  it("builds a jpeg data URL", () => {
    expect(toDataUrl("AAAA")).toBe("data:image/jpeg;base64,AAAA");
  });
});

describe("isUnderLimit", () => {
  it("accepts payloads under 2MB and rejects larger ones", () => {
    expect(isUnderLimit("A".repeat(1000))).toBe(true);
    expect(isUnderLimit("A".repeat(2 * 1024 * 1024 + 4))).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w mobile`
Expected: FAIL.

- [ ] **Step 3: Implement `mobile/lib/imageUpload.ts`**

Install first: `npx expo install expo-image-picker expo-image-manipulator`

```ts
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export function toDataUrl(base64: string): string {
  return `data:image/jpeg;base64,${base64}`;
}

export function isUnderLimit(base64: string): boolean {
  return base64.length * 0.75 <= MAX_IMAGE_BYTES;
}

export async function pickAndPrepareImage(): Promise<string | null> {
  const ImagePicker = await import("expo-image-picker");
  const ImageManipulator = await import("expo-image-manipulator");

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.8,
    base64: true,
  });
  if (result.canceled || !result.assets[0]?.base64) return null;

  let base64 = result.assets[0].base64;
  if (!isUnderLimit(base64)) {
    const context = ImageManipulator.ImageManipulator.manipulate(
      result.assets[0].uri,
    ).resize({ width: 1024 });
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({
      format: ImageManipulator.SaveFormat.JPEG,
      compress: 0.6,
      base64: true,
    });
    base64 = saved.base64 ?? base64;
  }
  return toDataUrl(base64);
}
```

If the installed `expo-image-manipulator` uses the legacy `manipulateAsync` API instead
of the new context API, use:
```ts
const saved = await ImageManipulator.manipulateAsync(
  result.assets[0].uri,
  [{ resize: { width: 1024 } }],
  { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true },
);
base64 = saved.base64 ?? base64;
```
Match whichever API the installed version exports; both paths are acceptable.

- [ ] **Step 4: Implement the products list**

Behavior: `FlatList` of products (image, name, price, category, badge); floating "Add"
button → `/admin/product-form`; each row has Edit (same route with `?id=`) and Delete
(`ConfirmDialog` + `useDeleteProduct`); pull-to-refresh.

- [ ] **Step 5: Implement `mobile/app/admin/product-form.tsx`**

Behavior:
- Create or edit based on `useLocalSearchParams<{ id?: string }>()` (edit prefills from
  `useAdminProducts()`).
- Fields: name, description, price (numeric), category (chips from `useAdminCategories`),
  badge, tag, image section:
  - "Pick image" → `pickAndPrepareImage()` → preview via `expo-image`.
  - "Use image URL" → `Input` for a URL.
- Save: create → `useCreateProduct`, edit → `useUpdateProduct`; on success
  `router.back()`.
- Validation: name, description, price > 0, category, and either an image URL or picked
  image.

- [ ] **Step 6: Run tests + verify + commit**

Run: `npm test -w mobile && npm run typecheck -w mobile`
```bash
git add mobile
git commit -m "feat(mobile): add admin products with image upload"
```

---

### Task 17: Admin categories + reviews screens

**Files:**
- Modify: `mobile/app/admin/(tabs)/categories.tsx`, `mobile/app/admin/(tabs)/reviews.tsx`

**Interfaces:**
- Consumes: `useAdminCategories`, `useCreateCategory`, `useDeleteCategory`, `useAdminReviews`, `useUpdateReviewStatus`, `useDeleteReview`.
- Produces: category management and review moderation.

- [ ] **Step 1: Implement categories**

Behavior: list with product counts omitted (API returns none) — show name + slug; input +
"Add" button calls `useCreateCategory`; delete per row via `ConfirmDialog`; errors in a
banner.

- [ ] **Step 2: Implement reviews**

Behavior: list with product name, reviewer, stars, body, status badge; "Approve" /
"Set pending" buttons call `useUpdateReviewStatus`; delete via `ConfirmDialog`; filter
chips All / Pending / Approved (client-side).

- [ ] **Step 3: Verify + commit**

Run: `npm run typecheck -w mobile`
```bash
git add mobile
git commit -m "feat(mobile): add admin categories and reviews"
```

---

### Task 18: Push notifications

**Files:**
- Create: `mobile/lib/push.ts`
- Modify: `mobile/app/admin/(tabs)/_layout.tsx` (register on mount after login)
- Test: none (device-only behavior; verified manually in Task 20)

**Interfaces:**
- Consumes: `expo-notifications`, `expo-device`, `adminFetch`.
- Produces: `registerForPushNotifications(): Promise<void>`.

- [ ] **Step 1: Install**

Run: `npx expo install expo-notifications expo-device`

- [ ] **Step 2: Implement `mobile/lib/push.ts`**

```ts
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { adminFetch } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<void> {
  if (!Device.isDevice) return;

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Orders",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return;

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await adminFetch("/admin/push/register", {
    method: "POST",
    body: JSON.stringify({ token, platform: Platform.OS }),
  });
}
```

- [ ] **Step 3: Register after admin login**

In `mobile/app/admin/(tabs)/_layout.tsx`, add:
```tsx
useEffect(() => {
  registerForPushNotifications().catch(() => {});
}, []);
```

- [ ] **Step 4: Verify + commit**

Run: `npm run typecheck -w mobile`
```bash
git add mobile
git commit -m "feat(mobile): add admin push notifications"
```

Note: remote push requires a development build or production build (not Expo Go) and an
EAS project ID — verified in Task 20.

---

### Task 19: EAS config, branding workflow, docs

**Files:**
- Create: `mobile/eas.json`
- Create: `docs/BRANDING-A-CLIENT.md`
- Modify: `mobile/package.json` (scripts: `build:client`, `update:client`)

**Interfaces:**
- Consumes: everything before.
- Produces: documented per-client build flow.

- [ ] **Step 1: Create `mobile/eas.json`**

```json
{
  "cli": { "version": ">= 12.0.0", "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_CLIENT": "petpals" }
    },
    "preview": {
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_CLIENT": "petpals" }
    },
    "production": {
      "autoIncrement": true,
      "env": { "EXPO_PUBLIC_CLIENT": "petpals" }
    }
  },
  "submit": { "production": {} }
}
```

- [ ] **Step 2: Add scripts to `mobile/package.json`**

```json
"build:client": "eas build --profile production --platform all",
"update:client": "eas update --branch production"
```

- [ ] **Step 3: Write `docs/BRANDING-A-CLIENT.md`**

```markdown
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
```

- [ ] **Step 4: Verify + commit**

Run: `npm run typecheck -w mobile`
```bash
git add mobile docs
git commit -m "feat(mobile): add EAS config and branding workflow docs"
```

---

### Task 20: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Run all automated checks**

Run (from `dogositeapp/`): `npm test`
Expected: core and api suites PASS.

Run (from `dogositeapp/mobile/`): `npm test && npm run typecheck`
Expected: PASS.

- [ ] **Step 2: Run the manual smoke matrix against a local API + Turso**

Start the API with real Turso env, then `npx expo start` and verify on a device/emulator:

1. Order placed in the app appears in the web admin.
2. Order placed on the web appears in the app admin and triggers a push within 2 minutes
   (with cron configured).
3. Status change in the app is reflected on the web.
4. Product created in the app (with photo) appears on the web storefront.
5. fr/en/ar switching works, including RTL layout for Arabic (app reloads).
6. Admin area is inaccessible without login; deep link `petpals://admin` opens login.
7. Cart survives app restart; language choice survives app restart.

- [ ] **Step 3: Fix anything the matrix surfaces, then commit**

```bash
git add -A
git commit -m "chore: final verification fixes"
```

---

## Plan Self-Review Notes

- Spec coverage: mobile sections 8.1–8.7 are covered — stack (Task 1), navigation (6),
  parity screens (7–13), admin (14–17), i18n/RTL (3, dictionaries from core), branding
  (2, 19), delivery (19), push (18), verification (20).
- Names are consistent across tasks (`useTheme`, `apiFetch`/`adminFetch`, `useCart`,
  `useI18n`, `parseHomepageSections`, `pickAndPrepareImage`, `registerForPushNotifications`).
- Deliberate scope decisions carried from the spec: no customer accounts, no homepage
  builder, COD only, admin session via JWT in secure store.
- Known limitation: remote push and full store builds require EAS project setup and
  physical devices; automated tests cover logic, the smoke matrix covers device behavior.
