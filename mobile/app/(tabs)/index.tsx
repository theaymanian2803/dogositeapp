import { Screen } from "../../components/ui/Screen";
import { Loading } from "../../components/ui/Loading";
import { useSettings } from "../../lib/queries";
import { parseHomepageSections } from "../../lib/homeSections";
import { HeroSection } from "../../components/home/HeroSection";
import { CategoriesSection } from "../../components/home/CategoriesSection";
import { ProductsSection } from "../../components/home/ProductsSection";
import { PromoSection } from "../../components/home/PromoSection";
import { BestSection } from "../../components/home/BestSection";
import { ReviewsSection } from "../../components/home/ReviewsSection";
import { defaultSettings } from "@petpals/core";

const RENDERERS = {
  hero: HeroSection,
  categories: CategoriesSection,
  products: ProductsSection,
  promo: PromoSection,
  best: BestSection,
  reviews: ReviewsSection,
} as const;

export default function HomeScreen() {
  const { data: settings, isLoading } = useSettings();
  if (isLoading) return <Screen><Loading /></Screen>;
  const merged = { ...defaultSettings, ...(settings ?? {}) };
  const sections = parseHomepageSections(merged.homepage_sections);
  return (
    <Screen>
      {sections.map((id) => {
        const Section = RENDERERS[id];
        return <Section key={id} settings={merged} />;
      })}
    </Screen>
  );
}