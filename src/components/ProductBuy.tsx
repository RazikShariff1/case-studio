"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/money";
import { PHONE_MODELS } from "@/lib/catalog-constants";

type V = { id: string; model: string; color: string; colorHex: string; stock: number };
type Props = {
  name: string; priceCents: number; compareAtCents: number | null;
  rating: number; reviewCount: number; slug: string; variants: V[];
};

export default function ProductBuy({ name, priceCents, compareAtCents, rating, reviewCount, variants }: Props) {
  const router = useRouter();
  const models = useMemo(() => {
    const rank = (m: string) => { const i = (PHONE_MODELS as readonly string[]).indexOf(m); return i < 0 ? 99 : i; };
    return [...new Set(variants.map((v) => v.model))].sort((a, b) => rank(a) - rank(b));
  }, [variants]);
  const colors = useMemo(() => [...new Map(variants.map((v) => [v.color, v.colorHex])).entries()], [variants]);

  const firstModel = models[0];
  const firstColor = colors[0][0];
  const firstAvail = variants.find((v) => v.model === firstModel && v.color === firstColor && v.stock > 0)
    ?? variants.find((v) => v.model === firstModel && v.stock > 0)
    ?? variants.find((v) => v.stock > 0) ?? variants[0];
  const [model, setModel] = useState(firstAvail.model);
  const [color, setColor] = useState(firstAvail.color);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const find = (m: string, c: string) => variants.find((v) => v.model === m && v.color === c);
  const selected = find(model, color);
  const stock = selected?.stock ?? 0;

  function pickModel(m: string) {
    setModel(m);
    if (!find(m, color)) setColor(variants.find((v) => v.model === m && v.stock > 0)?.color ?? variants.find((v) => v.model === m)!.color);
    setQty(1); setMsg(null);
  }

  async function add() {
    if (!selected || stock <= 0) return;
    setBusy(true); setMsg(null);
    const res = await fetch("/api/cart", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId: selected.id, quantity: qty }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: data.error ?? "Could not add to cart" });
    setMsg({ ok: true, text: "Added to your cart" });
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold leading-tight tracking-tight md:text-3xl">{name}</h1>
        <p className="shrink-0 text-xl font-semibold md:text-2xl">{formatPrice(priceCents)}</p>
      </div>
      <div className="mt-1 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">For {model}</p>
        {compareAtCents && <p className="text-sm text-muted line-through">{formatPrice(compareAtCents)}</p>}
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm">
        <span className="tracking-tight text-ink" aria-hidden>{"★".repeat(Math.round(rating))}<span className="text-ink/25">{"★".repeat(5 - Math.round(rating))}</span></span>
        <span className="font-medium">{rating.toFixed(1)}</span>
        <span className="text-muted">({reviewCount} Reviews)</span>
      </p>

      <fieldset className="mt-6">
        <legend className="mb-3 text-sm font-semibold">Select Color <span className="font-normal text-muted">· {color}</span></legend>
        <div className="flex flex-wrap gap-3">
          {colors.map(([c, hex]) => {
            const exists = !!find(model, c);
            const avail = find(model, c)?.stock ?? 0;
            const on = color === c;
            return (
              <button key={c} type="button" disabled={!exists} aria-label={`${c}${exists && avail <= 0 ? " (sold out)" : ""}`} aria-pressed={on}
                onClick={() => { setColor(c); setQty(1); setMsg(null); }}
                className={`relative grid h-12 w-12 place-items-center rounded-full border-2 transition disabled:opacity-30 ${on ? "border-ink/70" : "border-transparent"}`}>
                <span className={`block rounded-full border border-black/10 ${on ? "h-8 w-8" : "h-10 w-10"} transition-all ${exists && avail <= 0 ? "opacity-40" : ""}`} style={{ background: hex }} />
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="mb-3 text-sm font-semibold">Select Model</legend>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">
          {models.map((m) => (
            <button key={m} type="button" aria-pressed={model === m} onClick={() => pickModel(m)}
              className={`shrink-0 whitespace-nowrap rounded-2xl border px-5 py-3 text-sm font-medium transition ${model === m ? "border-ink/60 bg-cream shadow-sm" : "border-transparent bg-cream/70 hover:bg-white"}`}>
              {m}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 flex items-center gap-4">
        <div className="flex items-center rounded-full border border-line bg-cream">
          <button type="button" className="h-10 w-10 text-lg" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span className="w-7 text-center font-semibold" aria-live="polite">{qty}</span>
          <button type="button" className="h-10 w-10 text-lg" aria-label="Increase quantity" disabled={qty >= Math.min(stock, 10)} onClick={() => setQty((q) => Math.min(Math.min(stock, 10), q + 1))}>+</button>
        </div>
        <p className={`text-sm ${stock > 0 && stock <= 5 ? "text-danger" : "text-muted"}`}>
          {stock <= 0 ? "Sold out" : stock <= 5 ? `Only ${stock} left` : "In stock"}
        </p>
      </div>

      <div className="sticky bottom-3 z-10 mt-5">
        <button className="flex w-full items-center justify-center gap-2.5 rounded-full bg-olive py-4 text-base font-semibold text-white shadow-lg transition hover:bg-olive-2 active:scale-[.99] disabled:opacity-50" onClick={add} disabled={busy || stock <= 0}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>
          {stock <= 0 ? "Sold out" : busy ? "Adding…" : `Add to Cart · ${formatPrice(priceCents * qty)}`}
        </button>
      </div>
      <p role="status" className={`mt-2 min-h-5 text-center text-sm ${msg?.ok ? "text-olive-2" : "text-danger"}`}>
        {msg?.text} {msg?.ok && <a href="/cart" className="font-semibold underline">View cart</a>}
      </p>
    </div>
  );
}
