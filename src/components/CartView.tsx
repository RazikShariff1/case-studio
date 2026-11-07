"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPrice, FREE_SHIPPING_OVER } from "@/lib/money";
import type { CartData } from "@/lib/cart";

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
    if (!res.ok) return setError(data.error ?? "Could not update cart");
    setCart(data); router.refresh();
  }

  if (cart.items.length === 0) {
    return (
      <div className="rounded-3xl bg-card p-12 text-center">
        <p className="text-lg font-semibold">Your cart is empty</p>
        <p className="mt-1 text-sm text-muted">Find a case you love and it will show up here.</p>
        <Link href="/shop" className="btn btn-dark mt-5">Start shopping</Link>
      </div>
    );
  }

  const remaining = FREE_SHIPPING_OVER - cart.subtotalCents;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <ul className="space-y-4">
        {cart.items.map((i) => (
          <li key={i.id} className={`flex gap-4 rounded-3xl bg-card p-3 transition ${busyId === i.id ? "opacity-60" : ""}`}>
            <Link href={`/product/${i.slug}`} className="relative h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-tile">
              <Image src={i.image} alt={i.name} fill sizes="96px" className="object-contain p-1.5 mix-blend-multiply" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/product/${i.slug}`} className="block truncate font-semibold">{i.name}</Link>
                  <p className="text-sm text-muted">{i.model} · {i.color}</p>
                </div>
                <p className="font-semibold">{formatPrice(i.unitCents * i.quantity)}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center rounded-full border border-line bg-cream">
                  <button className="h-9 w-9" aria-label="Decrease quantity" disabled={!!busyId} onClick={() => call(i.id, { method: "PATCH", body: JSON.stringify({ quantity: i.quantity - 1 }) })}>−</button>
                  <span className="w-7 text-center text-sm font-semibold">{i.quantity}</span>
                  <button className="h-9 w-9" aria-label="Increase quantity" disabled={!!busyId || i.quantity >= i.stock} onClick={() => call(i.id, { method: "PATCH", body: JSON.stringify({ quantity: i.quantity + 1 }) })}>+</button>
                </div>
                <button className="text-sm text-muted underline" disabled={!!busyId} onClick={() => call(i.id, { method: "DELETE" })}>Remove</button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-3xl bg-card p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(cart.subtotalCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{cart.shippingCents === 0 ? "Free" : formatPrice(cart.shippingCents)}</dd></div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatPrice(cart.totalCents)}</dd></div>
        </dl>
        {remaining > 0 && <p className="mt-3 text-xs text-muted">Add {formatPrice(remaining)} more for free shipping.</p>}
        {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
        <Link href={signedIn ? "/checkout" : "/login?next=/checkout"} className="btn btn-dark mt-5 w-full">
          {signedIn ? "Checkout" : "Sign in to checkout"}
        </Link>
      </aside>
    </div>
  );
}
