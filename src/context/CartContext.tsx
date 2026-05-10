import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, ReactNode } from "react";
import type { Product } from "@/data/products";
import { useAuth } from "@/context/AuthContext";

export type CartItem = {
  product: Product;
  quantity: number;
};

type State = { items: CartItem[] };
type Action =
  | { type: "ADD"; product: Product; quantity?: number }
  | { type: "REMOVE"; slug: string }
  | { type: "UPDATE"; slug: string; quantity: number }
  | { type: "CLEAR" };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD": {
      const qty = action.quantity ?? 1;
      const existing = state.items.find((i) => i.product.slug === action.product.slug);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.slug === action.product.slug ? { ...i, quantity: i.quantity + qty } : i
          ),
        };
      }
      return { items: [...state.items, { product: action.product, quantity: qty }] };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => i.product.slug !== action.slug) };
    case "UPDATE":
      return {
        items: state.items
          .map((i) => (i.product.slug === action.slug ? { ...i, quantity: Math.max(1, action.quantity) } : i))
          .filter((i) => i.quantity > 0),
      };
    case "CLEAR":
      return { items: [] };
  }
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (product: Product, quantity?: number) => void;
  remove: (slug: string) => void;
  update: (slug: string, quantity: number) => void;
  clear: () => void;
  miniOpen: boolean;
  openMini: () => void;
  closeMini: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, { items: [] });
  const [miniOpen, setMiniOpen] = useState(false);

  const value = useMemo<CartContextValue>(() => {
    const count = state.items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = state.items.reduce((s, i) => s + i.quantity * i.product.price, 0);
    return {
      items: state.items,
      count,
      subtotal,
      add: (product, quantity) => {
        dispatch({ type: "ADD", product, quantity });
        setMiniOpen(true);
      },
      remove: (slug) => dispatch({ type: "REMOVE", slug }),
      update: (slug, quantity) => dispatch({ type: "UPDATE", slug, quantity }),
      clear: () => dispatch({ type: "CLEAR" }),
      miniOpen,
      openMini: () => setMiniOpen(true),
      closeMini: () => setMiniOpen(false),
    };
  }, [state.items, miniOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
