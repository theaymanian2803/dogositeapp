import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import Constants from "expo-constants";
import type { ReactNode } from "react";
import type { Lang } from "@petpals/core";
import { Toaster } from "sonner-native";
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
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
        </I18nProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}