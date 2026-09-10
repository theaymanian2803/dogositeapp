import { describe, expect, it } from "vitest";
import {
  orderCreateSchema,
  productUpsertSchema,
  reviewCreateSchema,
} from "./schemas";

describe("orderCreateSchema", () => {
  const valid = {
    first_name: "A",
    last_name: "B",
    phone: "0600000000",
    address: "1 rue X",
    items: [{ id: "p1", name: "Food", qty: 2, price: 10, image_url: "u" }],
    total: 20,
  };
  it("accepts a valid order", () => {
    expect(orderCreateSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects empty items and bad qty", () => {
    expect(orderCreateSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
    expect(
      orderCreateSchema.safeParse({
        ...valid,
        items: [{ ...valid.items[0], qty: 0 }],
      }).success,
    ).toBe(false);
  });
  it("rejects missing name/phone", () => {
    expect(orderCreateSchema.safeParse({ ...valid, phone: "" }).success).toBe(false);
    expect(orderCreateSchema.safeParse({ ...valid, first_name: "" }).success).toBe(false);
  });
});

describe("reviewCreateSchema", () => {
  it("accepts 1..5 ratings only", () => {
    const base = { product_id: "p1", user_name: "A", body: "Great" };
    expect(reviewCreateSchema.safeParse({ ...base, rating: 5 }).success).toBe(true);
    expect(reviewCreateSchema.safeParse({ ...base, rating: 0 }).success).toBe(false);
    expect(reviewCreateSchema.safeParse({ ...base, rating: 6 }).success).toBe(false);
  });
});

describe("productUpsertSchema", () => {
  it("requires name, description, price, image_url, category", () => {
    const valid = {
      name: "Bed",
      description: "Soft",
      price: 10,
      image_url: "u",
      category: "dogs",
    };
    expect(productUpsertSchema.safeParse(valid).success).toBe(true);
    expect(productUpsertSchema.safeParse({ ...valid, price: -1 }).success).toBe(false);
    expect(productUpsertSchema.safeParse({ ...valid, category: "" }).success).toBe(false);
  });
});