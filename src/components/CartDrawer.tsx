"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/money";
import type { CartData } from "@/lib/cart";
import CartLines from "@/components/CartLines";

/**
 * The theme's slide-in cart. Mount once (e.g. in the layout). Open it from anywhere with
 * `window.dispatchEvent(new Event("cart:open"))`; it re-reads the cart each time it opens.
 */
export default function CartDrawer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CartData | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/cart", { cache: "no-store" });
    if (res.ok) setCart(await res.json());
  }, []);

  useEffect(() => {
    const onOpen = () => { setOpen(true); load(); };
    window.addEventListener("cart:open", onOpen);
    return () => window.removeEventListener("cart:open", onOpen);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [open]);

  async function call(id: string, init: RequestInit) {
    setBusyId(id); setError("");
    const res = await fetch(`/api/cart/items/${id}`, { ...init, headers: { "Content-Type": "application/json" } });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) return setError(data.error ?? "Could not update your bag");
    setCart(data); router.refresh();
  }

  const close = () => setOpen(false);
  return (
    <div className={`tx-drawer${open ? " is-open" : ""}`} aria-hidden={!open}>
      <div className="tx-drawer__bg" onClick={close} />
      <div className="tx-drawer__panel" role="dialog" aria-modal="true" aria-label="Your cart">
        <div className="tx-drawer__head">
          <h2>Your cart</h2>
          <button type="button" className="tx-drawer__close" aria-label="Close" onClick={close}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m3 3 10 10M13 3 3 13" /></svg>
          </button>
        </div>
        <div className="tx-drawer__body">
          {cart && cart.items.length > 0 ? <CartLines cart={cart} busyId={busyId} onChange={call} onNavigate={close} /> : (
            <div className="tx-empty"><h1>Your cart is empty</h1><Link href="/shop" className="tx-btn tx-btn--sm" onClick={close}>Continue shopping</Link></div>
          )}
        </div>
        {cart && cart.items.length > 0 && (
          <div className="tx-drawer__foot tx-sum">
            <dl><div className="is-total" style={{ border: 0, paddingTop: 0 }}><dt>Estimated total</dt><dd>{formatPrice(cart.totalCents)}</dd></div></dl>
            <p className="tx-note">Taxes included. Delivery is free.</p>
            {error && <p role="alert" className="tx-err">{error}</p>}
            <Link href="/cart" className="tx-btn tx-btn--block" onClick={close}>View cart &amp; check out</Link>
          </div>
        )}
      </div>
    </div>
  );
}
