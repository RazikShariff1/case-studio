import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct, relatedProducts } from "@/lib/catalog";
import ProductBuy from "@/components/ProductBuy";
import { BackButton, HeartButton } from "@/components/PdpButtons";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  return { title: p?.name ?? "Product not found", description: p?.description };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();
  const related = await relatedProducts(p.category, p.id);

  return (
    <div className="pdp md:py-8">
      <div className="md-container">
        <nav className="mb-5 hidden text-sm text-muted md:block" aria-label="Breadcrumb">
          <Link href="/shop" className="hover:text-ink">Shop</Link> / <Link href={`/shop?category=${p.category}`} className="capitalize hover:text-ink">{p.category}</Link>
        </nav>

        <div className="md:grid md:grid-cols-2 md:gap-10 lg:gap-14">
          <div className="relative h-[44svh] min-h-[300px] bg-tile md:sticky md:top-24 md:aspect-square md:h-auto md:min-h-0 md:self-start md:overflow-hidden md:rounded-[2rem]">
            <Image src={p.image} alt={p.name} fill priority sizes="(min-width:768px) 560px, 100vw" className="object-contain px-8 pb-10 pt-16 mix-blend-multiply md:p-10" />
            <div className="absolute inset-x-4 top-4 flex justify-between md:hidden">
              <BackButton />
              <HeartButton slug={p.slug} />
            </div>
          </div>

          <div className="relative -mt-8 rounded-t-[2rem] bg-card px-5 pb-6 pt-6 shadow-[0_-12px_30px_rgba(0,0,0,.06)] md:mt-0 md:bg-transparent md:p-0 md:shadow-none">
            <ProductBuy
              name={p.name}
              priceCents={p.priceCents}
              compareAtCents={p.compareAtCents}
              rating={p.rating}
              reviewCount={p.reviewCount}
              slug={p.slug}
              variants={p.variants.map((v) => ({ id: v.id, model: v.model, color: v.color, colorHex: v.colorHex, stock: v.stock }))}
            />

            <p className="mt-6 text-sm text-muted">{p.description}</p>
            <ul className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
              {p.features.map((f) => <li key={f} className="flex gap-2"><span className="text-olive-2">✓</span>{f}</li>)}
              <li className="flex gap-2"><span className="text-olive-2">✓</span>Free shipping over ₹999 · 7-day easy returns</li>
            </ul>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="md-container mt-10 px-5 md:mt-16">
          <h2 className="mb-5 text-2xl font-semibold tracking-tight">You may also like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
            {related.map((r) => <ProductCard key={r.id} p={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}
