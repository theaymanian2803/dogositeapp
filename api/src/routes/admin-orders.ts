import type { Hono } from "hono";
import type { Client } from "@libsql/client";
import { orderStatusUpdateSchema } from "@petpals/core";
import { requireAdmin } from "../auth";
import type { AppConfig } from "../app";

export function registerAdminOrderRoutes(
  app: Hono,
  db: Client,
  config: AppConfig,
): void {
  const guard = requireAdmin(config.jwtSecret);

  app.get("/admin/orders", guard, async (c) => {
    const status = c.req.query("status");
    const rs = status
      ? await db.execute({
          sql: "SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC",
          args: [status],
        })
      : await db.execute("SELECT * FROM orders ORDER BY created_at DESC");
    return c.json(rs.rows);
  });

  app.patch("/admin/orders/:id", guard, async (c) => {
    const parsed = orderStatusUpdateSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "Invalid status" }, 400);
    const result = await db.execute({
      sql: "UPDATE orders SET status = ? WHERE id = ?",
      args: [parsed.data.status, c.req.param("id")!],
    });
    if (result.rowsAffected === 0) return c.json({ error: "Order not found" }, 404);
    return c.json({ ok: true });
  });

  app.delete("/admin/orders/:id", guard, async (c) => {
    const result = await db.execute({
      sql: "DELETE FROM orders WHERE id = ?",
      args: [c.req.param("id")!],
    });
    if (result.rowsAffected === 0) return c.json({ error: "Order not found" }, 404);
    return c.body(null, 204);
  });
}
