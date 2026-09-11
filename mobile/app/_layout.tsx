import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProviders } from "../components/AppProviders";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="product/[slug]" />
          <Stack.Screen name="category/[category]" />
          <Stack.Screen name="checkout" />
          <Stack.Screen name="order-confirmed" />
          <Stack.Screen name="info/[page]" />
          <Stack.Screen name="admin" />
        </Stack>
      </AppProviders>
    </GestureHandlerRootView>
  );
}
