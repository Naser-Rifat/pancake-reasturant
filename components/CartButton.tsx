"use client";

// The one cart control. It wears three skins depending on where it is mounted:
//
//   .nav-cart          mobile/tablet app header, top right — the standard slot
//   .dish-topbar-cart  the dish page's own app bar, which replaces the header
//   .cart-fab          desktop's floating bubble, since desktop has no app bar
//
// One component rather than three near-identical ones, so the badge, the pop
// animation and the "stay away until there is an order" rule can only be right
// or wrong everywhere at once.

import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";

export default function CartButton({
  live = true,
  className,
  size = 20,
}: {
  live?: boolean;
  className: string;
  size?: number;
}) {
  const { count, openCart, addedAt } = useCart();
  const [pop, setPop] = useState(false);

  // replay the badge's pop on every add, wherever it was added from
  useEffect(() => {
    if (!addedAt) return;
    setPop(false);
    const id = requestAnimationFrame(() => setPop(true));
    return () => cancelAnimationFrame(id);
  }, [addedAt]);

  if (!live || count === 0) return null;

  return (
    <button
      type="button"
      className={className}
      aria-label={`Your order — ${count} item${count === 1 ? "" : "s"}`}
      onClick={openCart}
    >
      <ShoppingCart size={size} strokeWidth={2.2} aria-hidden="true" />
      <span className={`count${pop ? " pop" : ""}`} aria-hidden="true">
        {count}
      </span>
    </button>
  );
}
