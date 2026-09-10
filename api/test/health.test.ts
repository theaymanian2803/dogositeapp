import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers";

describe("GET /health", () => {
  it("returns ok", async () => {
    const { app } = createTestApp();
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe("schema bootstrap", () => {
  it("creates the API tables on first request", async () => {
    const { db, app } = createTestApp();
    await app.request("/health");
    const rs = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    const names = rs.rows.map((r) => String(r.name));
    expect(names).toContain("push_tokens");
    expect(names).toContain("notified_orders");
  });
});
