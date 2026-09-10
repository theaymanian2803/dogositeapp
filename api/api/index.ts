import { handle } from "hono/vercel";
import { createApp } from "../src/app";
import { createDb } from "../src/db";

export const config = { runtime: "nodejs" };

const app = createApp(createDb(), {
  jwtSecret: process.env.JWT_SECRET ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
});

export default handle(app);
