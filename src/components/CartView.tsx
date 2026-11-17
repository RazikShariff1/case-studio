"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPrice } from "@/lib/money";
import type { CartData } from "@/lib/cart";
import CartLines from "@/components/CartLines";

export default function CartView({ initial, signedIn }: { initial: CartData; signedIn: boolean }) {
  const router = useRouter();
  const [cart, setCart] = useState(initial);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function call(id: string, init: RequestInit) {
    setBusyId(id); setError("");
    const res = await fetch(`/api/cart/items/${id}`, { ...init, headers: { "Content-Type": "application/json" } });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) return setError(data.error ?? "Could not update your bag");
    setCart(data); router.refresh();
  }

  if (cart.items.length === 0) {
    return (
      <div className="tx-empty">
        <h1>Your cart is empty</h1>
        <Link href="/shop" className="tx-btn">Continue shopping</Link>
        {!signedIn && <p>Have an account? <Link href="/login?next=/cart">Log in</Link> to check out faster.</p>}
      </div>
    );
  }

  return (
    <div className="tx-cart__grid">
      <div>
        <div className="tx-cart__cols"><span>Product</span><span>Quantity</span><span>Total</span></div>
        <CartLines cart={cart} busyId={busyId} onChange={call} />
      </div>
      <aside className="tx-sum">
        <h2>Order summary</h2>
        <dl>
          <div><dt>Subtotal</dt><dd>{formatPrice(cart.subtotalCents)}</dd></div>
          <div><dt>Delivery</dt><dd>Free</dd></div>
          <div className="is-total"><dt>Estimated total</dt><dd>{formatPrice(cart.totalCents)}</dd></div>
        </dl>
        <p className="tx-note">Taxes included. Pay when your order arrives. Cancel any time before it is packed.</p>
        {error && <p role="alert" className="tx-err">{error}</p>}
        <Link href={signedIn ? "/checkout" : "/login?next=/checkout"} className="tx-btn tx-btn--block">{signedIn ? "Check out" : "Sign in to check out"}</Link>
      </aside>
    </div>
  );
}
