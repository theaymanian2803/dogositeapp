import { beforeAll, describe, expect, it, vi } from "vitest";
import type { Client } from "@libsql/client";
import { createTestApp, loginAdmin, seedAdmin } from "./helpers";
import { notifyOrder } from "../src/push";

let db: Client;
let app: ReturnType<typeof createTestApp>["app"];
let token: string;
let fetchMock: ReturnType<typeof vi.fn>;

beforeAll(async () => {
  fetchMock = vi.fn(async () =>
    new Response(JSON.stringify({ data: [{ status: "ok" }] }), { status: 200 }),
  );
  ({ db, app } = createTestApp({
    jwtSecret: "test-secret",
    cronSecret: "test-cron",
    fetchImpl: fetchMock as unknown as typeof fetch,
  }));
  await seedAdmin(db);
  token = await loginAdmin(app);
  await db.execute({
    sql: "INSERT INTO push_tokens (id, token, platform) VALUES (?, ?, ?)",
    args: ["t1", "ExponentPushToken[abc]", "ios"],
  });
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe("POST /admin/push/register", () => {
  it("upserts a token", async () => {
    const first = await app.request("/admin/push/register", {
      method: "POST",
      headers: { ...auth(), "Content-Type": "application/json" },
      body: JSON.stringify({ token: "ExponentPushToken[abc]", platform: "ios" }),
    });
    expect(first.status).toBe(201);
    const second = await app.request("/admin/push/register", {
      method: "POST",
      headers: { ...auth(), "Content-Type": "application/json" },
      body: JSON.stringify({ token: "ExponentPushToken[abc]", platform: "android" }),
    });
    expect(second.status).toBe(201);
    const rs = await db.execute("SELECT platform FROM push_tokens");
    expect(rs.rows).toHaveLength(1);
    expect(rs.rows[0].platform).toBe("android");
  });
});

describe("notifyOrder", () => {
  it("pushes once and dedupes", async () => {
    fetchMock.mockClear();
    const first = await notifyOrder(db, "o1", fetchMock as unknown as typeof fetch);
    const second = await notifyOrder(db, "o1", fetchMock as unknown as typeof fetch);
    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("notifyOrder without tokens", () => {
  it("returns false and does not claim the order", async () => {
    const fresh = createTestApp();
    await fresh.app.request("/health");
    const ok = await notifyOrder(
      fresh.db,
      "no-token-order",
      fetchMock as unknown as typeof fetch,
    );
    expect(ok).toBe(false);
    const row = await fresh.db.execute({
      sql: "SELECT order_id FROM notified_orders WHERE order_id = ?",
      args: ["no-token-order"],
    });
    expect(row.rows).toHaveLength(0);
  });
});

describe("notifyOrder on push failure", () => {
  it("rejects and leaves no claim row", async () => {
    const fresh = createTestApp();
    await fresh.app.request("/health");
    await fresh.db.execute({
      sql: "INSERT INTO push_tokens (id, token, platform) VALUES (?, ?, ?)",
      args: ["t2", "ExponentPushToken[def]", "ios"],
    });
    const failing = vi.fn(async () => {
      throw new Error("network down");
    });
    await expect(
      notifyOrder(fresh.db, "fail-order", failing as unknown as typeof fetch),
    ).rejects.toThrow("network down");
    const row = await fresh.db.execute({
      sql: "SELECT order_id FROM notified_orders WHERE order_id = ?",
      args: ["fail-order"],
    });
    expect(row.rows).toHaveLength(0);
  });
});

describe("order creation triggers a push", () => {
  it("calls Expo after an order is placed", async () => {
    fetchMock.mockClear();
    const res = await app.request("/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: "Ana",
        last_name: "L",
        phone: "0600",
        address: "addr",
        items: [{ id: "p1", name: "Food", qty: 1, price: 10, image_url: "img" }],
        total: 10,
      }),
    });
    expect(res.status).toBe(201);
    const { id } = (await res.json()) as { id: string };
    let claimed = false;
    for (let i = 0; i < 10 && !claimed; i++) {
      await new Promise((r) => setTimeout(r, 50));
      const row = await db.execute({
        sql: "SELECT order_id FROM notified_orders WHERE order_id = ?",
        args: [id],
      });
      claimed = row.rows.length > 0;
    }
    expect(claimed).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});