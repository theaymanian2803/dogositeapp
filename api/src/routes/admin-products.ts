import type { Hono } from "hono";
import type { Client } from "@libsql/client";
import { productSlug, productUpsertSchema } from "@petpals/core";
import { requireAdmin } from "../auth";
import type { AppConfig } from "../app";

export function registerAdminProductRoutes(
  app: Hono,
  db: Client,
  config: AppConfig,
): void {
  const guard = requireAdmin(config.jwtSecret);

  app.get("/admin/products", guard, async (c) => {
    const rs = await db.execute("SELECT * FROM products ORDER BY created_at DESC");
    return c.json(rs.rows);
  });

  app.post("/admin/products", guard, async (c) => {
    const parsed = productUpsertSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "Invalid product" }, 400);
    const p = parsed.data;
    const id = crypto.randomUUID();
    await db.execute({
      sql: "INSERT INTO products (id, name, slug, description, price, image_url, images, category, badge, tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [
        id,
        p.name,
        productSlug(p.name),
        p.description,
        p.price,
        p.image_url,
        p.images ? JSON.stringify(p.images) : null,
        p.category,
        p.badge ?? null,
        p.tag ?? null,
      ],
    });
    return c.json({ id }, 201);
  });

  app.patch("/admin/products/:id", guard, async (c) => {
    const parsed = productUpsertSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "Invalid product" }, 400);
    const p = parsed.data;
    const result = await db.execute({
      sql: "UPDATE products SET name=?, description=?, price=?, image_url=?, images=?, category=?, badge=?, tag=? WHERE id=?",
      args: [
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.images ? JSON.stringify(p.images) : null,
        p.category,
        p.badge ?? null,
        p.tag ?? null,
        c.req.param("id"),
      ],
    });
    if (result.rowsAffected === 0) return c.json({ error: "Product not found" }, 404);
    return c.json({ ok: true });
  });

  app.delete("/admin/products/:id", guard, async (c) => {
    const result = await db.execute({
      sql: "DELETE FROM products WHERE id = ?",
      args: [c.req.param("id")],
    });
    if (result.rowsAffected === 0) return c.json({ error: "Product not found" }, 404);
    return c.body(null, 204);
  });
}
