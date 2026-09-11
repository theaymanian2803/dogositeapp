import "tsx/cjs";

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
  ios: { bundleIdentifier: client.iosBundleId, supportsTablet: true },
  android: { package: client.androidPackage },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-notifications",
    "expo-localization",
    [
      "expo-splash-screen",
      {
        image: client.assets.splash,
        resizeMode: "contain",
        backgroundColor: client.colors.background,
      },
    ],
  ],
  experiments: { typedRoutes: true },
  extra: {
    client: client.slug,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? client.apiUrl,
    defaultLanguage: client.defaultLanguage,
    currency: client.currency,
    eas: { projectId: process.env.EAS_PROJECT_ID },
  },
};

export default config;
