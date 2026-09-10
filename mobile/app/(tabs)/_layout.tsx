import { Tabs } from "expo-router";
import { Home, ShoppingBag, ShoppingCart, Truck } from "lucide-react-native";
import { useI18n } from "../../lib/i18n";
import { useCart } from "../../lib/cart";
import { useTheme } from "../../theme/theme";

export default function TabsLayout() {
  const { t } = useI18n();
  const { count } = useCart();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: "#9CA3AF",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("nav.home"),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: t("nav.shop"),
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t("nav.cart"),
          tabBarBadge: count > 0 ? count : undefined,
          tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: t("footer.track"),
          tabBarIcon: ({ color, size }) => <Truck color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}