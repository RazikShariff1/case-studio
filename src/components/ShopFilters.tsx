"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES, PHONE_MODELS, SORTS } from "@/lib/catalog-constants";
import { formatPrice } from "@/lib/money";

type Props = {
  current: Record<string, string | undefined>;
  colors: { color: string; colorHex: string }[];
  models: string[];
  count: number;
  base?: string;
};

const Chevron = () => <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;

/** The theme's toolbar: filter pills that open small panels, the count and sort on the right, removable chips below. */
export default function ShopFilters({ current, colors, models, count, base }: Props) {
  const router = useRouter();
  const pn = usePathname();
  const path = base ?? pn;
  const root = useRef<HTMLDivElement>(null);
  const [min, setMin] = useState(current.min ?? "");
  const [max, setMax] = useState(current.max ?? "");
  useEffect(() => { setMin(current.min ?? ""); setMax(current.max ?? ""); }, [current.min, current.max]);

  const drops = () => Array.from(root.current?.querySelectorAll<HTMLDetailsElement>("details[data-drop]") ?? []);
  useEffect(() => {
    const click = (e: MouseEvent) => drops().forEach((d) => { if (d.open && !d.contains(e.target as Node)) d.open = false; });
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") drops().forEach((d) => (d.open = false)); };
    document.addEventListener("click", click); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("click", click); document.removeEventListener("keydown", key); };
  }, []);

  const hrefFor = (patch: Record<string, string | undefined>) => {
    const next = { ...current, ...patch, page: undefined };
    const sp = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => v && sp.set(k, v));
    return `${path}${sp.size ? `?${sp}` : ""}`;
  };
  const go = (patch: Record<string, string | undefined>) => router.push(hrefFor(patch));
  const modelList = models.length ? models : [...PHONE_MODELS];
  const catLabel = CATEGORIES.find((c) => c.slug === current.category)?.label;
  const priceOn = !!(current.min || current.max);

  const Pill = ({ label, active, badge }: { label: string; active: boolean; badge?: boolean }) => (
    <summary className={`tx-plp__pill${active ? " is-on" : ""}`}>{label}{badge && <span className="tx-plp__badge">1</span>}<Chevron /></summary>
  );
  const Option = ({ on, label, patch, swatch }: { on: boolean; label: string; patch: Record<string, string | undefined>; swatch?: string }) => (
    <li><Link className={`tx-plp__option${on ? " is-on" : ""}`} href={hrefFor(on ? Object.fromEntries(Object.keys(patch).map((k) => [k, undefined])) : patch)} rel="nofollow" scroll={false}>
      <span className="tx-plp__check" aria-hidden="true" />
      <span>{swatch && <i style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: swatch, border: "1px solid rgba(0,0,0,.15)", marginRight: 8 }} />}{label}</span>
    </Link></li>
  );

  const chips: { label: string; patch: Record<string, undefined> }[] = [];
  if (current.q) chips.push({ label: `“${current.q}”`, patch: { q: undefined } });
  if (catLabel) chips.push({ label: catLabel, patch: { category: undefined } });
  if (current.model) chips.push({ label: current.model, patch: { model: undefined } });
  if (current.color) chips.push({ label: current.color, patch: { color: undefined } });
  if (priceOn) chips.push({ label: `${formatPrice(Number(current.min || 0) * 100)} – ${current.max ? formatPrice(Number(current.max) * 100) : "any"}`, patch: { min: undefined, max: undefined } });

  return (
    <div ref={root}>
      <div className="tx-plp__toolbar">
        <div className="tx-plp__filters">
          <details className="tx-plp__drop" data-drop>
            <Pill label="Style" active={!!current.category} badge={!!current.category} />
            <div className="tx-plp__panel"><ul className="tx-plp__options" role="list">{CATEGORIES.map((c) => <Option key={c.slug} on={current.category === c.slug} label={c.label} patch={{ category: c.slug }} />)}</ul></div>
          </details>
          <details className="tx-plp__drop" data-drop>
            <Pill label="Phone" active={!!current.model} badge={!!current.model} />
            <div className="tx-plp__panel"><ul className="tx-plp__options" role="list">{modelList.map((m) => <Option key={m} on={current.model === m} label={m} patch={{ model: m }} />)}</ul></div>
          </details>
          <details className="tx-plp__drop" data-drop>
            <Pill label="Colour" active={!!current.color} badge={!!current.color} />
            <div className="tx-plp__panel"><ul className="tx-plp__options" role="list">{colors.map((c) => <Option key={c.color} on={current.color === c.color} label={c.color} swatch={c.colorHex} patch={{ color: c.color }} />)}</ul></div>
          </details>
          <details className="tx-plp__drop" data-drop>
            <Pill label="Price" active={priceOn} />
            <div className="tx-plp__panel">
              <form className="tx-plp__price" onSubmit={(e) => { e.preventDefault(); go({ min: min || undefined, max: max || undefined }); }}>
                <label><span>Min</span><input type="number" min="0" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} placeholder="0" /></label>
                <label><span>Max</span><input type="number" min="0" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} placeholder="Any" /></label>
                <button type="submit" className="tx-plp__apply">Apply</button>
              </form>
            </div>
          </details>
        </div>
        <div className="tx-plp__end">
          <p className="tx-plp__count">{count} {count === 1 ? "case" : "cases"}</p>
          <label className="tx-plp__sort">
            <span className="visually-hidden">Sort by</span>
            <select aria-label="Sort by" value={current.sort ?? "featured"} onChange={(e) => go({ sort: e.target.value })}>
              {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <Chevron />
          </label>
        </div>
      </div>
      {chips.length > 0 && (
        <div className="tx-plp__chips">
          {chips.map((c) => <Link key={c.label} className="tx-plp__chip" href={hrefFor(c.patch)} scroll={false}>{c.label} <span aria-hidden="true">×</span></Link>)}
          <Link className="tx-plp__clear" href={current.sort ? `${path}?sort=${current.sort}` : path} scroll={false}>Clear all</Link>
        </div>
      )}
    </div>
  );
}
