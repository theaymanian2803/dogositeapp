import { Text } from "react-native";
import { formatPrice } from "@petpals/core";
import { useTheme } from "../../theme/theme";

export function PriceText({ value, size = 16 }: { value: number | string; size?: number }) {
  const { colors } = useTheme();
  return (
    <Text style={{ color: colors.accent, fontWeight: "700", fontSize: size }}>
      {formatPrice(value)}
    </Text>
  );
}