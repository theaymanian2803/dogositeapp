import { Text, TextInput, View } from "react-native";
import { useTheme } from "../../theme/theme";

type Props = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "phone-pad" | "numeric" | "email-address";
};

export function Input({ label, value, onChangeText, placeholder, error, multiline, secureTextEntry, keyboardType }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: colors.foreground, fontWeight: "500" }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={{
          borderWidth: 1,
          borderColor: error ? "#DC2626" : colors.border,
          backgroundColor: colors.card,
          color: colors.foreground,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          minHeight: multiline ? 96 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
      {error ? <Text style={{ color: "#DC2626", fontSize: 12 }}>{error}</Text> : null}
    </View>
  );
}