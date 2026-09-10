import { resolveClient } from "./resolveClient";

const clients = {
  petpals: { slug: "petpals", appName: "PetPals" },
  other: { slug: "other", appName: "Other" },
} as const;

describe("resolveClient", () => {
  it("returns the requested client", () => {
    expect(resolveClient(clients, "other").appName).toBe("Other");
  });
  it("falls back to petpals for unknown or missing slugs", () => {
    expect(resolveClient(clients, "nope").appName).toBe("PetPals");
    expect(resolveClient(clients, undefined).appName).toBe("PetPals");
  });
});
