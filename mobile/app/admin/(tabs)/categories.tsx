import { Text } from "react-native";
import { Screen } from "../../../components/ui/Screen";
import { useI18n } from "../../../lib/i18n";
import { useTheme } from "../../../theme/theme";

export default function AdminCategoriesScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <Screen>
      <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "700" }}>
        {t("admin.categories")}
      </Text>
    </Screen>
  );
}