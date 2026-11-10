"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPrice } from "@/lib/money";
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
    if (!res.ok) return setError(data.error ?? "Could not update your bag");
    setCart(data); router.refresh();
  }

  if (cart.items.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-[28px] font-semibold tracking-tight">Your bag is empty.</p>
        <p className="mt-2 text-[17px] text-muted">Find a case you love and it will show up here.</p>
        <Link href="/shop" className="btn btn-blue mt-8">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-14 lg:grid-cols-[1fr_360px]">
      <ul className="divide-y divide-line border-y border-line">
        {cart.items.map((i) => (
          <li key={i.id} className={`flex gap-5 py-7 transition ${busyId === i.id ? "opacity-50" : ""}`}>
            <Link href={`/product/${i.slug}`} className="tile relative h-32 w-28 shrink-0 overflow-hidden !rounded-2xl sm:h-40 sm:w-36">
              <Image src={i.image} alt={i.name} fill sizes="144px" className="object-contain p-3 mix-blend-multiply" style={{ objectPosition: i.imagePosition }} />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div className="flex justify-between gap-4">
                <div className="min-w-0">
                  <Link href={`/product/${i.slug}`} className="block text-[19px] font-semibold leading-snug tracking-tight hover:underline">{i.name}</Link>
                  <p className="mt-0.5 text-[14px] text-muted">{[i.model, i.color].filter(Boolean).join(" · ")}</p>
                  {i.quantity >= i.stock && i.stock <= 5 && <p className="mt-1 text-[12px] text-danger">Only {i.stock} left</p>}
                </div>
                <p className="shrink-0 text-[17px] font-semibold">{formatPrice(i.unitCents * i.quantity)}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center rounded-full bg-surface">
                  <button className="h-9 w-9 text-[20px] leading-none" aria-label="Fewer" disabled={!!busyId} onClick={() => call(i.id, { method: "PATCH", body: JSON.stringify({ quantity: i.quantity - 1 }) })}>−</button>
                  <span className="w-7 text-center text-[15px] font-semibold">{i.quantity}</span>
                  <button className="h-9 w-9 text-[20px] leading-none" aria-label="More" disabled={!!busyId || i.quantity >= Math.min(i.stock, 10)} onClick={() => call(i.id, { method: "PATCH", body: JSON.stringify({ quantity: i.quantity + 1 }) })}>+</button>
                </div>
                <button className="link text-[14px]" disabled={!!busyId} onClick={() => call(i.id, { method: "DELETE" })}>Remove</button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit lg:sticky lg:top-20">
        <h2 className="text-[21px] font-semibold tracking-tight">Order summary</h2>
        <dl className="mt-5 space-y-3 text-[15px]">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(cart.subtotalCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>Free</dd></div>
          <div className="divider flex justify-between pt-4 text-[21px] font-semibold"><dt>Total</dt><dd>{formatPrice(cart.totalCents)}</dd></div>
        </dl>
        {error && <p role="alert" className="mt-4 text-[14px] text-danger">{error}</p>}
        <Link href={signedIn ? "/checkout" : "/login?next=/checkout"} className="btn btn-blue btn-block mt-6">{signedIn ? "Check Out" : "Sign in to check out"}</Link>
        <p className="fine mt-4">Pay when your order arrives. Cancel any time before it is packed.</p>
      </aside>
    </div>
  );
}
