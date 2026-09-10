import { handle } from "hono/vercel";
import { createApp } from "./app";
import { createDb } from "./db";

export const config = { runtime: "nodejs" };

const jwtSecret = process.env.JWT_SECRET;
const cronSecret = process.env.CRON_SECRET;
if (!jwtSecret) throw new Error("Missing JWT_SECRET");
if (!cronSecret) throw new Error("Missing CRON_SECRET");

const app = createApp(createDb(), { jwtSecret, cronSecret });

export default handle(app);