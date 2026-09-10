import { beforeAll, describe, expect, it, vi } from "vitest";
import type { Client } from "@libsql/client";
import { createTestApp, setupWebTables } from "./helpers";
import { ensureApiTables } from "../src/schema";

let db: Client;
let app: ReturnType<typeof createTestApp>["app"];
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
  await setupWebTables(db);
  await ensureApiTables(db);
  await db.execute({
    sql: "INSERT INTO push_tokens (id, token, platform) VALUES (?, ?, ?)",
    args: ["t1", "ExponentPushToken[x]", "ios"],
  });
  await db.execute({
    sql: "INSERT INTO orders (id, first_name, last_name, phone, address, items, total, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))",
    args: ["recent", "A", "B", "0600", "addr", "[]", 10],
  });
  await db.execute({
    sql: "INSERT INTO orders (id, first_name, last_name, phone, address, items, total, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-2 days'))",
    args: ["old", "C", "D", "0601", "addr", "[]", 10],
  });
});

describe("GET /cron/new-orders", () => {
  it("401s with a bad secret", async () => {
    const res = await app.request("/cron/new-orders?secret=nope");
    expect(res.status).toBe(401);
  });
  it("pushes only recent unnotified orders, once", async () => {
    fetchMock.mockClear();
    const first = await app.request("/cron/new-orders?secret=test-cron");
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ notified: 1 });
    const second = await app.request("/cron/new-orders?secret=test-cron");
    expect(await second.json()).toEqual({ notified: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
