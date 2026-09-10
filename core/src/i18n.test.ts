import { describe, expect, it } from "vitest";
import { en } from "./i18n/en";
import { fr } from "./i18n/fr";
import { ar } from "./i18n/ar";
import { getDict, LANGS } from "./i18n";

const keys = (d: Record<string, string>) => Object.keys(d).sort();
const placeholders = (s: string) => (s.match(/\{[a-z_]+\}/g) ?? []).sort();

describe("i18n dictionaries", () => {
  it("fr and ar have exactly the same keys as en", () => {
    expect(keys(fr)).toEqual(keys(en));
    expect(keys(ar)).toEqual(keys(en));
  });
  it("placeholders match across languages", () => {
    for (const k of Object.keys(en)) {
      expect(placeholders(fr[k])).toEqual(placeholders(en[k]));
      expect(placeholders(ar[k])).toEqual(placeholders(en[k]));
    }
  });
  it("has no empty values", () => {
    for (const d of [en, fr, ar]) {
      for (const [k, v] of Object.entries(d)) expect(v, k).not.toBe("");
    }
  });
  it("exposes three languages and a dict getter", () => {
    expect(LANGS.map((l) => l.code)).toEqual(["fr", "en", "ar"]);
    expect(getDict("ar")).toBe(ar);
  });
});
