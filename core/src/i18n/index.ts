import type { Lang } from "../types";
import { en } from "./en";
import { fr } from "./fr";
import { ar } from "./ar";

export type Dict = Record<string, string>;

export const LANGS: { code: Lang; label: string }[] = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
];

const DICTS: Record<Lang, Dict> = { en, fr, ar };

export function getDict(lang: Lang): Dict {
  return DICTS[lang] ?? en;
}

export { en, fr, ar };