import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle2 } from "lucide-react-native";
import { Text, View } from "react-native";
import { Button } from "../components/ui/Button";
import { Screen } from "../components/ui/Screen";
import { useI18n } from "../lib/i18n";
import { useTheme } from "../theme/theme";

export default function OrderConfirmedScreen() {
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const { t } = useI18n();
  const { colors } = useTheme();

  function handleTrack() {
    if (phone) AsyncStorage.setItem("petpals_last_phone", phone).catch(() => {});
    router.replace("/track");
  }

  return (
    <Screen>
      <View style={{ alignItems: "center", gap: 12, paddingTop: 32 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.muted,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckCircle2 size={40} color={colors.accent} />
        </View>
        <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "700", textAlign: "center" }}>
          {t("confirmed.title")}
        </Text>
        <Text
          style={{
            color: colors.foreground,
            opacity: 0.8,
            fontSize: 14,
            lineHeight: 21,
            textAlign: "center",
          }}
        >
          {t("confirmed.message", { phone: phone || t("confirmed.you") })}
        </Text>
      </View>
      <View style={{ gap: 12, marginTop: 16 }}>
        <Button label={t("confirmed.track")} onPress={handleTrack} />
        <Button label={t("confirmed.continue")} variant="outline" onPress={() => router.replace("/shop")} />
      </View>
    </Screen>
  );
}
