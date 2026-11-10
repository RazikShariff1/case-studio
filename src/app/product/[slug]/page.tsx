import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct, relatedProducts, CATEGORIES } from "@/lib/catalog";
import ProductBuy from "@/components/ProductBuy";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug).catch(() => null);
  return { title: p?.name ?? "Product not found", description: p?.description };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();
  const related = await relatedProducts(p.category, p.id).catch(() => []);
  const category = CATEGORIES.find((c) => c.slug === p.category);

  return (
    <div>
      <div className="container-x pt-6">
        <nav className="text-[12px] text-muted" aria-label="Breadcrumb">
          <Link href="/shop" className="hover:text-ink">Store</Link>
          {category && <> <span aria-hidden>/</span> <Link href={`/shop?category=${category.slug}`} className="hover:text-ink">{category.label}</Link></>}
        </nav>
      </div>

      <div className="container-x mt-6 grid gap-10 md:grid-cols-[1.15fr_1fr] md:gap-16 lg:gap-24">
        <div className="md:sticky md:top-20 md:self-start">
          <div className="tile relative aspect-[4/5] overflow-hidden md:aspect-square">
            <Image src={p.image} alt={p.name} fill priority sizes="(min-width:768px) 600px, 100vw" className="object-contain p-8 mix-blend-multiply md:p-14" style={{ objectPosition: p.imagePosition }} />
          </div>
        </div>
        <div className="pb-4 md:pt-6">
          <ProductBuy name={p.name} rating={p.rating} reviewCount={p.reviewCount} variants={p.variants.map((v) => ({ id: v.id, model: v.model, color: v.color, colorHex: v.colorHex, stock: v.stock, priceCents: v.priceCents, compareAtCents: v.compareAtCents }))} />
        </div>
      </div>

      {/* Highlights: big words, the way Apple lists what matters. */}
      <section className="container-s mt-24 md:mt-32" aria-labelledby="highlights">
        <h2 id="highlights" className="h-section">Take a closer look.</h2>
        {p.description && <p className="h-sub mt-6 max-w-2xl text-muted">{p.description}</p>}
        {p.features.length > 0 && (
          <ul className="mt-10 grid gap-5 sm:grid-cols-3">
            {p.features.map((f) => (
              <li key={f} className="tile p-7"><p className="text-[21px] font-semibold leading-snug tracking-tight">{f}</p></li>
            ))}
          </ul>
        )}
        <p className="mt-8 text-[15px] text-muted">Free delivery on every order · Pay on delivery · 7-day returns</p>
      </section>

      {related.length > 0 && (
        <section className="container-x mt-24 md:mt-32" aria-labelledby="related">
          <h2 id="related" className="h-section">You might also like.</h2>
          <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
            {related.map((r) => <li key={r.id}><ProductCard p={r} /></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
