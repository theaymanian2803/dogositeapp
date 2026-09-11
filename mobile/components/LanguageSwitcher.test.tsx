import { fireEvent, render } from "@testing-library/react-native";
import { I18nManager } from "react-native";
import { I18nProvider } from "../lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

jest.mock("../theme/theme", () => ({
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

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

describe("LanguageSwitcher", () => {
  it("renders a button per language with the native label", async () => {
    const { findByText } = await render(
      <I18nProvider defaultLanguage="fr">
        <LanguageSwitcher />
      </I18nProvider>,
    );
    expect(await findByText("Français")).toBeTruthy();
    expect(await findByText("English")).toBeTruthy();
    expect(await findByText("العربية")).toBeTruthy();
  });

  it("switching to a non-RTL language does not flip layout direction", async () => {
    I18nManager.isRTL = false;
    (I18nManager as unknown as { allowRTL: jest.Mock }).allowRTL = jest.fn();
    (I18nManager as unknown as { forceRTL: jest.Mock }).forceRTL = jest.fn();
    const { findByRole } = await render(
      <I18nProvider defaultLanguage="fr">
        <LanguageSwitcher />
      </I18nProvider>,
    );
    await fireEvent.press(await findByRole("button", { name: "en" }));
    expect(I18nManager.forceRTL).not.toHaveBeenCalled();
  });
});