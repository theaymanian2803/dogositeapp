import { router, Tabs } from "expo-router";
import { Boxes, LayoutGrid, Package, Star } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, Text } from "react-native";
import { useAdminSession } from "../../../lib/adminSession";
import { useI18n } from "../../../lib/i18n";
import { registerForPushNotifications } from "../../../lib/push";
import { useTheme } from "../../../theme/theme";

export default function AdminTabsLayout() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { signOut } = useAdminSession();

  useEffect(() => {
    registerForPushNotifications().catch(() => {});
  }, []);

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: "#9CA3AF",
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            onPress={handleSignOut}
            style={{ paddingHorizontal: 16, paddingVertical: 8 }}
          >
            <Text style={{ color: colors.accent, fontSize: 14, fontWeight: "600" }}>
              {t("nav.signout")}
            </Text>
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="orders"
        options={{
          title: t("admin.orders"),
          tabBarIcon: ({ color, size }) => <Boxes color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: t("admin.products"),
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: t("admin.categories"),
          tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          title: t("admin.reviews"),
          tabBarIcon: ({ color, size }) => <Star color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}