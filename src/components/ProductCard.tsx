import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/money";
import type { ProductListItem } from "@/lib/catalog";

/** A product on a soft grey tile: photo, name, price, colours. Used in grids and in sliding rows. */
export default function ProductCard({ p, className = "" }: { p: ProductListItem; className?: string }) {
  const off = p.compareAtCents ? Math.round((1 - p.priceCents / p.compareAtCents) * 100) : 0;
  return (
    <Link href={`/product/${p.slug}`} className={`group block ${className}`}>
      <div className="tile relative aspect-[4/5] overflow-hidden">
        <Image src={p.image} alt={p.name} fill sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 70vw" className="object-contain p-6 mix-blend-multiply transition duration-700 ease-out group-hover:scale-[1.04]" style={{ objectPosition: p.imagePosition }} />
        {off > 0 && <span className="absolute left-4 top-4 rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-danger">Save {off}%</span>}
      </div>
      <div className="px-1 pt-4">
        <div className="mb-2 flex gap-1.5" aria-label={`${p.swatches.length} colours`}>
          {p.swatches.slice(0, 6).map((s) => <span key={s.color} title={s.color} className="h-3 w-3 rounded-full border border-black/15" style={{ background: s.hex }} />)}
          {p.swatches.length > 6 && <span className="fine leading-3">+{p.swatches.length - 6}</span>}
        </div>
        <h3 className="text-[19px] font-semibold leading-tight tracking-tight">{p.name}</h3>
        <p className="mt-1 text-[14px] text-muted">From {formatPrice(p.priceCents)}{p.compareAtCents && <span className="ml-2 line-through opacity-70">{formatPrice(p.compareAtCents)}</span>}</p>
      </div>
    </Link>
  );
}
