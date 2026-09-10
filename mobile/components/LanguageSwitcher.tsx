import { Pressable, Text, View } from "react-native";
import { LANGS } from "@petpals/core";
import { useI18n } from "../lib/i18n";
import { useTheme } from "../theme/theme";

export function LanguageSwitcher() {
  const { t, lang, setLang } = useI18n();
  const { colors } = useTheme();
  return (
    <View style={{ gap: 8, marginTop: 8 }}>
      <Text style={{ color: colors.foreground, opacity: 0.6, fontSize: 13 }}>{t("lang.label")}</Text>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {LANGS.map((l) => {
          const active = l.code === lang;
          return (
            <Pressable
              key={l.code}
              accessibilityRole="button"
              accessibilityLabel={l.code}
              onPress={() => setLang(l.code)}
              style={{
                backgroundColor: active ? colors.accent : "transparent",
                borderColor: active ? colors.accent : colors.border,
                borderWidth: 1,
                borderRadius: 9999,
                paddingVertical: 8,
                paddingHorizontal: 16,
              }}
            >
              <Text
                style={{
                  color: active ? "#FFFFFF" : colors.foreground,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {l.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}