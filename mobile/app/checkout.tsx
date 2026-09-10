import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, shippingFor } from "@petpals/core";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { PriceText } from "../components/ui/PriceText";
import { Screen } from "../components/ui/Screen";
import { useCart } from "../lib/cart";
import { validateCheckout, type CheckoutForm } from "../lib/checkout";
import { useI18n } from "../lib/i18n";
import { useCreateOrder, useSettings } from "../lib/queries";
import { useTheme } from "../theme/theme";

const emptyForm: CheckoutForm = { first_name: "", last_name: "", phone: "", address: "" };

export default function CheckoutScreen() {
  const { items, subtotal, clear } = useCart();
  const { data: settings } = useSettings();
  const { t } = useI18n();
  const { colors } = useTheme();
  const createOrder = useCreateOrder();
  const submittedRef = useRef(false);
  const [form, setForm] = useState<CheckoutForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const shipping = shippingFor(subtotal, {
    threshold: Number(settings?.free_shipping_threshold) || FREE_SHIPPING_THRESHOLD,
    fee: Number(settings?.shipping_fee) || SHIPPING_FEE,
  });
  const total = subtotal + shipping;

  useEffect(() => {
    if (items.length === 0) router.replace("/cart");
  }, [items.length]);

  if (items.length === 0) return <Screen>{null}</Screen>;

  function update(key: keyof CheckoutForm, value: string) {
    const next = { ...form, [key]: value };
    setForm(next);
    if (Object.keys(errors).length > 0) setErrors(validateCheckout(next));
  }

  async function handleSubmit() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const nextErrors = validateCheckout(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitError("");
    try {
      const phone = form.phone.trim();
      await createOrder.mutateAsync({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone,
        address: form.address.trim(),
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          qty: i.qty,
          price: Number(i.price),
          image_url: i.image_url,
        })),
        total,
      });
      AsyncStorage.setItem("petpals_last_phone", phone).catch(() => {});
      clear();
      router.replace(`/order-confirmed?phone=${encodeURIComponent(phone)}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t("checkout.error"));
    }
  }

  return (
    <Screen keyboardShouldPersistTaps="handled">
      <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "700" }}>
        {t("checkout.title")}
      </Text>
      <View style={{ gap: 12 }}>
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700" }}>
          {t("checkout.yourDetails")}
        </Text>
        <Input
          label={t("checkout.firstName")}
          value={form.first_name}
          onChangeText={(v) => update("first_name", v)}
          error={errors.first_name}
        />
        <Input
          label={t("checkout.lastName")}
          value={form.last_name}
          onChangeText={(v) => update("last_name", v)}
          error={errors.last_name}
        />
        <Input
          label={t("checkout.phone")}
          value={form.phone}
          onChangeText={(v) => update("phone", v)}
          keyboardType="phone-pad"
          error={errors.phone}
        />
        <Input
          label={t("checkout.address")}
          value={form.address}
          onChangeText={(v) => update("address", v)}
          multiline
          error={errors.address}
        />
        <Text style={{ color: colors.foreground, opacity: 0.7, fontSize: 13 }}>
          {t("checkout.payOnDelivery")}
        </Text>
      </View>
      <View
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 12,
          padding: 16,
          gap: 12,
        }}
      >
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700" }}>
          {t("checkout.yourOrder")}
        </Text>
        <View style={{ gap: 10 }}>
          {items.map((item) => (
            <View key={item.id} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Image
                source={{ uri: item.image_url }}
                style={{ width: 40, height: 40, borderRadius: 8 }}
                contentFit="cover"
              />
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}
                >
                  {item.name}
                </Text>
                <Text style={{ color: colors.foreground, opacity: 0.6, fontSize: 12 }}>
                  × {item.qty}
                </Text>
              </View>
              <PriceText value={item.price} size={14} />
            </View>
          ))}
        </View>
        <View style={{ gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: colors.foreground, fontSize: 14 }}>{t("checkout.subtotal")}</Text>
            <PriceText value={subtotal} size={14} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: colors.foreground, fontSize: 14 }}>{t("checkout.shipping")}</Text>
            {shipping === 0 ? (
              <Text style={{ color: colors.accent, fontSize: 14, fontWeight: "700" }}>
                {t("checkout.free")}
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
              {t("checkout.total")}
            </Text>
            <PriceText value={total} size={16} />
          </View>
        </View>
      </View>
      {submitError ? (
        <Text style={{ color: "#DC2626", fontSize: 13, textAlign: "center" }}>{submitError}</Text>
      ) : null}
      <Button
        label={createOrder.isPending ? t("checkout.placing") : t("checkout.place")}
        onPress={handleSubmit}
        loading={createOrder.isPending}
        disabled={createOrder.isPending}
      />
    </Screen>
  );
}
