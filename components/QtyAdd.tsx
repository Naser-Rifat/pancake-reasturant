"use client";

// The reference's "− 2 +" stepper beside the add button: pick a quantity
// here, land on the menu with the whole lot already in the cart.

import { useState } from "react";
import Link from "next/link";

export default function QtyAdd({ slug }: { slug: string }) {
  const [qty, setQty] = useState(1);

  return (
    <div className="qty-add">
      <div className="qty" role="group" aria-label="Quantity">
        <button type="button" aria-label="One less" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
        <span aria-live="polite">{qty}</span>
        <button type="button" aria-label="One more" disabled={qty >= 9} onClick={() => setQty((q) => Math.min(9, q + 1))}>+</button>
      </div>
      <Link href={`/menu?add=${slug}&qty=${qty}`} className="btn btn-primary">
        Add to Order
      </Link>
    </div>
  );
}
