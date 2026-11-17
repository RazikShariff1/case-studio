"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/money";
import { PHONE_MODELS } from "@/lib/catalog-constants";

type V = { id: string; model: string; color: string; colorHex: string; stock: number; priceCents: number; compareAtCents: number | null };
type Props = { name: string; rating: number; reviewCount: number; variants: V[]; description?: string; category?: string };

/** The buying steps: choose a phone, choose a colour, add to bag. The price follows the selection. */
export default function ProductBuy({ name, variants, description, category }: Props) {
  const router = useRouter();
  const models = useMemo(() => {
    const rank = (m: string) => { const i = (PHONE_MODELS as readonly string[]).indexOf(m); return i < 0 ? 99 : i; };
    return [...new Set(variants.map((v) => v.model))].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  }, [variants]);
  const colors = useMemo(() => [...new Map(variants.map((v) => [v.color, v.colorHex])).entries()], [variants]);

  const start = variants.find((v) => v.stock > 0) ?? variants[0];
  const [model, setModel] = useState(start.model);
  const [color, setColor] = useState(start.color);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const find = (m: string, c: string) => variants.find((v) => v.model === m && v.color === c);
  const selected = find(model, color);
  const stock = selected?.stock ?? 0;
  const maxQty = Math.min(stock, 10);
  const total = (selected?.priceCents ?? 0) * qty;

  function pickModel(m: string) {
    setModel(m);
    if (!find(m, color)) setColor(variants.find((v) => v.model === m && v.stock > 0)?.color ?? variants.find((v) => v.model === m)!.color);
    setQty(1); setMsg(null);
  }

  async function add() {
    if (!selected || stock <= 0) return;
    setBusy(true); setMsg(null);
    const res = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ variantId: selected.id, quantity: qty }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: data.error ?? "Could not add to your bag" });
    setMsg({ ok: true, text: "Added to your bag." });
    router.refresh();
    window.dispatchEvent(new Event("cart:open"));
  }

  const save = selected?.compareAtCents && selected.priceCents ? Math.floor(((selected.compareAtCents - selected.priceCents) * 100) / selected.compareAtCents) : 0;

  return (
    <div className="tx-pdp__sticky">
      <h1 className="tx-pdp__title">{name}</h1>
      <div className="tx-pdp__price">
        <span className="tx-pdp__now">{formatPrice(selected?.priceCents ?? 0)}</span>
        {selected?.compareAtCents ? <s className="tx-pdp__was">{formatPrice(selected.compareAtCents)}</s> : null}
        {save > 0 && <span className="tx-pdp__save">Save {save}%</span>}
      </div>
      <p className="tx-pdp__tax">Inclusive of all taxes</p>

      {models.length > 1 && (
        <fieldset className="tx-pdp__option">
          <legend>Phone: <strong>{model}</strong></legend>
          <div className="tx-pdp__pills">
            {models.map((m) => (
              <label key={m} className="tx-pdp__pill">
                <input type="radio" name="tx-model" checked={model === m} onChange={() => pickModel(m)} />
                <span>{m}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {colors.length > 1 && (
        <fieldset className="tx-pdp__option">
          <legend>Colour: <strong>{color}</strong></legend>
          <div className="tx-pdp__pills">
            {colors.map(([c]) => (
              <label key={c} className="tx-pdp__pill">
                <input type="radio" name="tx-color" disabled={!find(model, c)} checked={color === c} onChange={() => { setColor(c); setQty(1); setMsg(null); }} />
                <span>{c}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="tx-pdp__form">
        <div className="tx-pdp__buy">
          <div className="tx-pdp__qty">
            <button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span aria-live="polite">{qty}</span>
            <button type="button" aria-label="Increase quantity" disabled={qty >= maxQty} onClick={() => setQty((q) => Math.min(maxQty, q + 1))}>+</button>
          </div>
          <button type="button" className="tx-pdp__add" onClick={add} disabled={busy || stock <= 0}>
            {stock <= 0 ? "Sold out" : busy ? "Adding…" : msg?.ok ? "Added ✓" : "Add to cart"}
          </button>
        </div>
        <p role="alert" className="tx-pdp__error" hidden={!msg || msg.ok}>{msg?.text}</p>
        {msg?.ok && <p className="tx-pdp__ok">Added to your bag. <a href="/cart" className="link">View your bag</a></p>}
        {stock > 0 && stock <= 5 && <p className="tx-pdp__error">Only {stock} left</p>}
      </div>

      <ul className="tx-pdp__perks" role="list">
        <li>Free delivery on every order</li>
        <li>Pay on delivery</li>
        <li>7-day returns</li>
      </ul>

      <div className="tx-pdp__details">
        {description && (
          <details open>
            <summary>Description</summary>
            <div className="tx-pdp__rte"><p>{description}</p></div>
          </details>
        )}
        <details>
          <summary>Product details</summary>
          <dl className="tx-pdp__specs">
            {category && <div><dt>Type</dt><dd>{category}</dd></div>}
            <div><dt>Compatible with</dt><dd>{model}</dd></div>
            <div><dt>Colour</dt><dd>{color}</dd></div>
          </dl>
        </details>
        <details>
          <summary>Shipping &amp; returns</summary>
          <div className="tx-pdp__rte"><p>Free delivery on every order. Pay on delivery. Easy 7-day returns.</p></div>
        </details>
      </div>
    </div>
  );
}
