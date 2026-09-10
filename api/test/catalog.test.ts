import { beforeAll, describe, expect, it } from "vitest";
import type { Client } from "@libsql/client";
import { createTestApp, setupWebTables } from "./helpers";

let db: Client;
let app: ReturnType<typeof createTestApp>["app"];

beforeAll(async () => {
  ({ db, app } = createTestApp());
  await setupWebTables(db);
  await db.execute({
    sql: "INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)",
    args: ["c1", "Dogs", "dogs"],
  });
  await db.execute({
    sql: "INSERT INTO products (id, name, slug, description, price, image_url, category, badge, tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: ["p1", "Premium Dog Food", "premium-dog-food-abc1", "Tasty", 25, "img1", "dogs", "New", "food"],
  });
  await db.execute({
    sql: "INSERT INTO products (id, name, slug, description, price, image_url, category, badge, tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: ["p2", "Cat Bed", "cat-bed-abc2", "Soft", 40, "img2", "cats", null, "bed"],
  });
  await db.execute({
    sql: "INSERT INTO settings (key, value) VALUES (?, ?)",
    args: ["brand_name", "TestPals"],
  });
  await db.execute({
    sql: "INSERT INTO sections (id, type, name) VALUES (?, ?, ?)",
    args: ["s1", "hero", "Hero"],
  });
  await db.execute({
    sql: "INSERT INTO reviews (id, product_id, user_name, rating, body, status) VALUES (?, ?, ?, ?, ?, ?)",
    args: ["r1", "p1", "Ana", 5, "Great", "approved"],
  });
  await db.execute({
    sql: "INSERT INTO reviews (id, product_id, user_name, rating, body, status) VALUES (?, ?, ?, ?, ?, ?)",
    args: ["r2", "p1", "Bob", 1, "Pending", "pending"],
  });
});

describe("GET /products", () => {
  it("lists all products newest first", async () => {
    const res = await app.request("/products");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
  });
  it("filters by category", async () => {
    const res = await app.request("/products?category=dogs");
    const body = await res.json();
    expect(body.map((p: { id: string }) => p.id)).toEqual(["p1"]);
  });
  it("searches by name, category or tag", async () => {
    const res = await app.request("/products?q=bed");
    const body = await res.json();
    expect(body.map((p: { id: string }) => p.id)).toEqual(["p2"]);
  });
  it("filters by ids and applies limit", async () => {
    const res = await app.request("/products?ids=p1,p2&limit=1");
    const body = await res.json();
    expect(body).toHaveLength(1);
  });
});

describe("GET /products/:slug", () => {
  it("returns product, related and approved reviews", async () => {
    const res = await app.request("/products/premium-dog-food-abc1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.product.id).toBe("p1");
    expect(body.related).toEqual([]);
    expect(body.reviews.map((r: { id: string }) => r.id)).toEqual(["r1"]);
  });
  it("404s for unknown slug", async () => {
    const res = await app.request("/products/nope");
    expect(res.status).toBe(404);
  });
});

describe("GET /categories, /settings, /sections", () => {
  it("returns categories", async () => {
    const body = await (await app.request("/categories")).json();
    expect(body).toEqual([{ id: "c1", name: "Dogs", slug: "dogs" }]);
  });
  it("returns settings as a key/value object", async () => {
    const body = (await (await app.request("/settings")).json()) as Record<string, string>;
    expect(body.brand_name).toBe("TestPals");
  });
  it("returns sections", async () => {
    const body = await (await app.request("/sections")).json();
    expect(body).toHaveLength(1);
  });
});
