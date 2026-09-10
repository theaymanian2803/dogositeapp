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
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe("admin categories", () => {
  it("creates with slugify and lists", async () => {
    const res = await app.request("/admin/categories", {
      method: "POST",
      headers: { ...auth(), "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Pet Toys" }),
    });
    expect(res.status).toBe(201);
    const { id } = (await res.json()) as { id: string };
    const row = await db.execute({ sql: "SELECT slug FROM categories WHERE id = ?", args: [id] });
    expect(row.rows[0].slug).toBe("pet-toys");
    const list = await (await app.request("/admin/categories", { headers: auth() })).json();
    expect(list).toHaveLength(1);
  });
  it("rejects an empty name", async () => {
    const res = await app.request("/admin/categories", {
      method: "POST",
      headers: { ...auth(), "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });
    expect(res.status).toBe(400);
  });
  it("deletes", async () => {
    const list = (await (await app.request("/admin/categories", { headers: auth() })).json()) as {
      id: string;
    }[];
    const res = await app.request(`/admin/categories/${list[0].id}`, {
      method: "DELETE",
      headers: auth(),
    });
    expect(res.status).toBe(204);
  });
});
