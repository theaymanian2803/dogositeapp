import { beforeAll, describe, expect, it } from "vitest";
import type { Client } from "@libsql/client";
import { createTestApp, loginAdmin, seedAdmin } from "./helpers";

let db: Client;
let app: ReturnType<typeof createTestApp>["app"];
let token: string;

beforeAll(async () => {
  ({ db, app } = createTestApp());
  await seedAdmin(db);
  token = await loginAdmin(app);
  await db.execute({
    sql: "INSERT INTO products (id, name, slug, description, price, image_url, category) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: ["p1", "Food", "food-x1", "Tasty", 10, "img", "dogs"],
  });
  await db.execute({
    sql: "INSERT INTO reviews (id, product_id, user_name, rating, body, status) VALUES (?, ?, ?, ?, ?, ?)",
    args: ["r1", "p1", "Ana", 5, "Great", "pending"],
  });
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe("admin reviews", () => {
  it("lists reviews with product name", async () => {
    const body = (await (await app.request("/admin/reviews", { headers: auth() })).json()) as {
      id: string;
      product_name: string;
    }[];
    expect(body).toHaveLength(1);
    expect(body[0].product_name).toBe("Food");
  });
  it("approves a review", async () => {
    const res = await app.request("/admin/reviews/r1", {
      method: "PATCH",
      headers: { ...auth(), "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    expect(res.status).toBe(200);
    const row = await db.execute("SELECT status FROM reviews WHERE id = 'r1'");
    expect(row.rows[0].status).toBe("approved");
  });
  it("deletes a review", async () => {
    const res = await app.request("/admin/reviews/r1", {
      method: "DELETE",
      headers: auth(),
    });
    expect(res.status).toBe(204);
  });
});
