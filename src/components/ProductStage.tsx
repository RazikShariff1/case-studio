"use client";

import { useRef, useState, type ComponentProps } from "react";
import Image from "next/image";
import ProductBuy from "@/components/ProductBuy";

type Props = {
  name: string;
  images: string[];
  description: string;
  category: string;
  buy: Omit<ComponentProps<typeof ProductBuy>, "description" | "category">;
};

/** The top of a product page, as in the Shopify theme: a thumbnail rail and one large photo on the left, the buying column on the right. */
export default function ProductStage({ name, images, description, category, buy }: Props) {
  const [i, setI] = useState(0);
  const touch = useRef<number | null>(null);
  const go = (n: number) => setI(Math.max(0, Math.min(images.length - 1, n)));

  return (
    <div className="tx-pdp__inner">
      <div className="tx-pdp__grid">
        <div className="tx-pdp__gallery">
          {images.length > 1 && (
            <div className="tx-pdp__thumbs" role="tablist" aria-label="Product photos">
              {images.map((src, n) => (
                <button key={src} type="button" role="tab" aria-selected={n === i} aria-label={`Photo ${n + 1}`} className={`tx-pdp__thumb${n === i ? " is-on" : ""}`} onClick={() => go(n)}>
                  <Image src={src} alt="" width={96} height={120} sizes="72px" />
                </button>
              ))}
            </div>
          )}
          <div className="tx-pdp__stage" tabIndex={0} aria-label="Product photos, use arrow keys to browse"
            onKeyDown={(e) => { if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); }}
            onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => { if (touch.current != null) { const d = e.changedTouches[0].clientX - touch.current; if (Math.abs(d) > 40) go(i + (d < 0 ? 1 : -1)); touch.current = null; } }}>
            <div className="tx-pdp__slide">
              <Image key={images[i]} src={images[i]} alt={name} fill priority sizes="(min-width: 990px) 55vw, 100vw" className="tx-pdp__img" />
            </div>
            {images.length > 1 && (
              <>
                <button type="button" className="tx-pdp__arrow tx-pdp__arrow--prev" aria-label="Previous photo" disabled={i <= 0} onClick={() => go(i - 1)}>
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button type="button" className="tx-pdp__arrow tx-pdp__arrow--next" aria-label="Next photo" disabled={i >= images.length - 1} onClick={() => go(i + 1)}>
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </>
            )}
          </div>
        </div>
        <div className="tx-pdp__info">
          <ProductBuy {...buy} description={description} category={category} />
        </div>
      </div>
    </div>
  );
}
