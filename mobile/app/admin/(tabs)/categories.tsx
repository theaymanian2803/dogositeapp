import { useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import type { Category } from "@petpals/core";
import { Card } from "../../../components/ui/Card";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Loading } from "../../../components/ui/Loading";
import { Screen } from "../../../components/ui/Screen";
import { useI18n } from "../../../lib/i18n";
import { useAdminCategories, useCreateCategory, useDeleteCategory } from "../../../lib/queries";
import { useTheme } from "../../../theme/theme";

function CategoryRow({
  category,
  onDelete,
}: {
  category: Category;
  onDelete: (category: Category) => void;
}) {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "700" }} numberOfLines={1}>
            {category.name}
          </Text>
          <Text style={{ color: colors.foreground, opacity: 0.6, fontSize: 12 }} numberOfLines={1}>
            {category.slug}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => onDelete(category)}
          style={{ paddingVertical: 2 }}
        >
          <Text style={{ color: "#DC2626", fontSize: 13, fontWeight: "600" }}>
            {t("admin.categories.delete")}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}

export default function AdminCategoriesScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const { data, isLoading, isRefetching, isError, refetch } = useAdminCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const categories = data ?? [];
  const trimmed = name.trim();
  const canAdd = trimmed.length > 0 && !createCategory.isPending;

  function handleAdd() {
    if (!canAdd) return;
    setBanner(null);
    setName("");
    createCategory.mutate(trimmed, { onError: () => setBanner(t("admin.categories.addError")) });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const category = deleteTarget;
    setDeleteTarget(null);
    setBanner(null);
    deleteCategory.mutate(category.id, { onError: () => setBanner(t("admin.categories.deleteError")) });
  }

  return (
    <Screen scroll={false}>
      <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "700" }}>
        {t("admin.categories")}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t("admin.categories.placeholder")}
          placeholderTextColor="#9CA3AF"
          onSubmitEditing={handleAdd}
          returnKeyType="done"
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            color: colors.foreground,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        />
        <Pressable
          accessibilityRole="button"
          onPress={handleAdd}
          disabled={!canAdd}
          style={{
            backgroundColor: colors.accent,
            borderRadius: 12,
            paddingHorizontal: 18,
            paddingVertical: 12,
            opacity: canAdd ? 1 : 0.5,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>
            {t("admin.categories.add")}
          </Text>
        </Pressable>
      </View>

      {banner ? (
        <View
          style={{
            backgroundColor: colors.card,
            borderColor: "#DC2626",
            borderWidth: 1,
            borderRadius: 8,
            padding: 10,
          }}
        >
          <Text style={{ color: "#DC2626", fontSize: 13 }}>{banner}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(category) => category.id}
          renderItem={({ item }) => <CategoryRow category={item} onDelete={setDeleteTarget} />}
          contentContainerStyle={{ gap: 16, paddingBottom: 24, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: "center" }}>
              <EmptyState message={isError ? t("admin.categories.loadError") : t("admin.categories.empty")} />
            </View>
          }
        />
      )}

      <ConfirmDialog
        visible={deleteTarget !== null}
        title={t("admin.categories.deleteTitle")}
        message={t("admin.categories.deleteMessage", { name: deleteTarget?.name ?? "" })}
        confirmLabel={t("admin.categories.deleteConfirm")}
        cancelLabel={t("admin.categories.cancel")}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Screen>
  );
}