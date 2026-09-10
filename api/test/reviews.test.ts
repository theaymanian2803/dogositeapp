import { beforeAll, describe, expect, it } from "vitest";
import { reviewCreateSchema } from "@petpals/core";
import { createTestApp, setupWebTables } from "./helpers";

let app: ReturnType<typeof createTestApp>["app"];

beforeAll(async () => {
  const t = createTestApp();
  app = t.app;
  await setupWebTables(t.db);
});

const validReview = {
  product_id: "p1",
  user_name: "Ana",
  rating: 5,
  title: "Loved it",
  body: "Great product",
};

describe("POST /reviews", () => {
  it("creates a pending review", async () => {
    const res = await app.request("/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validReview),
    });
    expect(res.status).toBe(201);
    const { id } = (await res.json()) as { id: string };
    expect(id).toBeTruthy();
  });
  it("rejects an invalid rating", async () => {
    const res = await app.request("/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validReview, rating: 9 }),
    });
    expect(res.status).toBe(400);
    expect(reviewCreateSchema.safeParse({ ...validReview, rating: 9 }).success).toBe(false);
  });
});

describe("GET /reviews", () => {
  it("returns only approved reviews", async () => {
    const res = await app.request("/reviews");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
  it("filters by product_id and limit", async () => {
    const res = await app.request("/reviews?product_id=p1&limit=5");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
  it("rejects an invalid limit", async () => {
    const res = await app.request("/reviews?limit=abc");
    expect(res.status).toBe(400);
  });
});