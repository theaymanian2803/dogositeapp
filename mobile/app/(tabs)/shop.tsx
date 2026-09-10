import { Text } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { useI18n } from "../../lib/i18n";

export default function ShopScreen() {
  const { t } = useI18n();
  return (
    <Screen>
      <Text>{t("nav.shop")}</Text>
    </Screen>
  );
}