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
