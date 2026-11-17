"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/money";
import type { CartData } from "@/lib/cart";

/** The cart's line items, shared by the cart page and the drawer. */
export default function CartLines({ cart, busyId, onChange, onNavigate }: {
  cart: CartData; busyId: string | null; onChange: (id: string, init: RequestInit) => void; onNavigate?: () => void;
}) {
  return (
    <ul role="list">
      {cart.items.map((i) => (
        <li key={i.id} className={`tx-item${busyId === i.id ? " is-busy" : ""}`}>
          <Link href={`/product/${i.slug}`} className="tx-item__img" onClick={onNavigate}>
            <Image src={i.image} alt={i.name} fill sizes="88px" />
          </Link>
          <div>
            <Link href={`/product/${i.slug}`} className="tx-item__name" onClick={onNavigate}>{i.name}</Link>
            <p className="tx-item__opt">{[i.model, i.color].filter(Boolean).join(" · ")}</p>
            {i.quantity >= i.stock && i.stock <= 5 && <p className="tx-item__low">Only {i.stock} left</p>}
          </div>
          <div className="tx-item__qty">
            <div className="tx-q">
              <button type="button" aria-label="Decrease quantity" disabled={!!busyId} onClick={() => onChange(i.id, { method: "PATCH", body: JSON.stringify({ quantity: i.quantity - 1 }) })}>−</button>
              <span>{i.quantity}</span>
              <button type="button" aria-label="Increase quantity" disabled={!!busyId || i.quantity >= Math.min(i.stock, 10)} onClick={() => onChange(i.id, { method: "PATCH", body: JSON.stringify({ quantity: i.quantity + 1 }) })}>+</button>
            </div>
            <button type="button" className="tx-x" aria-label={`Remove ${i.name}`} disabled={!!busyId} onClick={() => onChange(i.id, { method: "DELETE" })}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 8h6l.5-8" /></svg>
            </button>
          </div>
          <p className="tx-item__price">{formatPrice(i.unitCents * i.quantity)}</p>
        </li>
      ))}
    </ul>
  );
}
