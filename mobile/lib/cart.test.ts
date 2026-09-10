import { cartReducer, initialCart } from "./cart";

const item = { id: "p1", name: "Food", slug: "food", price: 10, image_url: "i" };

describe("cartReducer", () => {
  it("adds items and merges duplicates", () => {
    let state = cartReducer(initialCart, { type: "add", item });
    state = cartReducer(state, { type: "add", item, qty: 2 });
    expect(state.items).toHaveLength(1);
    expect(state.items[0].qty).toBe(3);
  });
  it("removes and clamps quantity", () => {
    let state = cartReducer(initialCart, { type: "add", item });
    state = cartReducer(state, { type: "setQty", id: "p1", qty: 0 });
    expect(state.items[0].qty).toBe(1);
    state = cartReducer(state, { type: "remove", id: "p1" });
    expect(state.items).toHaveLength(0);
  });
  it("computes count and subtotal", () => {
    let state = cartReducer(initialCart, { type: "add", item, qty: 2 });
    state = cartReducer(state, { type: "add", item: { ...item, id: "p2", price: 5 } });
    expect(state.count).toBe(3);
    expect(state.subtotal).toBe(25);
  });
});