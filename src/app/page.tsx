import Image from "next/image";
import Link from "next/link";
import { listProducts, CATEGORIES } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";
import MiniCard from "@/components/MiniCard";
import { SITE } from "@/lib/site-assets";

export const dynamic = "force-dynamic";

const TRUST = [
  { t: "Premium Quality", s: "Built to last", d: "M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" },
  { t: "Drop Protection", s: "Up to 10 ft", d: "M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12 4 7.5" },
  { t: "Trendy Designs", s: "New drops weekly", d: "M12 3l2.5 6 6.5.5-5 4.3 1.6 6.4L12 16.8 6.4 20.2 8 13.8 3 9.5 9.5 9 12 3z" },
  { t: "Easy Returns", s: "30-day window", d: "M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5" },
];

const CAT_IMG: Record<string, { src: string; position: string }> = SITE.categories;

export default async function Home() {
  const { items } = await listProducts({ sort: "featured" });
  const picks = items.slice(0, 8);

  return (
    <>
      {/* Hero — mobile: full-screen app-style screen */}
      <section className="hero-mobile relative isolate flex min-h-[calc(100svh-var(--tabs-h))] flex-col overflow-hidden md:hidden">
        <div className="px-5 pt-5">
          <p className="flex items-baseline leading-none" aria-hidden>
            <span className="text-[64px] font-medium tracking-tighter text-ink">Case</span>
            <span className="-translate-y-5 text-2xl text-ink">✦</span>
          </p>
          <p className="-mt-1 ml-[88px] text-lg text-ink/60" aria-hidden>Studio</p>
        </div>

        <div className="hero-art pointer-events-none absolute -right-[6%] top-[15%] -z-10 h-[50%] w-[78%]">
          <Image src={SITE.heroMobile.src} alt={SITE.heroMobile.alt} fill priority sizes="80vw" style={{ objectPosition: SITE.heroMobile.position }} className="object-cover" />
        </div>

        <div className="relative mt-10 px-5">
          <h1 className="text-[44px] font-medium leading-[1.08] tracking-tight text-white [text-shadow:0_1px_18px_rgba(40,38,28,.25)]">Style<br />That<br />Protects.</h1>
          <p className="mt-5 max-w-[190px] text-[13px] leading-snug text-white/90 [text-shadow:0_1px_10px_rgba(40,38,28,.3)]">Premium phone cases for every style and lifestyle.</p>
          <Link href="/shop" className="mt-8 inline-flex items-center gap-3 rounded-full bg-olive py-2 pl-6 pr-2 text-[15px] font-medium text-white shadow-lg">
            Shop Now <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-cream text-ink">→</span>
          </Link>
        </div>

        <div className="relative mt-auto p-4">
          <div className="rounded-[28px] bg-card/95 p-5 shadow-xl backdrop-blur">
            <div className="grid grid-cols-4 gap-2 text-center">
              {TRUST.map((x) => (
                <div key={x.t} className="flex flex-col items-center gap-2">
                  <svg className="h-6 w-6 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"><path d={x.d} /></svg>
                  <span className="text-[10.5px] font-medium leading-tight text-ink">{x.t}</span>
                </div>
              ))}
            </div>
            <p className="mb-3 mt-5 text-[13px] font-medium">Loved by Thousands</p>
            <div className="flex items-center">
              <div className="flex -space-x-2.5" aria-hidden>
                {[["#b9a48e", "A"], ["#8e9a7a", "R"], ["#c9a0a0", "M"], ["#7d8ea3", "S"], ["#d1b27a", "K"]].map(([c, l]) => (
                  <span key={c} className="grid h-11 w-11 place-items-center rounded-full border-2 border-card text-sm font-semibold text-white" style={{ background: c }}>{l}</span>
                ))}
              </div>
              <p className="ml-3 leading-tight"><b className="block text-lg">2K+</b><span className="text-[11px] text-muted">Reviews</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Browse — mobile app screen */}
      <section className="px-5 pb-4 pt-7 md:hidden" aria-labelledby="m-browse">
        <h2 id="m-browse" className="text-[22px] font-semibold tracking-tight">Browse Collections</h2>

        <Link href="/shop?category=minimal" className="relative isolate mt-5 block h-[230px] overflow-hidden rounded-3xl bg-gradient-to-br from-[#6d725e] to-[#3b402f]">
          <div className="banner-art pointer-events-none absolute inset-y-0 -right-6 w-[68%]">
            <Image src={SITE.bannerMobile.src} alt={SITE.bannerMobile.alt} fill sizes="70vw" style={{ objectPosition: SITE.bannerMobile.position }} className="object-cover" />
          </div>
          <div className="relative p-6">
            <p className="text-[10px] text-white/60">New Arrivals</p>
            <h3 className="mt-3 text-[26px] font-medium leading-[1.12] tracking-tight text-white">Bold Styles.<br />Better<br />Protection.</h3>
            <span className="mt-6 inline-flex rounded-full bg-cream px-5 py-2.5 text-[13px] font-medium text-ink">Shop Now</span>
          </div>
        </Link>

        <div className="mb-3 mt-7 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold">Categories</h3>
          <Link href="/shop" className="text-xs text-muted">Show All</Link>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/shop?category=${c.slug}`} className="text-center">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-tile">
                <Image src={CAT_IMG[c.slug].src} alt="" fill sizes="25vw" className="object-contain p-2 mix-blend-multiply" />
              </div>
              <span className="mt-2 block text-[11px] font-medium">{c.label}</span>
            </Link>
          ))}
        </div>

        <div className="mb-3 mt-7 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold">Popular Picks</h3>
          <Link href="/shop" className="text-xs text-muted">Show All</Link>
        </div>
        <div className="no-scrollbar -mx-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-1">
          {picks.map((p) => <MiniCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* Hero — desktop */}
      <section className="hidden bg-sage md:block">
        <div className="container-x grid items-center gap-8 py-10 md:grid-cols-2 md:py-16">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-olive-2">New season · MagSafe ready</p>
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">Style<br />That<br />Protects.</h1>
            <p className="mt-5 max-w-md text-muted">Premium phone cases for every style and lifestyle. Drop-tested, beautifully made, delivered fast.</p>
            <Link href="/shop" className="btn btn-dark mt-7">Shop Now <span aria-hidden>→</span></Link>
            <div className="mt-8 flex items-center gap-3 text-sm">
              <div className="flex -space-x-2" aria-hidden>
                {["#b9a48e", "#8e9a7a", "#c9a0a0", "#7d8ea3", "#d1b27a"].map((c) => (
                  <i key={c} className="h-8 w-8 rounded-full border-2 border-sage" style={{ background: c }} />
                ))}
              </div>
              <p><strong>Loved by thousands</strong><br /><span className="text-muted">4.8 ★ from 2K+ reviews</span></p>
            </div>
          </div>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] shadow-xl">
            <Image src={SITE.heroDesktop.src} alt={SITE.heroDesktop.alt} fill priority sizes="(min-width:768px) 450px, 90vw" style={{ objectPosition: SITE.heroDesktop.position }} className="object-cover" />
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="container-x relative z-10 -mt-6 hidden md:block">
        <div className="grid grid-cols-2 gap-4 rounded-3xl bg-card p-5 shadow-sm md:grid-cols-4 md:p-6">
          {TRUST.map((x) => (
            <div key={x.t} className="flex items-center gap-3">
              <svg className="h-7 w-7 shrink-0 text-olive-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"><path d={x.d} /></svg>
              <div className="text-sm leading-tight"><b className="block">{x.t}</b><span className="text-muted">{x.s}</span></div>
            </div>
          ))}
        </div>
      </section>

      {/* Collections */}
      <section className="container-x mt-14 hidden md:block">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Browse Collections</h2>
          <Link href="/shop" className="text-sm text-muted hover:text-ink">Show all</Link>
        </div>
        <Link href="/shop?category=trendy" className="relative block aspect-[2/1] overflow-hidden rounded-3xl bg-tile">
          <Image src={SITE.bannerWide.src} alt={SITE.bannerWide.alt} fill sizes="(min-width:1200px) 1160px, 100vw" className="object-contain mix-blend-multiply" />
        </Link>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/shop?category=${c.slug}`} className="group relative aspect-[5/4] overflow-hidden rounded-3xl bg-tile">
              <Image src={CAT_IMG[c.slug].src} alt="" fill sizes="25vw" className="object-contain p-3 mix-blend-multiply transition duration-500 group-hover:scale-105" />
              <span className="absolute inset-x-3 bottom-3 rounded-full bg-cream/90 px-4 py-2 text-center text-sm font-semibold backdrop-blur">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular */}
      <section className="container-x mt-14 hidden md:block">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Popular Picks</h2>
          <Link href="/shop" className="text-sm text-muted hover:text-ink">Show all</Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {picks.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* Motion */}
      <section className="container-x mt-16">
        <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] bg-olive text-white md:grid-cols-2">
          {SITE.showcaseVideo.src ? (
            <video src={SITE.showcaseVideo.src} poster={SITE.showcaseVideo.poster} autoPlay muted loop playsInline className="aspect-[4/5] max-h-[560px] w-full object-cover" />
          ) : (
            <div className="relative aspect-[4/5] max-h-[560px] w-full"><Image src={SITE.showcaseVideo.poster} alt="" fill sizes="50vw" className="object-cover" /></div>
          )}
          <div className="p-7 md:p-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-sage">Bold styles. Better protection.</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Frosted, magnetic, made to be touched.</h2>
            <p className="mt-4 text-white/75">A soft-touch translucent back, raised camera guard and a built-in MagSafe ring in calm colours.</p>
            <Link href="/product/frosted-magsafe-case" className="btn mt-7 bg-cream text-ink hover:bg-white">Shop Frosted <span aria-hidden>→</span></Link>
          </div>
        </div>
      </section>
    </>
  );
}
