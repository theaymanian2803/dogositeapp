import { Modal, Pressable, Text, View } from "react-native";
import { useTheme } from "../../theme/theme";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: Props) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20, gap: 12, width: "100%" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>{title}</Text>
          <Text style={{ color: colors.foreground }}>{message}</Text>
          <Pressable onPress={onConfirm} style={{ backgroundColor: "#DC2626", borderRadius: 9999, padding: 14, alignItems: "center" }}>
            <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>{confirmLabel}</Text>
          </Pressable>
          <Pressable onPress={onCancel} style={{ borderColor: colors.border, borderWidth: 1, borderRadius: 9999, padding: 14, alignItems: "center" }}>
            <Text style={{ color: colors.foreground, fontWeight: "600" }}>{cancelLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}