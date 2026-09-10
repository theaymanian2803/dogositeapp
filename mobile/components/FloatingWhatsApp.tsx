import { Linking, Pressable, View } from "react-native";
import { MessageCircle } from "lucide-react-native";
import type { Settings } from "@petpals/core";
import { waLinkFrom } from "@petpals/core";
import { useI18n } from "../lib/i18n";
import { useTheme } from "../theme/theme";

export function FloatingWhatsApp({ settings }: { settings: Settings }) {
  const { t } = useI18n();
  const { colors } = useTheme();

  if (!settings.whatsapp_number) return null;
  const url = waLinkFrom(settings.whatsapp_number, "Hello!");
  if (!url) return null;

  return (
    <View style={{ position: "absolute", right: 20, bottom: 24 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("whatsapp.label")}
        onPress={() => {
          Linking.openURL(url).catch(() => {});
        }}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.accent,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        <MessageCircle size={26} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
