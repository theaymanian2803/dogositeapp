import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { Settings } from "@petpals/core";
import { EmptyState } from "../ui/EmptyState";
import { PriceText } from "../ui/PriceText";
import { useProducts } from "../../lib/queries";
import { useI18n } from "../../lib/i18n";
import { useTheme } from "../../theme/theme";

export function BestSection({ settings }: { settings: Settings }) {
  const { data, isLoading, error } = useProducts({ limit: 4 });
  const { t } = useI18n();
  const { colors } = useTheme();
  if (isLoading || error) return null;
  if (!data?.length) return <EmptyState message={t("shop.noProducts")} />;
  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 4 }}>
        <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "700" }}>
          {t("best.title")}
        </Text>
        <Text style={{ color: colors.foreground, opacity: 0.7, fontSize: 14, lineHeight: 20 }}>
          {t("best.subtitle")}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
      >
        {data.map((product) => (
          <Pressable
            key={product.id}
            onPress={() => router.push(`/product/${product.slug}`)}
            style={{
              width: 160,
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <Image
              source={{ uri: product.image_url }}
              style={{ width: "100%", height: 120 }}
              contentFit="cover"
            />
            <View style={{ padding: 10, gap: 4 }}>
              <Text
                numberOfLines={2}
                style={{ color: colors.foreground, fontSize: 13, fontWeight: "600" }}
              >
                {product.name}
              </Text>
              <PriceText value={product.price} size={14} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}