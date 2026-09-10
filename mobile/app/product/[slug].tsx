import { useState } from "react";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Minus, Plus, Star } from "lucide-react-native";
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { toast } from "sonner-native";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Loading } from "../../components/ui/Loading";
import { PriceText } from "../../components/ui/PriceText";
import { Screen } from "../../components/ui/Screen";
import { useCart } from "../../lib/cart";
import { useI18n } from "../../lib/i18n";
import { useCreateReview, useProduct } from "../../lib/queries";
import { useTheme } from "../../theme/theme";

function parseImages(raw: string | null): string[] {
  try {
    const arr = JSON.parse(raw ?? "[]");
    return Array.isArray(arr) ? (arr as string[]) : [];
  } catch {
    return [];
  }
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
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

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data, isLoading, error } = useProduct(slug ?? "");
  const { t } = useI18n();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { add } = useCart();
  const createReview = useCreateReview();
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  if (isLoading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  if (error || !data?.product) {
    return (
      <Screen>
        <EmptyState message={error ? t("product.loadError") : t("product.notFound")} />
      </Screen>
    );
  }

  const { product, related, reviews } = data;
  const gallery = (() => {
    const images = parseImages(product.images);
    return images.length > 0 ? images : [product.image_url];
  })();

  function handleAdd() {
    add(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image_url: product.image_url,
      },
      qty,
    );
    toast.success(t("product.addedToCart", { name: product.name }));
  }

  function handleSubmitReview() {
    const r = Math.min(5, Math.max(1, Math.round(rating)));
    if (!name.trim() || !body.trim()) return;
    createReview.mutate(
      {
        product_id: product.id,
        user_name: name.trim(),
        rating: r,
        title: title.trim() || undefined,
        body: body.trim(),
      },
      {
        onSuccess: () => {
          toast.success(t("product.reviewPending"));
          setName("");
          setRating(5);
          setTitle("");
          setBody("");
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : t("product.reviewError")),
      },
    );
  }

  const canSubmitReview = name.trim().length > 0 && body.trim().length > 0 && !createReview.isPending;

  return (
    <Screen>
      {gallery.length > 1 ? (
        <View>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {gallery.map((src, i) => (
              <Image
                key={`${src}-${i}`}
                source={{ uri: src }}
                style={{ width: width - 32, height: 300 }}
                contentFit="contain"
              />
            ))}
          </ScrollView>
        </View>
      ) : (
        <Image
          source={{ uri: gallery[0] }}
          style={{ width: "100%", height: 300 }}
          contentFit="contain"
        />
      )}

      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "600", textTransform: "uppercase" }}>
          {product.category}
        </Text>
        <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "700" }}>{product.name}</Text>
        <PriceText value={product.price} size={22} />
        {(product.badge || product.tag) && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {product.badge ? <Badge>{product.badge}</Badge> : null}
            {product.tag ? <Badge>{product.tag}</Badge> : null}
          </View>
        )}
        <Text style={{ color: colors.foreground, opacity: 0.8, fontSize: 14, lineHeight: 21 }}>
          {product.description}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
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
            onPress={() => setQty(Math.max(1, qty - 1))}
            style={{ padding: 12 }}
          >
            <Minus size={18} color={colors.foreground} />
          </Pressable>
          <Text style={{ width: 32, textAlign: "center", fontWeight: "600", color: colors.foreground }}>
            {qty}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => setQty(qty + 1)} style={{ padding: 12 }}>
            <Plus size={18} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={{ flex: 1 }}>
          <Button label={t("products.add")} onPress={handleAdd} />
        </View>
      </View>

      {related.length > 0 && (
        <View style={{ gap: 12 }}>
          <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "700" }}>
            {t("product.related")}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {related.map((p) => (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                onPress={() => router.push(`/product/${p.slug}`)}
                style={{
                  width: 140,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <Image source={{ uri: p.image_url }} style={{ width: "100%", height: 110 }} contentFit="cover" />
                <View style={{ padding: 8, gap: 4 }}>
                  <Text
                    numberOfLines={2}
                    style={{ color: colors.foreground, fontSize: 13, fontWeight: "600" }}
                  >
                    {p.name}
                  </Text>
                  <PriceText value={p.price} size={13} />
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={{ gap: 12 }}>
        <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "700" }}>
          {t("product.reviews")}
        </Text>
        {reviews.length === 0 ? (
          <EmptyState message={t("product.noReviews")} />
        ) : (
          reviews.map((r) => (
            <View
              key={r.id}
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                padding: 12,
                gap: 6,
              }}
            >
              <Stars rating={r.rating} />
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>
                {r.user_name}
              </Text>
              <Text style={{ color: colors.foreground, opacity: 0.6, fontSize: 12 }}>
                {new Date(r.created_at).toLocaleDateString()}
              </Text>
              {r.title ? (
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "700" }}>
                  {r.title}
                </Text>
              ) : null}
              <Text style={{ color: colors.foreground, opacity: 0.8, fontSize: 14, lineHeight: 20 }}>
                {r.body}
              </Text>
            </View>
          ))
        )}
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
          {t("product.writeReview")}
        </Text>
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.foreground, fontWeight: "500" }}>{t("product.reviewName")}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t("product.reviewName")}
            placeholderTextColor="#9CA3AF"
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.background,
              color: colors.foreground,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ color: colors.foreground, opacity: 0.7, fontSize: 13 }}>
            {t("product.yourRating")}
          </Text>
          {[1, 2, 3, 4, 5].map((i) => (
            <Pressable key={i} accessibilityRole="button" onPress={() => setRating(i)}>
              <Star
                size={26}
                color={i <= rating ? colors.accent : colors.border}
                fill={i <= rating ? colors.accent : "transparent"}
              />
            </Pressable>
          ))}
          <Text style={{ color: colors.foreground, fontWeight: "600" }}>{rating}/5</Text>
        </View>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t("product.reviewTitle")}
          placeholderTextColor="#9CA3AF"
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.background,
            color: colors.foreground,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        />
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder={t("product.reviewBody")}
          placeholderTextColor="#9CA3AF"
          multiline
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.background,
            color: colors.foreground,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            minHeight: 96,
            textAlignVertical: "top",
          }}
        />
        <Button
          label={t("product.submitReview")}
          onPress={handleSubmitReview}
          loading={createReview.isPending}
          disabled={!canSubmitReview}
        />
      </View>
    </Screen>
  );
}