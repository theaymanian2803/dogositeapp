import { validateCheckout } from "./checkout";

describe("validateCheckout", () => {
  const valid = {
    first_name: "Ana",
    last_name: "Lopez",
    phone: "0601020304",
    address: "1 rue X",
  };
  it("accepts a complete form", () => {
    expect(validateCheckout(valid)).toEqual({});
  });
  it("flags every missing field", () => {
    expect(validateCheckout({ ...valid, phone: " " })).toHaveProperty("phone");
    expect(validateCheckout({ ...valid, first_name: "" })).toHaveProperty("first_name");
    expect(validateCheckout({ ...valid, address: "" })).toHaveProperty("address");
  });
});