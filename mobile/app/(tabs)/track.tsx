import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Fragment, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { Order, OrderItem } from "@petpals/core";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { PriceText } from "../../components/ui/PriceText";
import { Screen } from "../../components/ui/Screen";
import { useI18n } from "../../lib/i18n";
import { useTrackOrders } from "../../lib/queries";
import { useTheme } from "../../theme/theme";

const TIMELINE = ["new", "processing", "shipped", "delivered"] as const;

const STATUS_STEP: Record<string, number> = {
  new: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
  cancelled: -1,
};

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

function StatusStepper({ step }: { step: number }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      {TIMELINE.map((key, i) => {
        const done = i <= step;
        return (
          <Fragment key={key}>
            <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: done ? colors.accent : colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: done ? "#FFFFFF" : "#9CA3AF",
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  {i + 1}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 10,
                  textAlign: "center",
                  color: done ? colors.foreground : "#9CA3AF",
                }}
              >
                {t(`track.status.${key}`)}
              </Text>
            </View>
            {i < TIMELINE.length - 1 ? (
              <View
                style={{
                  width: 12,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: i < step ? colors.accent : colors.border,
                  marginTop: 11,
                }}
              />
            ) : null}
          </Fragment>
        );
      })}
    </View>
  );
}

function OrderCard({ order }: { order: Order }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const items = parseItems(order.items);
  const cancelled = order.status === "cancelled";
  const step = STATUS_STEP[order.status] ?? 0;

  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <View style={{ gap: 2 }}>
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "700" }}>
            {t("track.orderNo", { code: order.id.slice(0, 8) })}
          </Text>
          <Text style={{ color: colors.foreground, opacity: 0.6, fontSize: 12 }}>
            {t("track.placed", { date: formatDate(order.created_at) })}
          </Text>
        </View>
        {cancelled ? (
          <View style={{ backgroundColor: "#DC2626", borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "600" }}>
              {t("track.status.cancelled")}
            </Text>
          </View>
        ) : null}
      </View>

      {!cancelled ? <StatusStepper step={step} /> : null}

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
          {items.length === 1 ? t("track.itemsOne") : t("track.items", { count: String(items.length) })}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ color: colors.foreground, fontSize: 13 }}>{t("track.total")}</Text>
          <PriceText value={order.total} size={14} />
        </View>
      </View>
    </Card>
  );
}

export default function TrackScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("petpals_last_phone")
      .then((v) => {
        if (v) setPhone(v);
      })
      .catch(() => {});
  }, []);

  const { data, isFetching, isError } = useTrackOrders(searched);
  const orders = data ?? [];
  const searchedSomething = searched.length > 0;
  const notFound = searchedSomething && (isError || (data !== undefined && orders.length === 0));

  function handleSearch() {
    const q = phone.trim();
    if (!q) return;
    setSearched(q);
  }

  return (
    <Screen>
      <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "700" }}>
        {t("track.title")}
      </Text>
      <Text style={{ color: colors.foreground, opacity: 0.7, fontSize: 14, lineHeight: 21 }}>
        {t("track.subtitle")}
      </Text>
      <Input
        label={t("checkout.phone")}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder={t("track.phonePlaceholder")}
      />
      <Button
        label={isFetching ? t("track.searching") : t("track.search")}
        onPress={handleSearch}
        loading={isFetching}
        disabled={isFetching}
      />

      {isFetching ? (
        <Text style={{ textAlign: "center", color: colors.foreground, opacity: 0.6, fontSize: 13 }}>
          {t("track.searching")}
        </Text>
      ) : null}

      {!isFetching && notFound ? (
        <View
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 12,
            padding: 24,
            gap: 8,
          }}
        >
          <Text style={{ color: colors.foreground, fontWeight: "600", textAlign: "center" }}>
            {t("track.empty", { phone: searched })}
          </Text>
          <Text style={{ color: colors.foreground, opacity: 0.6, fontSize: 12, textAlign: "center" }}>
            {t("track.emptyHint")}
          </Text>
        </View>
      ) : null}

      {!isFetching && !notFound && searchedSomething && orders.length > 0 ? (
        <View style={{ gap: 16 }}>
          <Text style={{ color: colors.foreground, opacity: 0.6, fontSize: 13 }}>
            {t(orders.length > 1 ? "track.foundPlural" : "track.found", {
              count: String(orders.length),
              phone: searched,
            })}
          </Text>
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 4 }}>
            <Text style={{ color: colors.foreground, opacity: 0.6, fontSize: 12 }}>
              {t("track.contact")}
            </Text>
            <Pressable accessibilityRole="link" onPress={() => router.push("/info/contact")}>
              <Text style={{ color: colors.accent, fontSize: 12 }}>{t("track.contactUs")}</Text>
            </Pressable>
            <Text style={{ color: colors.foreground, opacity: 0.6, fontSize: 12 }}>
              — {t("track.payOnDelivery")}
            </Text>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}
