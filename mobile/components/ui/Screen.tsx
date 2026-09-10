import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../theme/theme";

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {scroll ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>{children}</ScrollView>
      ) : (
        <View style={{ flex: 1, padding: 16, gap: 16 }}>{children}</View>
      )}
    </SafeAreaView>
  );
}