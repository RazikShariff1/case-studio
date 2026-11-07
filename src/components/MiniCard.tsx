import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/money";
import type { ProductListItem } from "@/lib/catalog";

/** Compact card for horizontal scrolling rows on mobile. */
export default function MiniCard({ p }: { p: ProductListItem }) {
  return (
    <Link href={`/product/${p.slug}`} className="block w-[38vw] max-w-[180px] shrink-0 snap-start">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-tile">
        <Image src={p.image} alt={p.name} fill sizes="40vw" className="object-contain p-2.5 mix-blend-multiply" />
      </div>
      <h3 className="mt-2.5 truncate text-[12px] font-semibold">{p.name}</h3>
      <p className="mt-1 text-[12px] font-semibold">{formatPrice(p.priceCents)}</p>
      <p className="mt-0.5 text-[11px] text-muted"><span className="text-amber-600">{"★".repeat(Math.round(p.rating))}</span> {p.rating.toFixed(1)}</p>
    </Link>
  );
}
