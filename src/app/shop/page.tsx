import Link from "next/link";
import type { Metadata } from "next";
import { listProducts, listColors, getCatalog, CATEGORIES, SORTS, type SortKey } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";
import ShopFilters from "@/components/ShopFilters";

export const metadata: Metadata = { title: "All cases" };
export const dynamic = "force-dynamic";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v?: string) => (v && !Number.isNaN(Number(v)) ? Number(v) : undefined);

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const sp = await searchParams;
  const current = {
    q: first(sp.q)?.slice(0, 80), category: first(sp.category), model: first(sp.model), color: first(sp.color),
    min: first(sp.min), max: first(sp.max), sort: first(sp.sort),
  };
  const sort = current.sort && current.sort in SORTS ? (current.sort as SortKey) : undefined;

  let data: Awaited<ReturnType<typeof listProducts>> | null = null;
  let colors: Awaited<ReturnType<typeof listColors>> = [];
  let models: string[] = [];
  let down = false;
  try {
    [data, colors, models] = await Promise.all([
      listProducts({ ...current, min: num(current.min), max: num(current.max), sort, page: num(first(sp.page)) }),
      listColors(),
      getCatalog().then((c) => [...new Set(c.products.flatMap((p) => p.variants.map((v) => v.model)))]),
    ]);
  } catch {
    down = true;
  }

  const category = CATEGORIES.find((c) => c.slug === current.category);
  const href = (p: number) => {
    const q = new URLSearchParams();
    Object.entries({ ...current, page: String(p) }).forEach(([k, v]) => v && q.set(k, v));
    return `/shop?${q}`;
  };

  return (
    <section className="tx-plp tx-plp--no-head">
      <div className="tx-plp__inner">
        <h1 className="visually-hidden">{category ? category.label : "All cases"}</h1>
        <ShopFilters current={current} colors={colors} models={models} count={data?.total ?? 0} base="/shop" />

        {down ? (
          <div className="tx-plp__empty">
            <p className="tx-plp__empty-title">The store is taking a moment. Please try again.</p>
            <Link className="tx-landing__btn" href="/shop">Try again</Link>
          </div>
        ) : data && data.items.length === 0 ? (
          <div className="tx-plp__empty">
            <p className="tx-plp__empty-title">No cases match these filters.</p>
            <Link className="tx-landing__btn" href="/shop">Clear filters</Link>
          </div>
        ) : (
          <ul className="tx-plp__grid" role="list">
            {data?.items.map((p, i) => <li key={p.id}><ProductCard p={p} index={i} /></li>)}
          </ul>
        )}

        {data && data.pages > 1 && (
          <nav className="tx-plp__pages" aria-label="Pagination">
            {data.page > 1 && <Link className="tx-plp__page tx-plp__page--nav" href={href(data.page - 1)} aria-label="Previous page">←</Link>}
            {Array.from({ length: data.pages }, (_, i) => i + 1).map((n) =>
              n === data.page
                ? <span key={n} className="tx-plp__page is-on" aria-current="page">{n}</span>
                : <Link key={n} className="tx-plp__page" href={href(n)}>{n}</Link>)}
            {data.page < data.pages && <Link className="tx-plp__page tx-plp__page--nav" href={href(data.page + 1)} aria-label="Next page">→</Link>}
          </nav>
        )}
      </div>
    </section>
  );
}
