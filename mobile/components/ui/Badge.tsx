import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useTheme } from "../../theme/theme";

export function Badge({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.secondary,
        borderRadius: 9999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "500" }}>{children}</Text>
    </View>
  );
}