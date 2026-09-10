import { router } from "expo-router";
import { Text, View } from "react-native";
import type { Settings } from "@petpals/core";
import { Button } from "../ui/Button";
import { useI18n } from "../../lib/i18n";
import { useTheme } from "../../theme/theme";

export function PromoSection({ settings }: { settings: Settings }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.accent,
        borderRadius: 16,
        padding: 24,
        gap: 10,
      }}
    >
      <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "800" }}>
        {settings.promo_title}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
        <Text
          style={{
            color: "#FFFFFF",
            opacity: 0.7,
            fontSize: 15,
            textDecorationLine: "line-through",
          }}
        >
          {settings.promo_old_price}
        </Text>
        <Text style={{ color: "#FFFFFF", fontSize: 26, fontWeight: "800" }}>
          {settings.promo_price}
        </Text>
      </View>
      <Button label={t("promo.shop")} onPress={() => router.push("/shop")} />
    </View>
  );
}