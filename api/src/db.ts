import { createClient, type Client } from "@libsql/client";

export function createDb(): Client {
  const url = process.env.TURSO_DB_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("Missing TURSO_DB_URL");
  return createClient({ url, authToken });
}
