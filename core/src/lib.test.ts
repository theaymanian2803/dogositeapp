import { describe, expect, it } from "vitest";
import { productSlug, slugify } from "./slug";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, shippingFor } from "./shipping";
import { formatPrice } from "./currency";
import { waLinkFrom } from "./whatsapp";

describe("slugify", () => {
  it("lowercases, trims and hyphenates", () => {
    expect(slugify("  Premium Dog Food!  ")).toBe("premium-dog-food");
    expect(slugify("Chien & Chat")).toBe("chien-chat");
    expect(slugify("---")).toBe("");
  });
});

describe("productSlug", () => {
  it("appends a 4-char base36 suffix", () => {
    expect(productSlug("Dog Bed")).toMatch(/^dog-bed-[a-z0-9]{4}$/);
  });
});

describe("shippingFor", () => {
  it("charges the fee below/at the threshold and free above it", () => {
    expect(shippingFor(100)).toBe(SHIPPING_FEE);
    expect(shippingFor(FREE_SHIPPING_THRESHOLD)).toBe(SHIPPING_FEE);
    expect(shippingFor(FREE_SHIPPING_THRESHOLD + 1)).toBe(0);
    expect(shippingFor(0)).toBe(0);
  });
  it("honours overrides", () => {
    expect(shippingFor(150, { threshold: 100, fee: 20 })).toBe(0);
    expect(shippingFor(50, { threshold: 100, fee: 20 })).toBe(20);
  });
});

describe("formatPrice", () => {
  it("formats with two decimals and MAD", () => {
    expect(formatPrice(12.5)).toBe("12.50 MAD");
    expect(formatPrice("7")).toBe("7.00 MAD");
  });
});

describe("waLinkFrom", () => {
  it("builds a wa.me link and normalizes leading zeros", () => {
    expect(waLinkFrom("0612 345 678", "Hi")).toBe(
      "https://wa.me/212612345678?text=Hi",
    );
    expect(waLinkFrom("+1 (555) 010-1010", "Hi")).toBe(
      "https://wa.me/15550101010?text=Hi",
    );
  });
  it("returns null for empty input", () => {
    expect(waLinkFrom("", "Hi")).toBeNull();
    expect(waLinkFrom("abc", "Hi")).toBeNull();
  });
});