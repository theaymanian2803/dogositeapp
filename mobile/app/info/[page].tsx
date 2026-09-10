import { router, useLocalSearchParams } from "expo-router";
import { Linking, Text, View } from "react-native";
import { defaultSettings } from "@petpals/core";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Screen } from "../../components/ui/Screen";
import { useI18n } from "../../lib/i18n";
import { infoPages, type InfoItem, type InfoPage, type InfoSection } from "../../lib/infoPages";
import { useSettings } from "../../lib/queries";
import { useTheme } from "../../theme/theme";

function SectionCard({
  section,
  items,
  contact,
}: {
  section: InfoSection;
  items?: InfoItem[];
  contact?: { email: string };
}) {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        gap: 12,
      }}
    >
      <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700" }}>
        {section.heading}
      </Text>
      {section.body.map((p) => (
        <Text
          key={p}
          style={{ color: colors.foreground, opacity: 0.8, fontSize: 14, lineHeight: 21 }}
        >
          {p}
        </Text>
      ))}
      {section.list ? (
        <View style={{ gap: 6 }}>
          {section.list.map((item) => (
            <View key={item} style={{ flexDirection: "row", gap: 8 }}>
              <Text style={{ color: colors.accent, fontSize: 14, lineHeight: 21 }}>•</Text>
              <Text style={{ color: colors.foreground, opacity: 0.8, fontSize: 14, lineHeight: 21, flex: 1 }}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {items ? (
        <View style={{ gap: 8 }}>
          {items.map((item) => (
            <View
              key={item.label}
              style={{ backgroundColor: colors.secondary, borderRadius: 12, padding: 12, gap: 2 }}
            >
              <Text
                style={{
                  color: colors.foreground,
                  opacity: 0.6,
                  fontSize: 11,
                  fontWeight: "600",
                  textTransform: "uppercase",
                }}
              >
                {item.label}
              </Text>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {contact ? (
        <Button
          label={t("info.emailUs")}
          variant="outline"
          onPress={() => {
            Linking.openURL(`mailto:${contact.email}`).catch(() => {});
          }}
        />
      ) : null}
    </View>
  );
}

export default function InfoScreen() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const { data: settings } = useSettings();
  const { t } = useI18n();
  const { colors } = useTheme();
  const info: InfoPage | undefined = infoPages.find((p) => p.slug === page);

  if (!info) {
    return (
      <Screen>
        <EmptyState message={t("info.notFound")} />
        <Button label={t("checkout.back")} variant="outline" onPress={() => router.back()} />
      </Screen>
    );
  }

  const merged = { ...defaultSettings, ...(settings ?? {}) };
  const contactItems: InfoItem[] | undefined =
    info.slug === "contact"
      ? [
          { label: t("info.email"), value: merged.contact_email },
          { label: t("info.phone"), value: merged.contact_phone },
          { label: t("info.visit"), value: merged.contact_address },
          { label: t("info.hours"), value: merged.support_hours },
        ]
      : undefined;

  return (
    <Screen>
      <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>
        {info.eyebrow}
      </Text>
      <Text style={{ color: colors.foreground, fontSize: 26, fontWeight: "800" }}>{info.title}</Text>
      <Text style={{ color: colors.foreground, opacity: 0.7, fontSize: 14, lineHeight: 21 }}>
        {info.subtitle}
      </Text>
      {info.sections.map((s) => (
        <SectionCard
          key={s.heading}
          section={s}
          items={contactItems ?? s.items}
          contact={info.slug === "contact" ? { email: merged.contact_email } : undefined}
        />
      ))}
    </Screen>
  );
}
