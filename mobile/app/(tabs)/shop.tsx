import { useEffect, useState } from "react";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { EmptyState } from "../../components/ui/EmptyState";
import { Loading } from "../../components/ui/Loading";
import { PriceText } from "../../components/ui/PriceText";
import { Screen } from "../../components/ui/Screen";
import { useI18n } from "../../lib/i18n";
import { useCategories, useProducts } from "../../lib/queries";
import { useTheme } from "../../theme/theme";

export default function ShopScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(id);
  }, [query]);

const { data, isLoading, isError } = useProducts({ q: debouncedQuery || undefined });
  const { data: categories } = useCategories();

  function toggleCategory(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

const visible = (data ?? []).filter((p) => selected.size === 0 || selected.has(p.category));

  return (
    <Screen>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t("nav.search")}
        placeholderTextColor="#9CA3AF"
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          color: colors.foreground,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {categories?.map((category) => {
          const active = selected.has(category.slug);
          return (
            <Pressable
              key={category.id}
              onPress={() => toggleCategory(category.slug)}
              style={{
                backgroundColor: active ? colors.accent : colors.secondary,
                borderRadius: 9999,
                paddingHorizontal: 18,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: active ? "#FFFFFF" : colors.foreground, fontWeight: "600" }}>
                {category.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
{isLoading ? (
        <Loading />
      ) : isError ? (
        <EmptyState message={t("shop.loadError")} />
      ) : visible.length === 0 ? (
        <EmptyState message={t("shop.noResults")} />
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 }}>
          {visible.map((product) => (
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
