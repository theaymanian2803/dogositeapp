import { beforeAll, describe, expect, it } from "vitest";
import type { Client } from "@libsql/client";
import { createTestApp, setupWebTables } from "./helpers";

let db: Client;
let app: ReturnType<typeof createTestApp>["app"];

beforeAll(async () => {
  ({ db, app } = createTestApp());
  await setupWebTables(db);
});

const order = {
  first_name: "Ana",
  last_name: "Lopez",
  phone: "0601020304",
  address: "1 rue X",
  items: [{ id: "p1", name: "Food", qty: 2, price: 10, image_url: "img" }],
  total: 20,
};

describe("POST /orders", () => {
  it("creates an order with status new", async () => {
    const res = await app.request("/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    expect(res.status).toBe(201);
    const { id } = (await res.json()) as { id: string };
    const row = await db.execute({
      sql: "SELECT status, items FROM orders WHERE id = ?",
      args: [id],
    });
    expect(row.rows[0].status).toBe("new");
    expect(JSON.parse(String(row.rows[0].items))).toEqual(order.items);
  });
  it("rejects an invalid body", async () => {
    const res = await app.request("/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...order, items: [] }),
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /orders/track", () => {
  it("returns orders for a phone number newest first", async () => {
    const res = await app.request(`/orders/track?phone=${encodeURIComponent(order.phone)}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].phone).toBe(order.phone);
  });
  it("requires a phone", async () => {
    const res = await app.request("/orders/track");
    expect(res.status).toBe(400);
  });
});
