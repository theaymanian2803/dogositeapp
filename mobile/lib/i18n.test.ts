import { interpolate, makeT } from "./i18n";

describe("makeT", () => {
  it("translates and falls back to the key", () => {
    const t = makeT({ "nav.home": "Home" });
    expect(t("nav.home")).toBe("Home");
    expect(t("missing.key")).toBe("missing.key");
  });
  it("interpolates variables", () => {
    const t = makeT({ "trust.free": "Free over {threshold} MAD" });
    expect(t("trust.free", { threshold: "500" })).toBe("Free over 500 MAD");
  });
});

describe("interpolate", () => {
  it("leaves unknown placeholders intact", () => {
    expect(interpolate("Hi {name}", {})).toBe("Hi {name}");
  });
});