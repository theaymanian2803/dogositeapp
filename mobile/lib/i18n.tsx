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