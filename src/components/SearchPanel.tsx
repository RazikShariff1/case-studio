"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { ProductListItem } from "@/lib/catalog";

type Result = { items: ProductListItem[]; total: number; page: number; pages: number };

const TRENDING: [string, string][] = [["iPhone 18 Pro", "iphone 18 pro"], ["MagSafe", "magsafe"], ["Clear case", "clear"], ["Stride 3.0", "stride"], ["Bundle", "bundle"]];
const CATS: [string, string][] = [["Minimal", "minimal"], ["Trendy", "trendy"], ["Luxury", "luxury"], ["Colorful", "colorful"]];

async function find(q: string, page = 1, signal?: AbortSignal): Promise<Result> {
  const res = await fetch(`/api/products?q=${encodeURIComponent(q)}&page=${page}`, { signal });
  if (!res.ok) throw new Error("search failed");
  return res.json();
}

/** The theme's search panel (snippets/header-search + tx-search-panel.js): opens under the header with trending searches, categories, bestsellers, and live results while typing. */
export default function SearchPanel({ open, onClose, top = 48 }: { open: boolean; onClose: () => void; top?: number }) {
  const [q, setQ] = useState("");
  const [label, setLabel] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [best, setBest] = useState<ProductListItem[] | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const input = useRef<HTMLInputElement>(null);
  const ctl = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    input.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", key);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", key); };
  }, [open, onClose]);

  // Bestsellers and category pictures on first open.
  useEffect(() => {
    if (!open || best) return;
    find("").then((r) => setBest([...r.items].slice(0, 8))).catch(() => setBest([]));
    CATS.forEach(([, term]) => {
      fetch(`/api/products?category=${term}`).then((r) => r.json()).then((r: Result) => {
        const src = r.items?.[0]?.images?.[0];
        if (src) setThumbs((t) => ({ ...t, [term]: src }));
      }).catch(() => {});
    });
  }, [open, best]);

  function run(query: string, shown?: string) {
    clearTimeout(timer.current);
    ctl.current?.abort();
    const term = query.trim();
    setLabel(shown ?? term);
    if (!term) { setRes(null); setItems([]); setBusy(false); return; }
    const c = new AbortController();
    ctl.current = c;
    setBusy(true); setError(false);
    find(term, 1, c.signal).then((r) => { setRes(r); setItems(r.items); setBusy(false); })
      .catch((e) => { if (e.name !== "AbortError") { setError(true); setBusy(false); } });
  }
  async function more() {
    if (!res) return;
    setBusy(true);
    try {
      const r = await find(q, res.page + 1);
      setRes(r); setItems((i) => [...i, ...r.items]);
    } catch { setError(true); }
    setBusy(false);
  }
  const pick = (query: string, shown: string) => { setQ(shown); run(query, shown); input.current?.blur(); };
  const typing = q.trim().length > 0;

  if (!open) return null;
  return (
    <div className="tx-sp" style={{ ["--tx-sp-top" as string]: `${top}px` }} role="dialog" aria-modal="true" aria-label="Search">
      <div className={`tx-sp__panel${busy ? " is-loading" : ""}${scrolled ? " is-scrolled" : ""}`} tabIndex={-1}>
        <div className="tx-sp__top">
          <div className="tx-sp__inner tx-sp__bar">
            <button type="button" className="tx-sp__close" aria-label="Close" onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" /></svg>
            </button>
            <form className="tx-sp__form" role="search" onSubmit={(e) => { e.preventDefault(); run(q); input.current?.blur(); }} onReset={() => { setQ(""); run(""); setTimeout(() => input.current?.focus(), 0); }}>
              <svg className="tx-sp__glass" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>
              <input ref={input} className="tx-sp__input" type="search" name="q" value={q} placeholder="Search cases" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                onChange={(e) => { setQ(e.target.value); clearTimeout(timer.current); timer.current = setTimeout(() => run(e.target.value), 260); }} />
              {typing && <button type="reset" className="tx-sp__clear" aria-label="Clear">Clear</button>}
            </form>
          </div>
        </div>
        <div className="tx-sp__body" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}>
          <div className="tx-sp__inner">
            {!typing ? (
              <div className="tx-sp__idle">
                <section className="tx-sp__block">
                  <h2 className="tx-sp__h">Trending searches</h2>
                  <ul className="tx-sp__chips" role="list">
                    {TRENDING.map(([l, t]) => <li key={t}><button type="button" className="tx-sp__chip" onClick={() => pick(t, l)}>{l}</button></li>)}
                  </ul>
                </section>
                <section className="tx-sp__block">
                  <h2 className="tx-sp__h">Top categories</h2>
                  <ul className="tx-sp__cats" role="list">
                    {CATS.map(([l, t]) => (
                      <li key={t}>
                        <a className="tx-sp__cat" href={`/shop?category=${t}`} onClick={onClose}>
                          <span className="tx-sp__cat-img">{thumbs[t] ? <Image src={thumbs[t]} alt="" width={180} height={180} sizes="120px" /> : <span className="tx-sp__cat-ph" />}</span>
                          <span className="tx-sp__cat-name">{l}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="tx-sp__block">
                  <div className="tx-sp__h-row"><h2 className="tx-sp__h">Bestsellers</h2></div>
                  {best === null ? (
                    <ul className="tx-sp__skeleton" role="list" aria-hidden="true"><li /><li /><li /><li /></ul>
                  ) : (
                    <div className="tx-sp-res"><ul className="tx-plp__grid tx-sp-res__grid" role="list">{best.map((p, i) => <li key={p.id} onClick={onClose}><ProductCard p={p} index={i} /></li>)}</ul></div>
                  )}
                </section>
              </div>
            ) : (
              <div className="tx-sp__live">
                <div className="tx-sp__results" aria-live="polite">
                  <div className="tx-sp-res">
                    {error ? <p className="tx-sp-res__count">Something went wrong. Please try again.</p> : res && (
                      <>
                        <div className="tx-sp-res__head">
                          <p className="tx-sp-res__count" role="status">
                            {res.total > 0 ? <>{res.total} result{res.total !== 1 ? "s" : ""} for <span>“{label}”</span></> : <>No results for <span>“{label}”</span></>}
                          </p>
                        </div>
                        {res.total > 0 ? (
                          <>
                            <ul className="tx-plp__grid tx-sp-res__grid" role="list">{items.map((p, i) => <li key={p.id} onClick={onClose}><ProductCard p={p} index={i} /></li>)}</ul>
                            {res.page < res.pages && <div className="tx-sp-res__more"><button type="button" className="tx-sp__chip tx-sp__chip--more" disabled={busy} onClick={more}>{busy ? "Loading…" : "Show more"}</button></div>}
                          </>
                        ) : (
                          <div className="tx-sp-res__empty"><p>Try a different word, or check the spelling. Searching for a phone model or a style (like “clear” or “minimal”) works best.</p></div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
