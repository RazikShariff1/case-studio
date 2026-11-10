"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/money";
import { PHONE_MODELS } from "@/lib/catalog-constants";

type V = { id: string; model: string; color: string; colorHex: string; stock: number; priceCents: number; compareAtCents: number | null };
type Props = { name: string; rating: number; reviewCount: number; variants: V[] };

/** The buying steps: choose a phone, choose a colour, add to bag. The price follows the selection. */
export default function ProductBuy({ name, rating, reviewCount, variants }: Props) {
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
  }

  return (
    <div>
      <p className="eyebrow">{variants.length > 1 ? "Buy" : "Shop"}</p>
      <h1 className="h-page mt-1">{name}</h1>
      <p className="mt-2 flex items-center gap-2 text-[14px] text-muted">
        <span className="text-ink" aria-hidden>{"★".repeat(Math.round(rating))}<span className="text-ink/20">{"★".repeat(5 - Math.round(rating))}</span></span>
        <span>{rating.toFixed(1)} · {reviewCount.toLocaleString("en-IN")} reviews</span>
      </p>
      <p className="mt-4 text-[21px] font-semibold">
        {formatPrice(selected?.priceCents ?? 0)}
        {selected?.compareAtCents && <span className="ml-3 text-[17px] font-normal text-muted line-through">{formatPrice(selected.compareAtCents)}</span>}
      </p>

      <fieldset className="mt-10">
        <legend className="text-[24px] font-semibold leading-tight tracking-tight">Choose your phone. <span className="text-muted">Which one is it for?</span></legend>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {models.map((m) => {
            const on = model === m;
            const any = variants.some((v) => v.model === m && v.stock > 0);
            return (
              <button key={m} type="button" aria-pressed={on} onClick={() => pickModel(m)}
                className={`flex items-center justify-between rounded-2xl border px-5 py-4 text-left transition ${on ? "border-blue ring-1 ring-blue" : "border-line hover:border-ink/40"}`}>
                <span className="text-[17px] font-semibold">{m}</span>
                {!any && <span className="text-[12px] text-muted">Sold out</span>}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-10">
        <legend className="text-[24px] font-semibold leading-tight tracking-tight">Choose your colour. <span className="text-muted">{color}</span></legend>
        <div className="mt-5 flex flex-wrap gap-4">
          {colors.map(([c, hex]) => {
            const v = find(model, c);
            const on = color === c;
            return (
              <button key={c} type="button" disabled={!v} aria-label={`${c}${v && v.stock <= 0 ? " (sold out)" : ""}`} aria-pressed={on}
                onClick={() => { setColor(c); setQty(1); setMsg(null); }}
                className={`grid h-14 w-14 place-items-center rounded-full border-2 transition disabled:opacity-25 ${on ? "border-blue" : "border-transparent hover:border-ink/20"}`}>
                <span className={`block h-10 w-10 rounded-full border border-black/15 ${v && v.stock <= 0 ? "opacity-40" : ""}`} style={{ background: hex }} />
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-10 flex items-center gap-5">
        <div className="flex items-center rounded-full bg-surface">
          <button type="button" className="h-11 w-11 text-[22px] leading-none" aria-label="Fewer" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span className="w-8 text-center text-[17px] font-semibold" aria-live="polite">{qty}</span>
          <button type="button" className="h-11 w-11 text-[22px] leading-none" aria-label="More" disabled={qty >= maxQty} onClick={() => setQty((q) => Math.min(maxQty, q + 1))}>+</button>
        </div>
        <p className={`text-[14px] ${stock > 0 && stock <= 5 ? "text-danger" : "text-muted"}`}>{stock <= 0 ? "Sold out" : stock <= 5 ? `Only ${stock} left` : "In stock"}</p>
      </div>

      {/* On phones the button stays at the bottom of the screen with the price, as on apple.com. */}
      <div className="sticky bottom-0 z-30 -mx-[22px] mt-6 border-t border-line bg-white/90 px-[22px] py-3 backdrop-blur-xl md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <button className="btn btn-blue btn-block" onClick={add} disabled={busy || stock <= 0}>
          {stock <= 0 ? "Sold out" : busy ? "Adding…" : `Add to Bag · ${formatPrice(total)}`}
        </button>
        <p role="status" className={`min-h-5 pt-2 text-center text-[14px] ${msg?.ok ? "text-good" : "text-danger"}`}>
          {msg?.text} {msg?.ok && <a href="/cart" className="link">View your bag</a>}
        </p>
      </div>
    </div>
  );
}
