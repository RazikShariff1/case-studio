import Link from "next/link";
import type { Metadata } from "next";
import { listProducts, listColors, SORTS, type SortKey } from "@/lib/catalog";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import { SITE } from "@/lib/site-assets";
import ShopFilters from "@/components/ShopFilters";

export const metadata: Metadata = { title: "Shop" };
export const dynamic = "force-dynamic";

const TAGLINES: Record<string, string> = {
  minimal: "Quiet colours, clean lines.",
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
  const [{ items, total, page, pages }, colors] = await Promise.all([
    listProducts({ ...current, min: num(current.min), max: num(current.max), sort, page: num(first(sp.page)) }),
    listColors(),
  ]);

  const href = (p: number) => {
    const q = new URLSearchParams();
    Object.entries({ ...current, page: String(p) }).forEach(([k, v]) => v && q.set(k, v));
    return `/shop?${q}`;
  };

  return (
    <div className="container-x py-8">
      <h1 className="text-3xl font-semibold tracking-tight">{current.category ? <span className="capitalize">{current.category}</span> : "All cases"}</h1>
      <p className="mt-1 text-sm text-muted">{total} {total === 1 ? "case" : "cases"}{current.q ? ` for “${current.q}”` : ""}</p>

      {current.category && current.category in SITE.collections && SITE.collections[current.category as keyof typeof SITE.collections] && (
        <div className="mt-5 grid h-44 grid-cols-[1fr_44%] items-center overflow-hidden rounded-3xl bg-tile md:h-60 md:grid-cols-[1fr_38%]">
          <div className="p-5 md:p-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-olive-2">Collection</p>
            <p className="mt-2 text-lg font-medium leading-snug tracking-tight md:text-3xl">{TAGLINES[current.category] ?? "Find your fit"}</p>
          </div>
          <div className="relative h-full">
            <Image src={SITE.collections[current.category as keyof typeof SITE.collections]!} alt="" fill priority sizes="(min-width:768px) 450px, 45vw" className="object-contain p-2 mix-blend-multiply md:p-4" />
          </div>
        </div>
      )}

      <div className="mt-6"><ShopFilters current={current} colors={colors} /></div>

      {items.length === 0 ? (
        <div className="mt-16 rounded-3xl bg-card p-12 text-center">
          <p className="text-lg font-semibold">No cases match those filters</p>
          <p className="mt-1 text-sm text-muted">Try removing a filter or searching for something else.</p>
          <Link href="/shop" className="btn btn-dark mt-5">Clear filters</Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {items.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-4 text-sm" aria-label="Pagination">
          {page > 1 && <Link className="btn btn-ghost" href={href(page - 1)}>← Previous</Link>}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages && <Link className="btn btn-ghost" href={href(page + 1)}>Next →</Link>}
        </nav>
      )}
    </div>
  );
}
