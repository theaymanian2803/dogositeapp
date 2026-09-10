import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string;
  qty: number;
};

export type CartState = { items: CartItem[]; count: number; subtotal: number };

type CartAction =
  | { type: "add"; item: Omit<CartItem, "qty">; qty?: number }
  | { type: "remove"; id: string }
  | { type: "setQty"; id: string; qty: number }
  | { type: "clear" };

export const initialCart: CartState = { items: [], count: 0, subtotal: 0 };

function withTotals(items: CartItem[]): CartState {
  return {
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal: items.reduce((s, i) => s + i.qty * Number(i.price), 0),
  };
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "add": {
      const qty = action.qty ?? 1;
      const existing = state.items.find((i) => i.id === action.item.id);
      const items = existing
        ? state.items.map((i) => (i.id === action.item.id ? { ...i, qty: i.qty + qty } : i))
        : [...state.items, { ...action.item, qty }];
      return withTotals(items);
    }
    case "remove":
      return withTotals(state.items.filter((i) => i.id !== action.id));
    case "setQty":
      return withTotals(
        state.items.map((i) => (i.id === action.id ? { ...i, qty: Math.max(1, action.qty) } : i)),
      );
    case "clear":
      return initialCart;
  }
}

const STORAGE_KEY = "petpals_cart";

type CartValue = CartState & {
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue>({
  ...initialCart,
  add: () => {},
  remove: () => {},
  setQty: () => {},
  clear: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(initialCart);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        setState(withTotals(JSON.parse(raw) as CartItem[]));
      } catch {
        /* ignore */
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.items)).catch(() => {});
  }, [state.items]);

  const add = useCallback(
    (item: Omit<CartItem, "qty">, qty?: number) =>
      setState((s) => cartReducer(s, { type: "add", item, qty })),
    [],
  );
  const remove = useCallback((id: string) => setState((s) => cartReducer(s, { type: "remove", id })), []);
  const setQty = useCallback(
    (id: string, qty: number) => setState((s) => cartReducer(s, { type: "setQty", id, qty })),
    [],
  );
  const clear = useCallback(() => setState((s) => cartReducer(s, { type: "clear" })), []);

  const value = useMemo(
    () => ({ ...state, add, remove, setQty, clear }),
    [state, add, remove, setQty, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}