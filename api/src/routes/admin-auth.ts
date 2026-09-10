import type { Hono } from "hono";
import type { Client } from "@libsql/client";
import { adminLoginSchema } from "@petpals/core";
import { requireAdmin, signAdminToken } from "../auth";
import type { AppConfig } from "../app";

export function registerAdminAuthRoutes(
  app: Hono,
  db: Client,
  config: AppConfig,
): void {
  app.post("/auth/admin/login", async (c) => {
    const parsed = adminLoginSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "Invalid credentials" }, 400);
    const { email, password } = parsed.data;
    const rs = await db.execute({
      sql: "SELECT email FROM admins WHERE email = ? AND password = ?",
      args: [email, password],
    });
    if (rs.rows.length === 0) return c.json({ error: "Invalid credentials" }, 401);
    const token = await signAdminToken(email, config.jwtSecret);
    return c.json({ token, email });
  });

  app.get("/auth/admin/me", requireAdmin(config.jwtSecret), (c) => {
    return c.json({ email: c.get("adminEmail") });
  });
}