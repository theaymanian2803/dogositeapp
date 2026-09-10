import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { createDb } from "./db";

const app = createApp(createDb(), {
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret",
  cronSecret: process.env.CRON_SECRET ?? "dev-cron",
});

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, () => {
  console.log(`API listening on http://localhost:${port}`);
});
