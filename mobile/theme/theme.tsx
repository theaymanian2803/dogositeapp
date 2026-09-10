import { createContext, useContext, type ReactNode } from "react";
import Constants from "expo-constants";
import { clients } from "../clients";
import type { ClientConfig } from "../clients/petpals";
import { resolveClient } from "./resolveClient";

type ThemeValue = { colors: ClientConfig["colors"]; currency: string };

const defaultClient = resolveClient(clients, undefined);

const ThemeContext = createContext<ThemeValue>({
  colors: defaultClient.colors,
  currency: defaultClient.currency,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const extra = Constants.expoConfig?.extra ?? {};
  const slug = typeof extra.client === "string" ? extra.client : undefined;
  const client = resolveClient(clients, slug);
  return (
    <ThemeContext.Provider value={{ colors: client.colors, currency: client.currency }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
