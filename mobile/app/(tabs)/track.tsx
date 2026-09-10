import { Text } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { useI18n } from "../../lib/i18n";

export default function TrackScreen() {
  const { t } = useI18n();
  return (
    <Screen>
      <Text>{t("footer.track")}</Text>
    </Screen>
  );
}