import Image from "next/image";
import Link from "next/link";
import { listProducts, CATEGORIES } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";
import { SITE } from "@/lib/site-assets";

export const dynamic = "force-dynamic";

const TAGLINES: Record<string, string> = {
  minimal: "Quiet colours. Clean lines.",
  trendy: "Prints and patterns, fresh every week.",
  luxury: "Leather, chrome and statement finishes.",
  colorful: "Bright, bold and impossible to miss.",
};

const PERKS = [
  { title: "Free delivery", body: "On every order, across India." },
  { title: "Pay on delivery", body: "Cash when it arrives. Nothing up front." },
  { title: "7-day returns", body: "Not the right fit? Send it back." },
];

export default async function HomePage() {
  const { items } = await listProducts({ sort: "featured" }).catch(() => ({ items: [] }));
  const featured = items.slice(0, 8);

  return (
    <>
      {/* Hero: words first, then the picture, the way apple.com opens. */}
      <section className="bg-white pt-14 text-center md:pt-20">
        <div className="container-s">
          <p className="eyebrow rise">New collection</p>
          <h1 className="h-hero rise rise-2 mt-2">Cases that feel as good as they look.</h1>
          <p className="h-sub rise rise-3 mx-auto mt-4 max-w-2xl text-ink">Slim, tough and made in every finish for the phone you carry.</p>
          <p className="rise rise-3 mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[21px]">
            <Link href="/shop" className="link link-arrow">Shop now</Link>
            <Link href="/shop?sort=new" className="link link-arrow">See what&apos;s new</Link>
          </p>
        </div>
        <div className="container-x mt-10 md:mt-14">
          <div className="tile relative aspect-[4/3] overflow-hidden md:aspect-[16/8]">
            <Image src={SITE.heroDesktop.src} alt={SITE.heroDesktop.alt} fill priority sizes="(min-width:1240px) 1196px, 100vw" className="object-cover" style={{ objectPosition: SITE.heroDesktop.position }} />
          </div>
        </div>
      </section>

      {/* Featured: a sliding row. */}
      {featured.length > 0 && (
        <section className="mt-24 md:mt-32" aria-labelledby="featured">
          <div className="container-x flex items-end justify-between gap-4">
            <h2 id="featured" className="h-section">Our favourites.<span className="text-muted"> Loved by thousands.</span></h2>
            <Link href="/shop" className="link link-arrow hidden shrink-0 pb-2 text-[19px] md:inline">Shop all</Link>
          </div>
          <ul className="no-scrollbar mt-10 flex snap-x gap-5 overflow-x-auto px-[max(22px,calc((100vw-1196px)/2))] pb-4">
            {featured.map((p) => <li key={p.id} className="w-[72vw] shrink-0 snap-start sm:w-[34vw] lg:w-[22vw] lg:max-w-[290px]"><ProductCard p={p} /></li>)}
          </ul>
        </section>
      )}

      {/* Showcase: one dark, full-width moment. */}
      <section className="mt-24 md:mt-32" aria-label="Showcase">
        <div className="container-x">
          <div className="relative overflow-hidden rounded-[28px] bg-black text-white">
            <div className="relative aspect-[4/5] md:aspect-[16/8]">
              {SITE.showcaseVideo.src ? (
                <video src={SITE.showcaseVideo.src} poster={SITE.showcaseVideo.poster} autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover opacity-80" />
              ) : (
                <Image src={SITE.showcaseVideo.poster} alt="" fill sizes="100vw" className="object-cover opacity-80" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-8 md:p-14">
                <h2 className="h-section max-w-xl">Tough where it counts.</h2>
                <p className="h-sub mt-3 max-w-lg text-white/80">Raised edges for the screen and camera, and a finish that does not give in to fingerprints.</p>
                <Link href="/shop" className="btn btn-blue mt-6">Shop cases</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collections: two by two. */}
      <section className="mt-24 md:mt-32" aria-labelledby="collections">
        <div className="container-x">
          <h2 id="collections" className="h-section">Find your finish.</h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/shop?category=${c.slug}`} className="tile group relative block overflow-hidden">
                  <div className="p-8 pb-0 md:p-10 md:pb-0">
                    <h3 className="text-[28px] font-semibold tracking-tight">{c.label}</h3>
                    <p className="mt-1 text-[17px] text-muted">{TAGLINES[c.slug]}</p>
                    <span className="link link-arrow mt-3 inline-block text-[17px]">Shop {c.label.toLowerCase()}</span>
                  </div>
                  <div className="relative mt-4 h-64 md:h-80">
                    <Image src={SITE.categories[c.slug].src} alt="" fill sizes="(min-width:640px) 600px, 100vw" className="object-contain p-4 mix-blend-multiply transition duration-700 ease-out group-hover:scale-[1.04]" style={{ objectPosition: SITE.categories[c.slug].position }} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Why shop here. */}
      <section className="mt-24 md:mt-32" aria-label="Why shop with us">
        <div className="container-x">
          <ul className="tile grid gap-8 p-8 text-center sm:grid-cols-3 md:p-14">
            {PERKS.map((p) => (
              <li key={p.title}>
                <h3 className="text-[21px] font-semibold tracking-tight">{p.title}</h3>
                <p className="mt-1 text-[15px] text-muted">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
