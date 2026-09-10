import type { Hono } from "hono";
import type { Client } from "@libsql/client";
import { notifyOrder } from "../push";
import type { AppConfig } from "../app";

export function registerCronRoutes(app: Hono, db: Client, config: AppConfig): void {
  app.get("/cron/new-orders", async (c) => {
    if (c.req.query("secret") !== config.cronSecret) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const rs = await db.execute(
      "SELECT id FROM orders WHERE created_at >= datetime('now', '-1 day') AND id NOT IN (SELECT order_id FROM notified_orders)",
    );
    let notified = 0;
    for (const row of rs.rows) {
      const sent = await notifyOrder(db, String(row.id), config.fetchImpl);
      if (sent) notified += 1;
    }
    return c.json({ notified });
  });
}