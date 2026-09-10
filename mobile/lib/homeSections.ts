export const HOME_SECTION_IDS = [
  "hero",
  "categories",
  "products",
  "promo",
  "best",
  "reviews",
] as const;

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];

const KNOWN = new Set<string>(HOME_SECTION_IDS);

export function parseHomepageSections(json: string): HomeSectionId[] {
  try {
    const parsed = JSON.parse(json) as { id: string; visible?: boolean }[];
    const visible = parsed
      .filter((s) => s.visible !== false && KNOWN.has(s.id))
      .map((s) => s.id as HomeSectionId);
    return visible.length > 0 ? visible : [...HOME_SECTION_IDS];
  } catch {
    return [...HOME_SECTION_IDS];
  }
}