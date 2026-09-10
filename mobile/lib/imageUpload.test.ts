import { toDataUrl, isUnderLimit } from "./imageUpload";

describe("toDataUrl", () => {
  it("builds a jpeg data URL", () => {
    expect(toDataUrl("AAAA")).toBe("data:image/jpeg;base64,AAAA");
  });
});

describe("isUnderLimit", () => {
  it("accepts payloads under 2MB and rejects larger ones", () => {
    expect(isUnderLimit("A".repeat(1000))).toBe(true);
    expect(isUnderLimit("A".repeat(2 * 1024 * 1024 + 4))).toBe(false);
  });
});
