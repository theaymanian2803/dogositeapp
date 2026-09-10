import type { Hono } from "hono";
import type { Client } from "@libsql/client";
import { orderCreateSchema, type OrderCreateInput } from "@petpals/core";

export async function insertOrder(db: Client, input: OrderCreateInput): Promise<string> {
  const id = crypto.randomUUID();
  await db.execute({
    sql: "INSERT INTO orders (id, first_name, last_name, phone, address, items, total) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [
      id,
      input.first_name,
      input.last_name,
      input.phone,
      input.address,
      JSON.stringify(input.items),
      input.total,
    ],
  });
  return id;
}

export function registerOrderRoutes(app: Hono, db: Client): void {
  app.post("/orders", async (c) => {
    const parsed = orderCreateSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "Invalid order" }, 400);
    const id = await insertOrder(db, parsed.data);
    return c.json({ id }, 201);
  });

  app.get("/orders/track", async (c) => {
    const phone = c.req.query("phone");
    if (!phone) return c.json({ error: "Missing phone" }, 400);
    const rs = await db.execute({
      sql: "SELECT id, first_name, last_name, phone, address, items, total, status, created_at FROM orders WHERE phone = ? ORDER BY created_at DESC",
      args: [phone],
    });
    return c.json(rs.rows);
  });
}
