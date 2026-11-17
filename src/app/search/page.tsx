import Link from "next/link";
import type { Metadata } from "next";
import { listProducts, listColors, getCatalog, SORTS, type SortKey } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";
import ShopFilters from "@/components/ShopFilters";

export const metadata: Metadata = { title: "Search" };
export const dynamic = "force-dynamic";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v?: string) => (v && !Number.isNaN(Number(v)) ? Number(v) : undefined);

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const current = {
    q: first(sp.q)?.trim().slice(0, 80) || undefined, category: first(sp.category), model: first(sp.model), color: first(sp.color),
    min: first(sp.min), max: first(sp.max), sort: first(sp.sort),
  };
  const sort = current.sort && current.sort in SORTS ? (current.sort as SortKey) : undefined;
  const performed = !!current.q;

  let data: Awaited<ReturnType<typeof listProducts>> | null = null;
  let colors: Awaited<ReturnType<typeof listColors>> = [];
  let models: string[] = [];
  if (performed) {
    try {
      [data, colors, models] = await Promise.all([
        listProducts({ ...current, min: num(current.min), max: num(current.max), sort, page: num(first(sp.page)) }),
        listColors(),
        getCatalog().then((c) => [...new Set(c.products.flatMap((p) => p.variants.map((v) => v.model)))]),
      ]);
    } catch { /* shown as no results */ }
  }
  const href = (p: number) => {
    const q = new URLSearchParams();
    Object.entries({ ...current, page: String(p) }).forEach(([k, v]) => v && q.set(k, v));
    return `/search?${q}`;
  };

  return (
    <section className="tx-plp tx-srch">
      <div className="tx-plp__inner">
        <header className="tx-srch__head">
          <nav className="tx-plp__crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Search</span>
          </nav>
          <form action="/search" method="get" role="search" className="tx-srch__form">
            <label className="visually-hidden" htmlFor="Search-In-Template">Search</label>
            <span className="tx-srch__icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20"><circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m13 13 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </span>
            <input className="tx-srch__input" id="Search-In-Template" type="search" name="q" defaultValue={current.q} placeholder="Search cases, e.g. Stride, MagSafe, Clear" autoComplete="off" />
            <button type="submit" className="tx-srch__submit">Search</button>
          </form>
          {performed ? (
            <div className="tx-plp__title-row tx-srch__title-row">
              <h1 className="tx-srch__title"><span className="tx-srch__eyebrow">Results for</span> <span className="tx-srch__q">“{current.q}”</span></h1>
              <p className="tx-plp__count" role="status">{data?.total ?? 0} {data?.total === 1 ? "result" : "results"}</p>
            </div>
          ) : (
            <h1 className="tx-srch__title"><span className="tx-srch__q">Search</span></h1>
          )}
        </header>

        {performed && data && data.total > 0 && <ShopFilters current={current} colors={colors} models={models} count={data.total} base="/search" />}

        {performed && (!data || data.items.length === 0) ? (
          <div className="tx-plp__empty">
            <p className="tx-plp__empty-title">No results for “{current.q}”.</p>
            <Link className="tx-landing__btn" href="/shop">Browse all cases</Link>
          </div>
        ) : data ? (
          <ul className="tx-plp__grid" role="list">{data.items.map((p, i) => <li key={p.id}><ProductCard p={p} index={i} /></li>)}</ul>
        ) : null}

        {data && data.pages > 1 && (
          <nav className="tx-plp__pages" aria-label="Pagination">
            {data.page > 1 && <Link className="tx-plp__page tx-plp__page--nav" href={href(data.page - 1)} aria-label="Previous page">←</Link>}
            {Array.from({ length: data.pages }, (_, i) => i + 1).map((n) =>
              n === data.page ? <span key={n} className="tx-plp__page is-on" aria-current="page">{n}</span> : <Link key={n} className="tx-plp__page" href={href(n)}>{n}</Link>)}
            {data.page < data.pages && <Link className="tx-plp__page tx-plp__page--nav" href={href(data.page + 1)} aria-label="Next page">→</Link>}
          </nav>
        )}
      </div>
    </section>
  );
}
