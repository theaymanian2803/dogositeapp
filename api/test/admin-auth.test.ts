import { beforeAll, describe, expect, it } from "vitest";
import type { Client } from "@libsql/client";
import { createTestApp, loginAdmin, seedAdmin } from "./helpers";

let db: Client;
let app: ReturnType<typeof createTestApp>["app"];

beforeAll(async () => {
  ({ db, app } = createTestApp());
  await seedAdmin(db);
});

describe("POST /auth/admin/login", () => {
  it("returns a token for valid credentials", async () => {
    const res = await app.request("/auth/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@test.com", password: "secret" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string; email: string };
    expect(body.token).toBeTruthy();
    expect(body.email).toBe("admin@test.com");
  });
  it("rejects a wrong password", async () => {
    const res = await app.request("/auth/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@test.com", password: "nope" }),
    });
    expect(res.status).toBe(401);
  });
});

describe("GET /auth/admin/me", () => {
  it("returns the email with a valid token", async () => {
    const token = await loginAdmin(app);
    const res = await app.request("/auth/admin/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ email: "admin@test.com" });
  });
  it("401s without a token", async () => {
    const res = await app.request("/auth/admin/me");
    expect(res.status).toBe(401);
  });
});
