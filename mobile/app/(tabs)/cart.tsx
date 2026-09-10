import { Image } from "expo-image";
import { router } from "expo-router";
import { Minus, Plus, Trash2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, shippingFor } from "@petpals/core";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { PriceText } from "../../components/ui/PriceText";
import { Screen } from "../../components/ui/Screen";
import { useCart } from "../../lib/cart";
import { useI18n } from "../../lib/i18n";
import { useSettings } from "../../lib/queries";
import { useTheme } from "../../theme/theme";

export default function CartScreen() {
  const { items, subtotal, setQty, remove } = useCart();
  const { data: settings } = useSettings();
  const { t } = useI18n();
  const { colors } = useTheme();

  const shipping = shippingFor(subtotal, {
    threshold: Number(settings?.free_shipping_threshold) || FREE_SHIPPING_THRESHOLD,
    fee: Number(settings?.shipping_fee) || SHIPPING_FEE,
  });
  const total = subtotal + shipping;

  return (
    <Screen>
      <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "700" }}>
        {t("cart.title")}
      </Text>
      {items.length === 0 ? (
        <View style={{ gap: 16 }}>
          <EmptyState message={t("cart.empty")} />
          <Button label={t("cart.browse")} onPress={() => router.push("/shop")} />
        </View>
      ) : (
        <>
          <View style={{ gap: 12 }}>
            {items.map((item) => (
              <View
                key={item.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <Image
                  source={{ uri: item.image_url }}
                  style={{ width: 64, height: 64, borderRadius: 8 }}
                  contentFit="cover"
                />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    numberOfLines={2}
                    style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}
                  >
                    {item.name}
                  </Text>
                  <PriceText value={item.price} size={14} />
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 9999,
                  }}
                >
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setQty(item.id, item.qty - 1)}
                    style={{ padding: 10 }}
                  >
                    <Minus size={16} color={colors.foreground} />
                  </Pressable>
                  <Text
                    style={{ width: 28, textAlign: "center", fontWeight: "600", color: colors.foreground }}
                  >
                    {item.qty}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setQty(item.id, item.qty + 1)}
                    style={{ padding: 10 }}
                  >
                    <Plus size={16} color={colors.foreground} />
                  </Pressable>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("cart.remove")}
                  onPress={() => remove(item.id)}
                  style={{ padding: 8 }}
                >
                  <Trash2 size={18} color={colors.foreground} />
                </Pressable>
              </View>
            ))}
          </View>
          <View
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 12,
              padding: 16,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: colors.foreground, fontSize: 14 }}>{t("cart.subtotal")}</Text>
              <PriceText value={subtotal} size={14} />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: colors.foreground, fontSize: 14 }}>{t("cart.shipping")}</Text>
              {shipping === 0 ? (
                <Text style={{ color: colors.accent, fontSize: 14, fontWeight: "700" }}>
                  {t("cart.free")}
                </Text>
              ) : (
                <PriceText value={shipping} size={14} />
              )}
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingTop: 10,
              }}
            >
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700" }}>
                {t("cart.total")}
              </Text>
              <PriceText value={total} size={16} />
            </View>
          </View>
          <Button
            label={t("cart.checkout")}
            onPress={() => router.push("/checkout")}
            disabled={items.length === 0}
          />
        </>
      )}
    </Screen>
  );
}