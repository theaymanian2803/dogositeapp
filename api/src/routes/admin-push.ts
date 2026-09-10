import type { Hono } from "hono";
import type { Client } from "@libsql/client";
import { pushRegisterSchema } from "@petpals/core";
import { requireAdmin } from "../auth";
import type { AppConfig } from "../app";

export function registerAdminPushRoutes(
  app: Hono,
  db: Client,
  config: AppConfig,
): void {
  app.post("/admin/push/register", requireAdmin(config.jwtSecret), async (c) => {
    const parsed = pushRegisterSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "Invalid token" }, 400);
    await db.execute({
      sql: "INSERT INTO push_tokens (id, token, platform) VALUES (?, ?, ?) ON CONFLICT(token) DO UPDATE SET platform = excluded.platform",
      args: [crypto.randomUUID(), parsed.data.token, parsed.data.platform],
    });
    return c.json({ ok: true }, 201);
  });
}