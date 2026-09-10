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
    await new Promise((r) => setTimeout(r, 50));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
