import { beforeAll, describe, expect, it } from "vitest";
import type { Client } from "@libsql/client";
import { createTestApp, loginAdmin, seedAdmin } from "./helpers";

let db: Client;
let app: ReturnType<typeof createTestApp>["app"];
let token: string;

beforeAll(async () => {
  ({ db, app } = createTestApp());
  await seedAdmin(db);
  token = await loginAdmin(app);
});

const auth = () => ({ Authorization: `Bearer ${token}` });
const product = {
  name: "Dog Bed Deluxe",
  description: "Soft bed",
  price: 49.99,
  image_url: "https://example.com/bed.jpg",
  category: "dogs",
  badge: "New",
  tag: "bed",
};

describe("admin products", () => {
  it("creates a product with the web slug rule", async () => {
    const res = await app.request("/admin/products", {
      method: "POST",
      headers: { ...auth(), "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    expect(res.status).toBe(201);
    const { id } = (await res.json()) as { id: string };
    const row = await db.execute({ sql: "SELECT slug FROM products WHERE id = ?", args: [id] });
    expect(String(row.rows[0].slug)).toMatch(/^dog-bed-deluxe-[a-z0-9]{4}$/);
  });
  it("lists products", async () => {
    const body = await (await app.request("/admin/products", { headers: auth() })).json();
    expect(body).toHaveLength(1);
  });
  it("updates a product", async () => {
    const list = (await (await app.request("/admin/products", { headers: auth() })).json()) as {
      id: string;
    }[];
    const res = await app.request(`/admin/products/${list[0].id}`, {
      method: "PATCH",
      headers: { ...auth(), "Content-Type": "application/json" },
      body: JSON.stringify({ ...product, name: "Dog Bed XL", price: 59.99 }),
    });
    expect(res.status).toBe(200);
    const row = await db.execute({
      sql: "SELECT name, price FROM products WHERE id = ?",
      args: [list[0].id],
    });
    expect(row.rows[0].name).toBe("Dog Bed XL");
    expect(Number(row.rows[0].price)).toBe(59.99);
  });
  it("validates input", async () => {
    const res = await app.request("/admin/products", {
      method: "POST",
      headers: { ...auth(), "Content-Type": "application/json" },
      body: JSON.stringify({ ...product, price: -5 }),
    });
    expect(res.status).toBe(400);
  });
  it("deletes a product", async () => {
    const list = (await (await app.request("/admin/products", { headers: auth() })).json()) as {
      id: string;
    }[];
    const res = await app.request(`/admin/products/${list[0].id}`, {
      method: "DELETE",
      headers: auth(),
    });
    expect(res.status).toBe(204);
  });
});
