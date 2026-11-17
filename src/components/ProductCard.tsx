"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/money";
import type { ProductListItem } from "@/lib/catalog";

/** The theme's product card (snippets/tx-product-card): photo (second photo on hover), sale badge, quick add, name, colour · phone, price. */
export default function ProductCard({ p, index = 0 }: { p: ProductListItem; index?: number; className?: string }) {
  const router = useRouter();
  const [peek, setPeek] = useState(false); // the hover photo is only fetched once the card is touched
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const off = p.compareAtCents ? Math.round((1 - p.priceCents / p.compareAtCents) * 100) : 0;
  const inStock = p.variants.filter((v) => v.stock > 0);
  const pick = inStock[0] ?? p.variants[0];
  const single = p.variants.length === 1;
  const href = `/product/${p.slug}`;
  const sizes = "(min-width: 990px) 25vw, (min-width: 750px) 33vw, 50vw";

  async function quickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!pick || state !== "idle") return;
    setState("busy");
    const res = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ variantId: pick.id, quantity: 1 }) });
    if (!res.ok) { setState("idle"); router.push(href); return; }
    setState("done");
    router.refresh();
    setTimeout(() => setState("idle"), 1400);
  }

  return (
    <div className="tx-plp__item" style={{ ["--i" as string]: index % 8 }}>
      <div className="tx-plp__card">
        <div className="tx-plp__visual">
          <Link className="tx-plp__media" href={href} tabIndex={-1} aria-hidden="true" onPointerEnter={() => setPeek(true)} onTouchStart={() => setPeek(true)}>
            <Image src={p.images[0]} alt={p.name} fill sizes={sizes} priority={index < 4} className="tx-plp__img" />
            {peek && p.images[1] && <Image src={p.images[1]} alt="" fill sizes={sizes} className="tx-plp__img tx-plp__img--alt" />}
            {off > 0 ? <span className="tx-plp__sale">−{off}%</span> : inStock.length === 0 ? <span className="tx-plp__sale tx-plp__sale--out">Sold out</span> : null}
          </Link>
          {inStock.length > 0 && (single ? (
            <form className="tx-plp__quick" onSubmit={quickAdd}>
              <button type="submit" className={`tx-plp__add${state === "done" ? " is-done" : ""}`} disabled={state === "busy"}>
                <span className="tx-plp__add-label"><span className="tx-plp__add-text">{state === "busy" ? "Adding…" : "Add to cart"}</span><span className="tx-plp__add-plus" aria-hidden="true">+</span></span>
                <span className="tx-plp__add-done" aria-hidden="true">Added ✓</span>
              </button>
            </form>
          ) : (
            <Link className="tx-plp__quick tx-plp__add" href={href}>Choose options</Link>
          ))}
        </div>
        <Link className="tx-plp__info" href={href} title={p.name}>
          <span className="tx-plp__name">{p.name}</span>
          {pick && <span className="tx-plp__meta">{pick.color}{pick.color && pick.model ? " · " : ""}{pick.model}</span>}
          <span className="tx-plp__price">
            <span>{formatPrice(p.priceCents)}</span>
            {p.compareAtCents ? <s>{formatPrice(p.compareAtCents)}</s> : null}
          </span>
        </Link>
      </div>
    </div>
  );
}
