import Link from "next/link";
import type { Metadata } from "next";
import { listProducts, listColors, getCatalog, CATEGORIES, SORTS, type SortKey } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";
import ShopFilters from "@/components/ShopFilters";

export const metadata: Metadata = { title: "Store" };
export const dynamic = "force-dynamic";

const TAGLINES: Record<string, string> = {
  minimal: "Quiet colours. Clean lines.",
  trendy: "Prints and patterns, fresh every week.",
  luxury: "Leather, chrome and statement finishes.",
  colorful: "Bright, bold and impossible to miss.",
};

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
    <div className="container-x pb-8 pt-14 md:pt-20">
      <header className="max-w-3xl">
        <h1 className="h-page">{category ? `${category.label}.` : "Store."} <span className="text-muted">{category ? TAGLINES[category.slug] : "The best way to buy the cases you love."}</span></h1>
        {data && <p className="mt-3 text-[15px] text-muted">{data.total} {data.total === 1 ? "case" : "cases"}{current.q ? ` for “${current.q}”` : ""}</p>}
      </header>

      <div className="mt-10"><ShopFilters current={current} colors={colors} models={models} /></div>

      {down ? (
        <div className="tile mt-14 p-12 text-center">
          <p className="text-[21px] font-semibold">The store is taking a moment.</p>
          <p className="mt-1 text-muted">We could not load the cases just now. Please try again.</p>
          <Link href="/shop" className="btn btn-blue mt-6">Try again</Link>
        </div>
      ) : data && data.items.length === 0 ? (
        <div className="tile mt-14 p-12 text-center">
          <p className="text-[21px] font-semibold">No cases match those filters.</p>
          <p className="mt-1 text-muted">Try removing a filter or searching for something else.</p>
          <Link href="/shop" className="btn btn-blue mt-6">Clear filters</Link>
        </div>
      ) : (
        <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
          {data?.items.map((p) => <li key={p.id}><ProductCard p={p} /></li>)}
        </ul>
      )}

      {data && data.pages > 1 && (
        <nav className="mt-16 flex items-center justify-center gap-8 text-[17px]" aria-label="Pagination">
          {data.page > 1 && <Link className="link" href={href(data.page - 1)}>‹ Previous</Link>}
          <span className="text-muted">Page {data.page} of {data.pages}</span>
          {data.page < data.pages && <Link className="link" href={href(data.page + 1)}>Next ›</Link>}
        </nav>
      )}
    </div>
  );
}
