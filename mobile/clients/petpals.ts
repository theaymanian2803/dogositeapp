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
