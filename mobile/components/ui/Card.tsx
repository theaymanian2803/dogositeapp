import type { ReactNode } from "react";
import { View } from "react-native";
import { useTheme } from "../../theme/theme";

export function Card({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        gap: 8,
      }}
    >
      {children}
    </View>
  );
}