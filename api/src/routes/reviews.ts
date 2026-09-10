import type { Hono } from "hono";
import type { Client } from "@libsql/client";
import { reviewCreateSchema } from "@petpals/core";

export function registerReviewRoutes(app: Hono, db: Client): void {
  app.get("/reviews", async (c) => {
    const { product_id, limit } = c.req.query();
    const conditions = ["status = 'approved'"];
    const args: (string | number)[] = [];
    if (product_id) {
      conditions.push("product_id = ?");
      args.push(product_id);
    }
    let sql = `SELECT * FROM reviews WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC`;
    if (limit) {
      const n = Number(limit);
      if (!Number.isInteger(n) || n <= 0) return c.json({ error: "Invalid limit" }, 400);
      sql += " LIMIT ?";
      args.push(n);
    }
    const rs = await db.execute({ sql, args });
    return c.json(rs.rows);
  });

  app.post("/reviews", async (c) => {
    const parsed = reviewCreateSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "Invalid review" }, 400);
    const id = crypto.randomUUID();
    const r = parsed.data;
    await db.execute({
      sql: "INSERT INTO reviews (id, product_id, user_id, user_name, rating, title, body, image_url, status) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, 'pending')",
      args: [
        id,
        r.product_id,
        r.user_name,
        r.rating,
        r.title ?? null,
        r.body,
        r.image_url ?? null,
      ],
    });
    return c.json({ id }, 201);
  });
}