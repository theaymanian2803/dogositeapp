import { ActivityIndicator, View } from "react-native";
import { useTheme } from "../../theme/theme";

export function Loading() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}