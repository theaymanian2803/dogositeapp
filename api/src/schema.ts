import type { Client } from "@libsql/client";

const API_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS push_tokens (
  id         TEXT PRIMARY KEY,
  token      TEXT NOT NULL UNIQUE,
  platform   TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notified_orders (
  order_id    TEXT PRIMARY KEY,
  notified_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

export async function ensureApiTables(db: Client): Promise<void> {
  await db.executeMultiple(API_TABLES_SQL);
}

const ensured = new WeakMap<Client, Promise<void>>();

export function ensureApiTablesOnce(db: Client): Promise<void> {
  let p = ensured.get(db);
  if (!p) {
    p = ensureApiTables(db).catch((err) => {
      ensured.delete(db);
      throw err;
    });
    ensured.set(db, p);
  }
  return p;
}
