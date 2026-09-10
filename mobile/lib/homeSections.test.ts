import { parseHomepageSections } from "./homeSections";

describe("parseHomepageSections", () => {
  it("keeps known visible sections in order", () => {
    const json = JSON.stringify([
      { id: "hero", visible: true },
      { id: "categories", visible: false },
      { id: "products", visible: true },
      { id: "unknown", visible: true },
    ]);
    expect(parseHomepageSections(json)).toEqual(["hero", "products"]);
  });
  it("falls back to the full default order on bad JSON", () => {
    expect(parseHomepageSections("not json")).toEqual([
      "hero",
      "categories",
      "products",
      "promo",
      "best",
      "reviews",
    ]);
  });
});