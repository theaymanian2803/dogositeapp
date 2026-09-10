import { parseLoginResponse } from "./adminSession";

describe("parseLoginResponse", () => {
  it("accepts a token and email", () => {
    expect(parseLoginResponse({ token: "t", email: "a@b.c" })).toEqual({
      token: "t",
      email: "a@b.c",
    });
  });
  it("rejects malformed responses", () => {
    expect(parseLoginResponse({})).toBeNull();
    expect(parseLoginResponse({ token: 1, email: null })).toBeNull();
  });
});