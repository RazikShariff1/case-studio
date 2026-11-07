import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/money";
import type { ProductListItem } from "@/lib/catalog";

export default function ProductCard({ p }: { p: ProductListItem }) {
  return (
    <Link href={`/product/${p.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-tile">
        <Image src={p.image} alt={p.name} fill sizes="(min-width:1024px) 25vw, 50vw"
          className="object-contain p-4 mix-blend-multiply transition duration-500 group-hover:scale-105" />
        {p.compareAtCents && (
          <span className="absolute left-3 top-3 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">
            −{Math.round((1 - p.priceCents / p.compareAtCents) * 100)}%
          </span>
        )}
      </div>
      <div className="px-1 pt-3">
        <h3 className="truncate text-sm font-semibold">{p.name}</h3>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-sm">
            <span className="font-semibold">{formatPrice(p.priceCents)}</span>
            {p.compareAtCents && <span className="ml-2 text-xs text-muted line-through">{formatPrice(p.compareAtCents)}</span>}
          </p>
          <p className="text-xs text-muted"><span className="text-amber-600">★</span> {p.rating.toFixed(1)}</p>
        </div>
        <div className="mt-2 flex gap-1">
          {p.swatches.slice(0, 5).map((s) => (
            <span key={s.color} title={s.color} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: s.hex }} />
          ))}
        </div>
      </div>
    </Link>
  );
}
