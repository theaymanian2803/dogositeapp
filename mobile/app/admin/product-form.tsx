import { useEffect, useRef, useState } from "react";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { Loading } from "../../components/ui/Loading";
import { Screen } from "../../components/ui/Screen";
import { useI18n } from "../../lib/i18n";
import { pickAndPrepareImage } from "../../lib/imageUpload";
import { useAdminCategories, useAdminProducts, useCreateProduct, useUpdateProduct } from "../../lib/queries";
import { useTheme } from "../../theme/theme";

export default function AdminProductFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ?? undefined;
  const { t } = useI18n();
  const { colors } = useTheme();

  const { data: products } = useAdminProducts();
  const { data: categoriesData } = useAdminCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const editingProduct = editingId ? products?.find((p) => p.id === editingId) : undefined;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [badge, setBadge] = useState("");
  const [tag, setTag] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const saveRef = useRef(false);

  useEffect(() => {
    if (!editingProduct) return;
    setName(editingProduct.name);
    setDescription(editingProduct.description);
    setPrice(String(editingProduct.price));
    setCategory(editingProduct.category);
    setBadge(editingProduct.badge ?? "");
    setTag(editingProduct.tag ?? "");
    if (editingProduct.image_url.startsWith("data:")) {
      setImageUrl("");
      setPickedImage(editingProduct.image_url);
    } else {
      setImageUrl(editingProduct.image_url);
      setPickedImage(null);
    }
  }, [editingProduct]);

  if (editingId && !products) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  if (editingId && !editingProduct) {
    return (
      <Screen>
        <EmptyState message={t("product.notFound")} />
      </Screen>
    );
  }

  const categories = categoriesData ?? [];
  const previewImage = pickedImage ?? imageUrl.trim();

  async function handlePickImage() {
    setBanner(null);
    setPicking(true);
    try {
      const dataUrl = await pickAndPrepareImage();
      if (dataUrl) {
        setPickedImage(dataUrl);
        setImageUrl("");
      }
    } catch {
      setBanner(t("admin.products.pickError"));
    } finally {
      setPicking(false);
    }
  }

  async function handleSave() {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = t("admin.products.nameRequired");
    if (!description.trim()) nextErrors.description = t("admin.products.descriptionRequired");
    const priceNumber = Number(price);
    if (!price.trim() || !Number.isFinite(priceNumber) || priceNumber <= 0) {
      nextErrors.price = t("admin.products.pricePositive");
    }
    if (!category) nextErrors.category = t("admin.products.categoryRequired");
    if (!previewImage) nextErrors.image = t("admin.products.imageRequired");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setBanner(null);
    if (saveRef.current) return;
    saveRef.current = true;
    const input: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim(),
      price: priceNumber,
      image_url: previewImage,
      category,
      badge: badge.trim() || null,
      tag: tag.trim() || null,
    };
    try {
      if (editingId) await updateProduct.mutateAsync({ id: editingId, input });
      else await createProduct.mutateAsync(input);
      router.back();
    } catch (err) {
      saveRef.current = false;
      setBanner(err instanceof Error ? err.message : t("admin.products.saveError"));
    }
  }

  const saving = createProduct.isPending || updateProduct.isPending;

  return (
    <Screen>
      <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "700" }}>
        {editingId ? t("admin.products.editTitle") : t("admin.products.newTitle")}
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

      <Input
        label={t("admin.products.name")}
        value={name}
        onChangeText={setName}
        error={errors.name}
      />

      <Input
        label={t("admin.products.description")}
        value={description}
        onChangeText={setDescription}
        multiline
        error={errors.description}
      />

      <Input
        label={t("admin.products.price")}
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        error={errors.price}
      />

      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.foreground, fontWeight: "500" }}>{t("admin.products.category")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {categories.map((cat) => {
            const active = category === cat.slug;
            return (
              <Pressable
                key={cat.id}
                accessibilityRole="button"
                onPress={() => setCategory(cat.slug)}
                style={{
                  backgroundColor: active ? colors.accent : colors.secondary,
                  borderRadius: 9999,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: active ? "#FFFFFF" : colors.foreground, fontWeight: "600" }}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {errors.category ? <Text style={{ color: "#DC2626", fontSize: 12 }}>{errors.category}</Text> : null}
      </View>

      <Input
        label={t("admin.products.badge")}
        value={badge}
        onChangeText={setBadge}
      />

      <Input
        label={t("admin.products.tag")}
        value={tag}
        onChangeText={setTag}
      />

      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.foreground, fontWeight: "500" }}>{t("admin.products.image")}</Text>
        {previewImage ? (
          <Image
            source={{ uri: previewImage }}
            style={{ height: 160, borderRadius: 12, backgroundColor: colors.secondary }}
            contentFit="cover"
          />
        ) : null}
        <Button
          variant="outline"
          label={t("admin.products.pickImage")}
          onPress={handlePickImage}
          loading={picking}
        />
        <Input
          label={t("admin.products.useUrl")}
          value={imageUrl}
          onChangeText={(v) => {
            setImageUrl(v);
            if (v.trim()) setPickedImage(null);
          }}
          placeholder={t("admin.products.imageUrl")}
          error={errors.image}
        />
      </View>

      <Button
        label={saving ? t("admin.products.saving") : t("admin.products.save")}
        onPress={handleSave}
        loading={saving}
      />
    </Screen>
  );
}
