import { useState } from "react";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import type { Product } from "@petpals/core";
import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Loading } from "../../../components/ui/Loading";
import { PriceText } from "../../../components/ui/PriceText";
import { Screen } from "../../../components/ui/Screen";
import { useI18n } from "../../../lib/i18n";
import { useAdminProducts, useDeleteProduct } from "../../../lib/queries";
import { useTheme } from "../../../theme/theme";

function ProductCard({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Image
          source={{ uri: product.image_url }}
          style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: colors.secondary }}
          contentFit="cover"
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "700" }} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={{ color: colors.foreground, opacity: 0.6, fontSize: 12 }}>
            {product.category}
          </Text>
          {product.badge ? (
            <View style={{ marginTop: 2 }}>
              <Badge>{product.badge}</Badge>
            </View>
          ) : null}
        </View>
        <PriceText value={product.price} size={14} />
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 20,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 12,
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => onEdit(product)}
          style={{ paddingVertical: 2 }}
        >
          <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "600" }}>
            {t("admin.products.edit")}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onDelete(product)}
          style={{ paddingVertical: 2 }}
        >
          <Text style={{ color: "#DC2626", fontSize: 13, fontWeight: "600" }}>
            {t("admin.products.delete")}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}

export default function AdminProductsScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const { data, isLoading, isRefetching, isError, refetch } = useAdminProducts();
  const deleteProduct = useDeleteProduct();

  const products = data ?? [];

  function handleDelete() {
    if (!deleteTarget) return;
    const product = deleteTarget;
    setDeleteTarget(null);
    setBanner(null);
    deleteProduct.mutate(product.id, { onError: () => setBanner(t("admin.products.deleteError")) });
  }

  return (
    <Screen scroll={false}>
      <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "700" }}>
        {t("admin.products")}
      </Text>

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
          data={products}
          keyExtractor={(product) => product.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onEdit={(product) => router.push(`/admin/product-form?id=${product.id}`)}
              onDelete={setDeleteTarget}
            />
          )}
          contentContainerStyle={{ gap: 16, paddingBottom: 96, flexGrow: 1 }}
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
              <EmptyState message={isError ? t("admin.products.loadError") : t("admin.products.empty")} />
            </View>
          }
        />
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/admin/product-form")}
        style={{
          position: "absolute",
          right: 20,
          bottom: 20,
          backgroundColor: colors.accent,
          borderRadius: 9999,
          paddingHorizontal: 20,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Plus size={18} color="#FFFFFF" />
        <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>
          {t("admin.products.add")}
        </Text>
      </Pressable>

      <ConfirmDialog
        visible={deleteTarget !== null}
        title={t("admin.products.deleteTitle")}
        message={t("admin.products.deleteMessage", { name: deleteTarget?.name ?? "" })}
        confirmLabel={t("admin.products.deleteConfirm")}
        cancelLabel={t("admin.products.cancel")}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Screen>
  );
}
