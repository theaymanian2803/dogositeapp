import type { Client } from "@libsql/client";

const WEB_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS admins (
  id       TEXT PRIMARY KEY,
  email    TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id       TEXT PRIMARY KEY,
  email    TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id         TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  user_id    TEXT,
  user_name  TEXT NOT NULL,
  rating     INTEGER NOT NULL,
  title      TEXT,
  body       TEXT NOT NULL,
  image_url  TEXT,
  status     TEXT NOT NULL DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  price       REAL NOT NULL,
  image_url   TEXT NOT NULL,
  images      TEXT,
  category    TEXT NOT NULL,
  badge       TEXT,
  tag         TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id          TEXT PRIMARY KEY,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  phone       TEXT NOT NULL,
  address     TEXT NOT NULL,
  items       TEXT NOT NULL,
  total       REAL NOT NULL,
  status      TEXT DEFAULT 'new',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sections (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,
  name        TEXT NOT NULL,
  size        TEXT NOT NULL DEFAULT 'medium',
  align       TEXT NOT NULL DEFAULT 'center',
  image_url   TEXT,
  title       TEXT,
  subtitle    TEXT,
  button_text TEXT,
  button_link TEXT,
  grid_items  TEXT,
  columns     INTEGER DEFAULT 3,
  product_ids TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

export async function ensureWebTables(db: Client): Promise<void> {
  await db.executeMultiple(WEB_SCHEMA_SQL);
  const cols = await db.execute("PRAGMA table_info(products)");
  if (!cols.rows.some((c) => c.name === "images")) {
    await db.execute("ALTER TABLE products ADD COLUMN images TEXT");
  }
  const sectionCols = await db.execute("PRAGMA table_info(sections)");
  const names = new Set(sectionCols.rows.map((c) => String(c.name)));
  if (!names.has("align")) {
    await db.execute("ALTER TABLE sections ADD COLUMN align TEXT NOT NULL DEFAULT 'center'");
  }
  if (!names.has("columns")) {
    await db.execute("ALTER TABLE sections ADD COLUMN columns INTEGER DEFAULT 3");
  }
  if (!names.has("product_ids")) {
    await db.execute("ALTER TABLE sections ADD COLUMN product_ids TEXT");
  }
}