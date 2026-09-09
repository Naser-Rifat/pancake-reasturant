"use client";

// One cart for the whole site. It used to live inside MenuClient, so the dish
// page could not add to it — "Add to Order" was a link to /menu?add=… that left
// the page and let the menu do the work. Now both pages share this, and the
// bottom tab bar can show a count.
//
// The storage key and the {slug: qty} shape are deliberately unchanged: a cart
// saved by the old code still loads, and checkout in MenuClient reads exactly
// what it read before.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const CART_KEY = "krush-cart-v2";
/** one line holds at most 9 — matches the stepper and the ?add= URL path */
export const MAX_QTY = 9;

export type Cart = Record<string, number>;

type CartApi = {
  cart: Cart;
  /** false until localStorage has been read, so nothing writes over a saved cart */
  loaded: boolean;
  count: number;
  add: (slug: string, qty?: number) => void;
  inc: (slug: string) => void;
  dec: (slug: string) => void;
  clear: () => void;
  /** drop slugs that have left the menu; the menu page knows the live list */
  reconcile: (slugs: string[]) => void;
  toast: string;
  showToast: (msg: string) => void;
  /** bumps on every add, so the cart button can replay its pop animation */
  addedAt: number;
};

const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({});
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState("");
  const [addedAt, setAddedAt] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem(CART_KEY) || "{}"));
    } catch {
      /* corrupted storage — start fresh */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, loaded]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }, []);

  const add = useCallback((slug: string, qty = 1) => {
    setCart((c) => ({ ...c, [slug]: Math.min(MAX_QTY, (c[slug] || 0) + qty) }));
    setAddedAt((n) => n + 1);
  }, []);

  const inc = useCallback((slug: string) => {
    setCart((c) => ({ ...c, [slug]: Math.min(MAX_QTY, (c[slug] || 0) + 1) }));
  }, []);

  const dec = useCallback((slug: string) => {
    setCart((c) => {
      const next = { ...c, [slug]: (c[slug] || 0) - 1 };
      if (next[slug] <= 0) delete next[slug];
      return next;
    });
  }, []);

  const clear = useCallback(() => setCart({}), []);

  const reconcile = useCallback((slugs: string[]) => {
    setCart((c) => {
      const next = { ...c };
      let changed = false;
      Object.keys(next).forEach((slug) => {
        if (!slugs.includes(slug)) {
          delete next[slug];
          changed = true;
        }
      });
      return changed ? next : c;
    });
  }, []);

  const count = Object.values(cart).reduce((s, q) => s + q, 0);

  return (
    <CartContext.Provider
      value={{ cart, loaded, count, add, inc, dec, clear, reconcile, toast, showToast, addedAt }}
    >
      {children}
      {/* one toast for the whole site — the menu page used to own its own copy */}
      <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
    </CartContext.Provider>
  );
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
