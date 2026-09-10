import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { Settings } from "@petpals/core";
import { EmptyState } from "../ui/EmptyState";
import { useCategories } from "../../lib/queries";
import { useI18n } from "../../lib/i18n";
import { useTheme } from "../../theme/theme";

export function CategoriesSection({ settings }: { settings: Settings }) {
  const { data, isLoading, error } = useCategories();
  const { t } = useI18n();
  const { colors } = useTheme();
  if (isLoading || error) return null;
  if (!data?.length) return <EmptyState message={t("shop.noCategories")} />;
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "700" }}>
        {t("categories.title")}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10 }}
      >
        {data.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => router.push(`/category/${category.slug}`)}
            style={{
              backgroundColor: colors.secondary,
              borderRadius: 9999,
              paddingHorizontal: 18,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: colors.foreground, fontWeight: "600" }}>{category.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}