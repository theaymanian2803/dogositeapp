import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { EmptyState } from "../../components/ui/EmptyState";
import { Loading } from "../../components/ui/Loading";
import { PriceText } from "../../components/ui/PriceText";
import { Screen } from "../../components/ui/Screen";
import { useI18n } from "../../lib/i18n";
import { useCategories, useProducts } from "../../lib/queries";
import { useTheme } from "../../theme/theme";

export default function CategoryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const { data, isLoading } = useProducts({ category });
  const { data: categories } = useCategories();
  const { t } = useI18n();
  const { colors } = useTheme();

  const title = categories?.find((c) => c.slug === category)?.name ?? category;

  return (
    <Screen>
      <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "700" }}>{title}</Text>
      {isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <EmptyState message={t("category.empty")} />
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 }}>
          {data.map((product) => (
            <Pressable
              key={product.id}
              onPress={() => router.push(`/product/${product.slug}`)}
              style={{
                width: "47%",
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <Image
                source={{ uri: product.image_url }}
                style={{ width: "100%", height: 140 }}
                contentFit="cover"
              />
              <View style={{ padding: 10, gap: 4 }}>
                <Text
                  numberOfLines={2}
                  style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}
                >
                  {product.name}
                </Text>
                <PriceText value={product.price} size={14} />
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
