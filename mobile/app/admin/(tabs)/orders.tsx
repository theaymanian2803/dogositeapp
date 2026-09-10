import { useState } from "react";
import { FlatList, Modal, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import type { Order, OrderItem, OrderStatus } from "@petpals/core";
import { Card } from "../../../components/ui/Card";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Loading } from "../../../components/ui/Loading";
import { PriceText } from "../../../components/ui/PriceText";
import { Screen } from "../../../components/ui/Screen";
import { useI18n } from "../../../lib/i18n";
import { useAdminOrders, useDeleteOrder, useUpdateOrderStatus } from "../../../lib/queries";
import { useTheme } from "../../../theme/theme";

const STATUSES: OrderStatus[] = ["new", "processing", "shipped", "delivered", "cancelled"];

function parseItems(raw: string): OrderItem[] {
  try {
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? (arr as OrderItem[]) : [];
  } catch {
    return [];
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function OrderCard({
  order,
  onStatusPress,
  onDelete,
}: {
  order: Order;
  onStatusPress: (order: Order) => void;
  onDelete: (order: Order) => void;
}) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const items = parseItems(order.items);
  const cancelled = order.status === "cancelled";
  const name = `${order.first_name} ${order.last_name}`.trim();

  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "700" }}>{name}</Text>
          <Text style={{ color: colors.foreground, opacity: 0.6, fontSize: 12 }}>
            {formatDate(order.created_at)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("admin.orders.updateStatus")}
          onPress={() => onStatusPress(order)}
          style={{
            backgroundColor: cancelled ? "#DC2626" : colors.secondary,
            borderRadius: 9999,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text
            style={{
              color: cancelled ? "#FFFFFF" : colors.foreground,
              fontSize: 12,
              fontWeight: "600",
            }}
          >
            {t(`track.status.${order.status}`)}
          </Text>
        </Pressable>
      </View>

      <View style={{ gap: 2 }}>
        <Text style={{ color: colors.foreground, fontSize: 13 }}>{order.phone}</Text>
        <Text style={{ color: colors.foreground, opacity: 0.7, fontSize: 13 }}>{order.address}</Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 12,
        }}
      >
        <Text style={{ color: colors.foreground, opacity: 0.7, fontSize: 13 }}>
          {items.length === 1
            ? t("admin.orders.itemsOne")
            : t("admin.orders.items", { count: String(items.length) })}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ color: colors.foreground, fontSize: 13 }}>{t("track.total")}</Text>
          <PriceText value={order.total} size={14} />
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => onDelete(order)}
        style={{ alignSelf: "flex-start", paddingTop: 4 }}
      >
        <Text style={{ color: "#DC2626", fontSize: 13, fontWeight: "600" }}>{t("admin.orders.delete")}</Text>
      </Pressable>
    </Card>
  );
}

function StatusPickerModal({
  order,
  onClose,
  onSelect,
}: {
  order: Order | null;
  onClose: () => void;
  onSelect: (status: OrderStatus) => void;
}) {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <Modal visible={order !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 16,
            gap: 8,
          }}
        >
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", paddingBottom: 8 }}>
            {t("admin.orders.updateStatus")}
          </Text>
          {STATUSES.map((status) => {
            const active = order?.status === status;
            return (
              <Pressable
                key={status}
                accessibilityRole="button"
                onPress={() => onSelect(status)}
                style={{
                  backgroundColor: active ? colors.secondary : "transparent",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{ color: colors.foreground, fontSize: 15, fontWeight: active ? "700" : "500" }}
                >
                  {t(`track.status.${status}`)}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={{
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 9999,
              padding: 14,
              alignItems: "center",
              marginTop: 8,
            }}
          >
            <Text style={{ color: colors.foreground, fontWeight: "600" }}>{t("admin.orders.cancel")}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function AdminOrdersScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<string>("");
  const [pickerOrder, setPickerOrder] = useState<Order | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const { data, isLoading, isRefetching, isError, refetch } = useAdminOrders(filter || undefined);
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();

  const orders = data ?? [];

  function handleSelectStatus(status: OrderStatus) {
    if (!pickerOrder) return;
    const order = pickerOrder;
    setPickerOrder(null);
    setBanner(null);
    updateStatus.mutate(
      { id: order.id, status },
      { onError: () => setBanner(t("admin.orders.updateError")) },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const order = deleteTarget;
    setDeleteTarget(null);
    setBanner(null);
    deleteOrder.mutate(order.id, { onError: () => setBanner(t("admin.orders.deleteError")) });
  }

  return (
    <Screen scroll={false}>
      <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "700" }}>{t("admin.orders")}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {["", ...STATUSES].map((status) => {
          const active = filter === status;
          return (
            <Pressable
              key={status || "all"}
              accessibilityRole="button"
              onPress={() => {
                setBanner(null);
                setFilter(status);
              }}
              style={{
                backgroundColor: active ? colors.accent : colors.secondary,
                borderRadius: 9999,
                paddingHorizontal: 18,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: active ? "#FFFFFF" : colors.foreground, fontWeight: "600" }}>
                {status ? t(`track.status.${status}`) : t("admin.orders.all")}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

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
          data={orders}
          keyExtractor={(order) => order.id}
          renderItem={({ item }) => (
            <OrderCard order={item} onStatusPress={setPickerOrder} onDelete={setDeleteTarget} />
          )}
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
              <EmptyState message={isError ? t("admin.orders.loadError") : t("admin.orders.empty")} />
            </View>
          }
        />
      )}

      <StatusPickerModal order={pickerOrder} onClose={() => setPickerOrder(null)} onSelect={handleSelectStatus} />

      <ConfirmDialog
        visible={deleteTarget !== null}
        title={t("admin.orders.deleteTitle")}
        message={t("admin.orders.deleteMessage", {
          name: deleteTarget ? `${deleteTarget.first_name} ${deleteTarget.last_name}`.trim() : "",
        })}
        confirmLabel={t("admin.orders.deleteConfirm")}
        cancelLabel={t("admin.orders.cancel")}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Screen>
  );
}