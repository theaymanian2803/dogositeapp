import { Image } from "expo-image";
import { router } from "expo-router";
import { Text, View } from "react-native";
import type { Settings } from "@petpals/core";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { useI18n } from "../../lib/i18n";
import { useTheme } from "../../theme/theme";

export function HeroSection({ settings }: { settings: Settings }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <View style={{ gap: 12 }}>
      {settings.hero_image ? (
        <Image
          source={{ uri: settings.hero_image }}
          style={{ width: "100%", height: 220, borderRadius: 16 }}
          contentFit="cover"
        />
      ) : null}
      <Badge>{settings.hero_badge}</Badge>
      <Text
        style={{
          color: colors.foreground,
          fontSize: 32,
          fontWeight: "800",
          lineHeight: 38,
        }}
      >
        {settings.hero_title}
      </Text>
      <Text style={{ color: colors.foreground, opacity: 0.7, fontSize: 15, lineHeight: 22 }}>
        {settings.hero_subtitle}
      </Text>
      <Button label={t("hero.shop")} onPress={() => router.push("/shop")} />
    </View>
  );
}