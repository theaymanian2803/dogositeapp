import type { Hono } from "hono";
import type { Client } from "@libsql/client";
import { reviewStatusUpdateSchema } from "@petpals/core";
import { requireAdmin } from "../auth";
import type { AppConfig } from "../app";

export function registerAdminReviewRoutes(
  app: Hono,
  db: Client,
  config: AppConfig,
): void {
  const guard = requireAdmin(config.jwtSecret);

  app.get("/admin/reviews", guard, async (c) => {
    const rs = await db.execute(
      "SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON r.product_id = p.id ORDER BY r.created_at DESC",
    );
    return c.json(rs.rows);
  });

  app.patch("/admin/reviews/:id", guard, async (c) => {
    const parsed = reviewStatusUpdateSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "Invalid status" }, 400);
    const result = await db.execute({
      sql: "UPDATE reviews SET status = ? WHERE id = ?",
      args: [parsed.data.status, c.req.param("id")],
    });
    if (result.rowsAffected === 0) return c.json({ error: "Review not found" }, 404);
    return c.json({ ok: true });
  });

  app.delete("/admin/reviews/:id", guard, async (c) => {
    const result = await db.execute({
      sql: "DELETE FROM reviews WHERE id = ?",
      args: [c.req.param("id")],
    });
    if (result.rowsAffected === 0) return c.json({ error: "Review not found" }, 404);
    return c.body(null, 204);
  });
}
