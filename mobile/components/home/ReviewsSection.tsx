import { Star } from "lucide-react-native";
import { Text, View } from "react-native";
import type { Settings } from "@petpals/core";
import { useReviews } from "../../lib/queries";
import { useI18n } from "../../lib/i18n";
import { useTheme } from "../../theme/theme";

const STARS = [1, 2, 3, 4, 5];

export function ReviewsSection({ settings }: { settings: Settings }) {
  const { data, isLoading, error } = useReviews(undefined, 6);
  const { t } = useI18n();
  const { colors } = useTheme();
  if (isLoading || error) return null;
  if (!data?.length) return null;
  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 4 }}>
        <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "700" }}>
          {t("reviews.title")}
        </Text>
        <Text style={{ color: colors.foreground, opacity: 0.7, fontSize: 14, lineHeight: 20 }}>
          {t("reviews.subtitle")}
        </Text>
      </View>
      {data.map((review) => (
        <View
          key={review.id}
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 12,
            padding: 16,
            gap: 6,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>{review.user_name}</Text>
            <View style={{ flexDirection: "row", gap: 2 }}>
              {STARS.map((n) => (
                <Star
                  key={n}
                  size={14}
                  color={n <= review.rating ? colors.accent : colors.border}
                  fill={n <= review.rating ? colors.accent : "transparent"}
                />
              ))}
            </View>
          </View>
          {review.title ? (
            <Text style={{ color: colors.foreground, fontWeight: "600" }}>{review.title}</Text>
          ) : null}
          <Text
            numberOfLines={3}
            style={{ color: colors.foreground, opacity: 0.7, fontSize: 14, lineHeight: 20 }}
          >
            {review.body}
          </Text>
        </View>
      ))}
    </View>
  );
}