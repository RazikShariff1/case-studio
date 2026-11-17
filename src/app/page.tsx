import Link from "next/link";
import Stone3D from "@/components/Stone3D";

export const dynamic = "force-dynamic";

const HEADING = ["Made for the things", "you carry every day."];
const BADGES = [
  { label: "Cases", img: "tx-cat-cases.jpg" },
  { label: "Watch bands", img: "tx-watch.jpg" },
  { label: "Chargers", img: "tx-charging-dock.jpg" },
  { label: "Power banks", img: "tx-power-bank.jpg" },
  { label: "Laptop sleeves", img: "tx-sleeve.jpg" },
];
const PHONES = [
  { title: "iPhone", img: "tx-phone-iphone.png" },
  { title: "Samsung", img: "tx-phone-samsung.png" },
  { title: "OnePlus", img: "tx-phone-oneplus.png" },
  { title: "Google Pixel", img: "tx-phone-google.png" },
  { title: "Nothing", img: "tx-phone-nothing.png" },
];
const STATEMENT = "We start with the things you already love — your phone, your watch, your laptop — and make what goes around them simpler, stronger and quieter. No logos shouting. No bulk. Just the right thing, made well.";
const STATS = [
  { number: "2", suffix: "m", label: "drop-tested height" },
  { number: "18", suffix: "g", label: "lightest case we make" },
  { number: "4.8", suffix: "★", label: "average customer rating" },
];

export default function HomePage() {
  let w = 0;
  return (
    <>
      {/* Hero */}
      <section suppressHydrationWarning className="tx-sh is-intro is-waiting" style={{ ["--chapters" as string]: 0, ["--per" as string]: "100vh" }} data-tx-stone-hero data-chapters="0">
        <div className="tx-sh__stage">
          <div className="tx-sh__bg" aria-hidden="true" />
          <div className="tx-sh__night" aria-hidden="true" />
          <div className="tx-sh__intro tx-landing--animate" data-tx-sh-intro data-tx-landing>
            <h1 className="tx-landing__heading tx-sh__heading" aria-label={HEADING.join(" ")}>
              {HEADING.map((line) => (
                <span key={line} className="tx-landing__line" aria-hidden="true">
                  {line.split(" ").map((word) => (
                    <span key={word + w} className="tx-landing__word">
                      {[...word].map((c) => <span key={w} className="tx-landing__char" style={{ ["--i" as string]: w++ }}>{c}</span>)}
                    </span>
                  ))}
                </span>
              ))}
            </h1>
            <div className="tx-landing__actions tx-sh__actions">
              <Link href="/shop" className="tx-landing__btn tx-landing__btn--dark tx-shop-btn">Shop the collection</Link>
              <div className="tx-landing__with">
                <span>cases, bands &amp; more</span>
                <span className="tx-landing__badges">
                  {BADGES.map((b) => (
                    <span key={b.label} className="tx-landing__badge" title={b.label}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/theme/${b.img}`} alt={b.label} width={48} height={48} loading="lazy" />
                    </span>
                  ))}
                </span>
              </div>
            </div>
          </div>
          <div className="tx-sh__stone" data-tx-sh-stone aria-hidden="true">
            <div className="tx-sh__float">
              <span className="tx-sh__glow" />
              <Stone3D spin={0} eager attrs={{ "data-tx-sh-model": "", "interpolation-decay": "80" }} />
            </div>
            <span className="tx-sh__shadow" />
          </div>
        </div>
      </section>

      {/* Shop by phone */}
      <section className="tx-cats" style={{ ["--pt" as string]: "100px", ["--pb" as string]: "120px" }} data-tx-cats>
        <div className="tx-cats__inner">
          <div className="tx-cats__head" data-tx-reveal>
            <div><h2 className="tx-cats__heading">Shop by phone</h2></div>
          </div>
          <div className="tx-cats__panel is-active">
            <ul className="tx-cats__grid" role="list">
              {PHONES.map((p, n) => (
                <li key={p.title} className="tx-cats__item" style={{ ["--i" as string]: n }}>
                  <Link className="tx-cats__card" href={p.title === "iPhone" ? "/shop" : `/shop?q=${encodeURIComponent(p.title)}`}>
                    <span className="tx-cats__media tx-cats__media--phone">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/theme/${p.img}`} alt={p.title} loading="lazy" width={600} height={900} />
                      <span className="tx-cats__go" aria-hidden="true">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18 18 6" /><path d="M9 6h9v9" /></svg>
                      </span>
                    </span>
                    <span className="tx-cats__meta"><span className="tx-cats__title">{p.title}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Why Thingx */}
      <section className="tx-words tx-words--light" style={{ ["--pt" as string]: "160px", ["--pb" as string]: "160px" }}>
        <div className="tx-wrap">
          <p className="tx-words__eyebrow" data-tx-reveal>Why Thingx</p>
          <p className="tx-words__text" data-tx-words aria-label={STATEMENT}>
            {STATEMENT.split(" ").map((word, i) => <span key={i} className="tx-words__w" aria-hidden="true">{word}</span>)}
          </p>
        </div>
      </section>

      {/* Big numbers */}
      <section className="tx-stats tx-stats--light" style={{ ["--pt" as string]: "140px", ["--pb" as string]: "140px" }}>
        <div className="tx-wrap">
          <h2 className="tx-stats__heading" data-tx-reveal>Small things. Big numbers.</h2>
          <ul className="tx-stats__list" role="list">
            {STATS.map((s, i) => (
              <li key={s.label} className="tx-stats__item" data-tx-reveal style={{ ["--d" as string]: `${i * 0.12}s` }}>
                <p className="tx-stats__num"><span>{s.number}</span><span>{s.suffix}</span></p>
                <p className="tx-stats__label">{s.label}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="tx-cta tx-cta--grey" style={{ ["--pt" as string]: "160px", ["--pb" as string]: "160px" }}>
        <div className="tx-cta__inner">
          <div className="tx-cta__stone" data-tx-reveal aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/theme/thingx-stone.png" alt="" loading="lazy" width={237} height={260} />
          </div>
          <h2 className="tx-cta__heading" data-tx-reveal style={{ ["--d" as string]: "0.1s" }}>Find your thing.</h2>
          <p className="tx-cta__text" data-tx-reveal style={{ ["--d" as string]: "0.2s" }}>Free shipping on every prepaid order.</p>
          <div data-tx-reveal style={{ ["--d" as string]: "0.3s" }}>
            <Link className="tx-landing__btn tx-landing__btn--dark" href="/shop">Shop now</Link>
          </div>
        </div>
      </section>
    </>
  );
}
