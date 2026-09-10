import type { Hono } from "hono";
import type { Client } from "@libsql/client";

export function registerCatalogRoutes(app: Hono, db: Client): void {
  app.get("/products", async (c) => {
    const { category, q, ids, limit } = c.req.query();
    const conditions: string[] = [];
    const args: (string | number)[] = [];
    if (category) {
      conditions.push("category = ?");
      args.push(category);
    }
    if (q) {
      conditions.push("(name LIKE ? OR category LIKE ? OR tag LIKE ?)");
      const like = `%${q}%`;
      args.push(like, like, like);
    }
    if (ids) {
      const list = ids.split(",").map((s) => s.trim()).filter(Boolean);
      if (list.length > 0) {
        conditions.push(`id IN (${list.map(() => "?").join(",")})`);
        args.push(...list);
      }
    }
    let sql = "SELECT * FROM products";
    if (conditions.length > 0) sql += ` WHERE ${conditions.join(" AND ")}`;
    sql += " ORDER BY created_at DESC";
    if (limit) {
      sql += " LIMIT ?";
      args.push(Number(limit));
    }
    const rs = await db.execute({ sql, args });
    return c.json(rs.rows);
  });

  app.get("/products/:slug", async (c) => {
    const slug = c.req.param("slug");
    const productRs = await db.execute({
      sql: "SELECT * FROM products WHERE slug = ? LIMIT 1",
      args: [slug],
    });
    const product = productRs.rows[0];
    if (!product) return c.json({ error: "Product not found" }, 404);
    const relatedRs = await db.execute({
      sql: "SELECT * FROM products WHERE category = ? AND id != ? LIMIT 4",
      args: [product.category as string, product.id as string],
    });
    const reviewsRs = await db.execute({
      sql: "SELECT * FROM reviews WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC",
      args: [product.id as string],
    });
    return c.json({
      product,
      related: relatedRs.rows,
      reviews: reviewsRs.rows,
    });
  });

  app.get("/categories", async (c) => {
    const rs = await db.execute("SELECT * FROM categories ORDER BY name");
    return c.json(rs.rows);
  });

  app.get("/settings", async (c) => {
    const rs = await db.execute("SELECT key, value FROM settings");
    const map: Record<string, string> = {};
    for (const row of rs.rows) map[String(row.key)] = String(row.value ?? "");
    return c.json(map);
  });

  app.get("/sections", async (c) => {
    const rs = await db.execute("SELECT * FROM sections ORDER BY created_at");
    return c.json(rs.rows);
  });
}
