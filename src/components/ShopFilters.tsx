"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CATEGORIES, PHONE_MODELS, SORTS } from "@/lib/catalog-constants";

type Props = {
  current: Record<string, string | undefined>;
  colors: { color: string; colorHex: string }[];
  models: string[];
};

/** The sticky filter bar under the page title: categories as text links, the rest as quiet selects. */
export default function ShopFilters({ current, colors, models }: Props) {
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
  const modelList = models.length ? models : [...PHONE_MODELS];

  return (
    <div className="space-y-6">
      <ul className="no-scrollbar -mx-[22px] flex gap-7 overflow-x-auto px-[22px] text-[17px]" aria-label="Categories">
        {[{ slug: undefined, label: "All" }, ...CATEGORIES].map((c) => {
          const on = current.category === c.slug;
          return (
            <li key={c.label}>
              <button onClick={() => go({ category: c.slug })} aria-pressed={on} className={`whitespace-nowrap border-b-2 pb-1.5 transition ${on ? "border-ink font-semibold text-ink" : "border-transparent text-muted hover:text-ink"}`}>{c.label}</button>
            </li>
          );
        })}
      </ul>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <form onSubmit={submit} role="search" className="col-span-2 md:col-span-1">
          <label className="label" htmlFor="f-q">Search</label>
          <input id="f-q" className="input !h-11 !text-[15px]" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cases" onBlur={() => q.trim() !== (current.q ?? "") && go({ q: q.trim() || undefined })} />
        </form>
        <div>
          <label className="label" htmlFor="f-model">Phone</label>
          <select id="f-model" className="input !h-11 !text-[15px]" value={current.model ?? ""} onChange={(e) => go({ model: e.target.value || undefined })}>
            <option value="">All phones</option>
            {modelList.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-sort">Sort</label>
          <select id="f-sort" className="input !h-11 !text-[15px]" value={current.sort ?? "featured"} onChange={(e) => go({ sort: e.target.value })}>
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-min">Min price (₹)</label>
          <input id="f-min" type="number" min="0" inputMode="numeric" className="input !h-11 !text-[15px]" defaultValue={current.min} onBlur={(e) => e.target.value !== (current.min ?? "") && go({ min: e.target.value || undefined })} />
        </div>
        <div>
          <label className="label" htmlFor="f-max">Max price (₹)</label>
          <input id="f-max" type="number" min="0" inputMode="numeric" className="input !h-11 !text-[15px]" defaultValue={current.max} onBlur={(e) => e.target.value !== (current.max ?? "") && go({ max: e.target.value || undefined })} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <span className="label !mb-0 mr-1">Colour</span>
        {colors.map((c) => (
          <button key={c.color} title={c.color} aria-label={c.color} aria-pressed={current.color === c.color}
            onClick={() => go({ color: current.color === c.color ? undefined : c.color })}
            className={`h-7 w-7 rounded-full border border-black/15 ring-offset-2 transition ${current.color === c.color ? "ring-2 ring-blue" : "hover:scale-110"}`}
            style={{ background: c.colorHex }} />
        ))}
        {active && <button onClick={() => { setQ(""); router.push("/shop"); }} className="link ml-2 text-[14px]">Clear filters</button>}
      </div>
    </div>
  );
}
