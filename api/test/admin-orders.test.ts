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
  await db.execute({
    sql: "INSERT INTO orders (id, first_name, last_name, phone, address, items, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    args: ["o1", "Ana", "L", "0600", "addr", "[]", 20, "new"],
  });
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe("admin orders", () => {
  it("401s without a token", async () => {
    const res = await app.request("/admin/orders");
    expect(res.status).toBe(401);
  });
  it("lists orders and filters by status", async () => {
    const all = await (await app.request("/admin/orders", { headers: auth() })).json();
    expect(all).toHaveLength(1);
    const filtered = await (
      await app.request("/admin/orders?status=delivered", { headers: auth() })
    ).json();
    expect(filtered).toHaveLength(0);
  });
  it("updates status", async () => {
    const res = await app.request("/admin/orders/o1", {
      method: "PATCH",
      headers: { ...auth(), "Content-Type": "application/json" },
      body: JSON.stringify({ status: "shipped" }),
    });
    expect(res.status).toBe(200);
    const row = await db.execute("SELECT status FROM orders WHERE id = 'o1'");
    expect(row.rows[0].status).toBe("shipped");
  });
  it("rejects an invalid status", async () => {
    const res = await app.request("/admin/orders/o1", {
      method: "PATCH",
      headers: { ...auth(), "Content-Type": "application/json" },
      body: JSON.stringify({ status: "lost" }),
    });
    expect(res.status).toBe(400);
  });
  it("404s on unknown order", async () => {
    const res = await app.request("/admin/orders/nope", {
      method: "DELETE",
      headers: auth(),
    });
    expect(res.status).toBe(404);
  });
  it("deletes an order", async () => {
    const res = await app.request("/admin/orders/o1", {
      method: "DELETE",
      headers: auth(),
    });
    expect(res.status).toBe(204);
  });
});
