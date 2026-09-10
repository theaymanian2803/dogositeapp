import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Screen } from "../../components/ui/Screen";
import { useAdminSession } from "../../lib/adminSession";
import { useI18n } from "../../lib/i18n";
import { useTheme } from "../../theme/theme";

export default function AdminLoginScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { signIn } = useAdminSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch {
      setError(t("admin.loginError"));
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "700" }}>
        {t("nav.admin")}
      </Text>
      <Input
        label={t("login.email")}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <Input label={t("login.password")} value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <Text style={{ color: "#DC2626", fontSize: 13 }}>{error}</Text> : null}
      <Button
        label={t("login.submit")}
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
      />
      <View style={{ alignItems: "center", marginTop: 8 }}>
        <Pressable accessibilityRole="link" onPress={() => router.replace("/")}>
          <Text style={{ color: colors.accent, fontSize: 14 }}>{t("admin.customerMode")}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}