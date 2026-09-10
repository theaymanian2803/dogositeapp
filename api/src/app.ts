import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Client } from "@libsql/client";
import { ensureApiTablesOnce } from "./schema";
import { registerCatalogRoutes } from "./routes/catalog";
import { registerOrderRoutes } from "./routes/orders";
import { registerReviewRoutes } from "./routes/reviews";
import { registerAdminAuthRoutes } from "./routes/admin-auth";

export type AppConfig = {
  jwtSecret: string;
  cronSecret: string;
  fetchImpl?: typeof fetch;
};

export function createApp(db: Client, config: AppConfig): Hono {
  const app = new Hono();

  app.use("*", cors());
  app.use("*", async (_c, next) => {
    await ensureApiTablesOnce(db);
    await next();
  });

  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: "Internal error" }, 500);
  });

  app.get("/health", (c) => c.json({ ok: true }));

  registerCatalogRoutes(app, db);
  registerOrderRoutes(app, db);
  registerReviewRoutes(app, db);
  registerAdminAuthRoutes(app, db, config);

  return app;
}
