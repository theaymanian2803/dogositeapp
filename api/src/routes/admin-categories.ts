import type { Hono } from "hono";
import type { Client } from "@libsql/client";
import { categoryCreateSchema, slugify } from "@petpals/core";
import { requireAdmin } from "../auth";
import type { AppConfig } from "../app";

export function registerAdminCategoryRoutes(
  app: Hono,
  db: Client,
  config: AppConfig,
): void {
  const guard = requireAdmin(config.jwtSecret);

  app.get("/admin/categories", guard, async (c) => {
    const rs = await db.execute("SELECT * FROM categories ORDER BY name");
    return c.json(rs.rows);
  });

  app.post("/admin/categories", guard, async (c) => {
    const parsed = categoryCreateSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "Invalid category" }, 400);
    const id = crypto.randomUUID();
    await db.execute({
      sql: "INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)",
      args: [id, parsed.data.name, slugify(parsed.data.name)],
    });
    return c.json({ id }, 201);
  });

  app.delete("/admin/categories/:id", guard, async (c) => {
    const result = await db.execute({
      sql: "DELETE FROM categories WHERE id = ?",
      args: [c.req.param("id")],
    });
    if (result.rowsAffected === 0) return c.json({ error: "Category not found" }, 404);
    return c.body(null, 204);
  });
}
