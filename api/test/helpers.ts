import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient, type Client } from "@libsql/client";
import type { Hono } from "hono";
import { ensureWebTables } from "@petpals/core";
import { createApp, type AppConfig } from "../src/app";

const TEST_CONFIG: AppConfig = {
  jwtSecret: "test-secret",
  cronSecret: "test-cron",
};

export function createTestApp(config: AppConfig = TEST_CONFIG): {
  db: Client;
  app: Hono;
} {
  const dir = mkdtempSync(join(tmpdir(), "petpals-api-"));
  const db = createClient({ url: `file:${join(dir, "test.db")}` });
  const app = createApp(db, config);
  return { db, app };
}

export async function setupWebTables(db: Client): Promise<void> {
  await ensureWebTables(db);
}

export async function seedAdmin(
  db: Client,
  email = "admin@test.com",
  password = "secret",
): Promise<void> {
  await setupWebTables(db);
  await db.execute({
    sql: "INSERT INTO admins (id, email, password) VALUES (?, ?, ?)",
    args: ["admin-1", email, password],
  });
}

export async function loginAdmin(app: Hono): Promise<string> {
  const res = await app.request("/auth/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@test.com", password: "secret" }),
  });
  const body = (await res.json()) as { token: string };
  return body.token;
}
