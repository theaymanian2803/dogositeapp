import { buildUrl, parseError } from "./api";

describe("buildUrl", () => {
  it("joins base and path", () => {
    expect(buildUrl("https://x.dev", "/products")).toBe("https://x.dev/products");
    expect(buildUrl("https://x.dev/", "products?q=a")).toBe("https://x.dev/products?q=a");
  });
});

describe("parseError", () => {
  it("reads the error field from JSON bodies", async () => {
    const res = new Response(JSON.stringify({ error: "Nope" }), { status: 400 });
    await expect(parseError(res)).resolves.toBe("Nope");
  });
  it("falls back to the status", async () => {
    const res = new Response("bad", { status: 500 });
    await expect(parseError(res)).resolves.toBe("Request failed (500)");
  });
});