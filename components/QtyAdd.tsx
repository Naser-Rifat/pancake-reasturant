"use client";

// The reference's "− 2 +" stepper beside the add button. It used to be a link
// to /menu?add=… which threw you off the dish page to do the adding; it now
// adds straight into the shared cart and stays put.

import { useState } from "react";
import { MAX_QTY, useCart } from "@/lib/cart";

export default function QtyAdd({ slug, name }: { slug: string; name: string }) {
  const [qty, setQty] = useState(1);
  const { add, showToast } = useCart();

  return (
    <div className="qty-add">
      <div className="qty" role="group" aria-label="Quantity">
        <button type="button" aria-label="One less" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
        <span aria-live="polite">{qty}</span>
        <button type="button" aria-label="One more" disabled={qty >= MAX_QTY} onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}>+</button>
      </div>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          add(slug, qty);
          showToast(`${name} added to your order 🥞`);
        }}
      >
        Add to Order
      </button>
    </div>
  );
}
