import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Client } from "@libsql/client";
import { ensureApiTablesOnce } from "./schema";
import { registerCatalogRoutes } from "./routes/catalog";
import { registerOrderRoutes } from "./routes/orders";
import { registerReviewRoutes } from "./routes/reviews";
import { registerAdminAuthRoutes } from "./routes/admin-auth";
import { registerAdminOrderRoutes } from "./routes/admin-orders";
import { registerAdminProductRoutes } from "./routes/admin-products";
import { registerAdminCategoryRoutes } from "./routes/admin-categories";
import { registerAdminReviewRoutes } from "./routes/admin-reviews";
import { registerAdminPushRoutes } from "./routes/admin-push";

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
  registerOrderRoutes(app, db, config);
  registerReviewRoutes(app, db);
  registerAdminAuthRoutes(app, db, config);
  registerAdminOrderRoutes(app, db, config);
  registerAdminProductRoutes(app, db, config);
  registerAdminCategoryRoutes(app, db, config);
  registerAdminReviewRoutes(app, db, config);
  registerAdminPushRoutes(app, db, config);

  return app;
}
