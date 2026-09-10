import { Text, View } from "react-native";
import { useTheme } from "../../theme/theme";

export function EmptyState({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.muted,
        borderRadius: 12,
        padding: 24,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <Text style={{ color: colors.foreground, textAlign: "center" }}>{message}</Text>
    </View>
  );
}