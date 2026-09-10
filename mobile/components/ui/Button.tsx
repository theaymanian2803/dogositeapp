import { ActivityIndicator, Pressable, Text } from "react-native";
import { useTheme } from "../../theme/theme";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "ghost";
  loading?: boolean;
  disabled?: boolean;
};

export function Button({ label, onPress, variant = "primary", loading, disabled }: Props) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const backgroundColor =
    variant === "primary" ? colors.accent : variant === "outline" ? "transparent" : "transparent";
  const textColor = variant === "primary" ? "#FFFFFF" : colors.accent;
  const borderColor = variant === "outline" ? colors.accent : "transparent";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        if (!isDisabled) onPress();
      }}
      style={{
        backgroundColor,
        borderColor,
        borderWidth: variant === "outline" ? 1 : 0,
        borderRadius: 9999,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: "center",
        justifyContent: "center",
        opacity: isDisabled ? 0.6 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={{ color: textColor, fontWeight: "600", fontSize: 16 }}>{label}</Text>
      )}
    </Pressable>
  );
}