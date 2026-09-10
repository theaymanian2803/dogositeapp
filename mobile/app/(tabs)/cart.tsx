import { Text } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { useI18n } from "../../lib/i18n";

export default function CartScreen() {
  const { t } = useI18n();
  return (
    <Screen>
      <Text>{t("nav.cart")}</Text>
    </Screen>
  );
}