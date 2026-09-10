import { useState } from "react";
import { Star } from "lucide-react-native";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import type { Review } from "@petpals/core";
import { Card } from "../../../components/ui/Card";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Loading } from "../../../components/ui/Loading";
import { Screen } from "../../../components/ui/Screen";
import { useI18n } from "../../../lib/i18n";
import { useAdminReviews, useDeleteReview, useUpdateReviewStatus } from "../../../lib/queries";
import { useTheme } from "../../../theme/theme";

type AdminReview = Review & { product_name?: string };
type Filter = "all" | "pending" | "approved";

const FILTERS: Filter[] = ["all", "pending", "approved"];

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          color={i <= rating ? colors.accent : colors.border}
          fill={i <= rating ? colors.accent : "transparent"}
        />
      ))}
    </View>
  );
}

function ReviewCard({
  review,
  onStatusPress,
  onDelete,
}: {
  review: AdminReview;
  onStatusPress: (review: AdminReview) => void;
  onDelete: (review: AdminReview) => void;
}) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const approved = review.status === "approved";
  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "700" }} numberOfLines={1}>
            {review.product_name ?? review.product_id}
          </Text>
          <Text style={{ color: colors.foreground, opacity: 0.6, fontSize: 12 }}>{review.user_name}</Text>
          <Stars rating={review.rating} />
        </View>
        <View
          style={{
            backgroundColor: approved ? colors.accent : colors.secondary,
            borderRadius: 9999,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text
            style={{
              color: approved ? "#FFFFFF" : colors.foreground,
              fontSize: 12,
              fontWeight: "600",
            }}
          >
            {approved ? t("admin.reviews.approved") : t("admin.reviews.pending")}
          </Text>
        </View>
      </View>

      {review.title ? (
        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>{review.title}</Text>
      ) : null}
      <Text style={{ color: colors.foreground, opacity: 0.7, fontSize: 13 }}>{review.body}</Text>

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
          onPress={() => onStatusPress(review)}
          style={{ paddingVertical: 2 }}
        >
          <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "600" }}>
            {approved ? t("admin.reviews.setPending") : t("admin.reviews.approve")}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onDelete(review)}
          style={{ paddingVertical: 2 }}
        >
          <Text style={{ color: "#DC2626", fontSize: 13, fontWeight: "600" }}>
            {t("admin.reviews.delete")}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}

export default function AdminReviewsScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<Filter>("all");
  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const { data, isLoading, isRefetching, isError, refetch } = useAdminReviews();
  const updateStatus = useUpdateReviewStatus();
  const deleteReview = useDeleteReview();

  const reviews = (data ?? []).filter((review) => filter === "all" || review.status === filter);

  function handleStatusPress(review: AdminReview) {
    setBanner(null);
    updateStatus.mutate(
      { id: review.id, status: review.status === "approved" ? "pending" : "approved" },
      { onError: () => setBanner(t("admin.reviews.updateError")) },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const review = deleteTarget;
    setDeleteTarget(null);
    setBanner(null);
    deleteReview.mutate(review.id, { onError: () => setBanner(t("admin.reviews.deleteError")) });
  }

  return (
    <Screen scroll={false}>
      <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "700" }}>
        {t("admin.reviews")}
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {FILTERS.map((value) => {
          const active = filter === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              onPress={() => {
                setBanner(null);
                setFilter(value);
              }}
              style={{
                backgroundColor: active ? colors.accent : colors.secondary,
                borderRadius: 9999,
                paddingHorizontal: 18,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: active ? "#FFFFFF" : colors.foreground, fontWeight: "600" }}>
                {t(`admin.reviews.${value}`)}
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
          data={reviews}
          keyExtractor={(review) => review.id}
          renderItem={({ item }) => (
            <ReviewCard review={item} onStatusPress={handleStatusPress} onDelete={setDeleteTarget} />
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
              <EmptyState message={isError ? t("admin.reviews.loadError") : t("admin.reviews.empty")} />
            </View>
          }
        />
      )}

      <ConfirmDialog
        visible={deleteTarget !== null}
        title={t("admin.reviews.deleteTitle")}
        message={t("admin.reviews.deleteMessage")}
        confirmLabel={t("admin.reviews.deleteConfirm")}
        cancelLabel={t("admin.reviews.cancel")}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Screen>
  );
}