"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CATEGORIES, PHONE_MODELS, SORTS } from "@/lib/catalog-constants";

type Props = {
  current: Record<string, string | undefined>;
  colors: { color: string; colorHex: string }[];
};

export default function ShopFilters({ current, colors }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(current.q ?? "");

  function go(patch: Record<string, string | undefined>) {
    const next = { ...current, ...patch, page: undefined };
    const sp = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => v && sp.set(k, v));
    router.push(`/shop${sp.size ? `?${sp}` : ""}`);
  }
  const submit = (e: FormEvent) => { e.preventDefault(); go({ q: q.trim() || undefined }); };
  const active = Object.entries(current).some(([k, v]) => v && k !== "sort");

  return (
    <div className="space-y-5">
      <form onSubmit={submit} role="search" className="relative">
        <input className="input pr-11" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cases…" aria-label="Search cases" />
        <button className="absolute right-1.5 top-1.5 grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-card" aria-label="Search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Chip on={!current.category} onClick={() => go({ category: undefined })}>All</Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.slug} on={current.category === c.slug} onClick={() => go({ category: c.slug })}>{c.label}</Chip>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label className="label" htmlFor="f-model">Phone model</label>
          <select id="f-model" className="input" value={current.model ?? ""} onChange={(e) => go({ model: e.target.value || undefined })}>
            <option value="">All models</option>
            {PHONE_MODELS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-sort">Sort by</label>
          <select id="f-sort" className="input" value={current.sort ?? "featured"} onChange={(e) => go({ sort: e.target.value })}>
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-min">Min price (₹)</label>
          <input id="f-min" type="number" min="0" className="input" defaultValue={current.min} onBlur={(e) => e.target.value !== (current.min ?? "") && go({ min: e.target.value || undefined })} />
        </div>
        <div>
          <label className="label" htmlFor="f-max">Max price (₹)</label>
          <input id="f-max" type="number" min="0" className="input" defaultValue={current.max} onBlur={(e) => e.target.value !== (current.max ?? "") && go({ max: e.target.value || undefined })} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="label mb-0 mr-1">Colour</span>
        {colors.map((c) => (
          <button key={c.color} title={c.color} aria-label={c.color} aria-pressed={current.color === c.color}
            onClick={() => go({ color: current.color === c.color ? undefined : c.color })}
            className={`h-7 w-7 rounded-full border border-black/10 ring-offset-2 ring-offset-cream transition ${current.color === c.color ? "ring-2 ring-olive" : ""}`}
            style={{ background: c.colorHex }} />
        ))}
        {active && <button onClick={() => { setQ(""); router.push("/shop"); }} className="ml-2 text-sm text-muted underline">Clear filters</button>}
      </div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={on}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${on ? "border-olive bg-olive text-white" : "border-line bg-card hover:bg-white"}`}>
      {children}
    </button>
  );
}
