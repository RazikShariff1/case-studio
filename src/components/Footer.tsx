"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import ThemeScripts from "@/components/ThemeScripts";

const WORDMARK = "Thingx";

/** The theme's footer: newsletter beside link columns, a giant wordmark, and a slim bottom bar. */
export default function Footer() {
  const [done, setDone] = useState(false);
  const submit = (e: FormEvent) => { e.preventDefault(); setDone(true); };

  return (
    <footer className="tx-footer" style={{ ["--pt" as string]: "120px" }}>
      <ThemeScripts />
      <div className="tx-footer__inner">
        <div className="tx-footer__top">
          <div className="tx-footer__brand" data-tx-reveal>
            <div className="tx-footer__stone" aria-hidden="true"><img src="/theme/thingx-stone.png" alt="" width={237} height={260} /></div>
            <h2 className="tx-footer__heading">Stay in the loop.</h2>
            <p className="tx-footer__text">New arrivals, restocks and the occasional offer. No spam, ever.</p>
            <form className="tx-footer__form" onSubmit={submit}>
              <div className="tx-footer__field">
                <label className="sr-only" htmlFor="tx-footer-email">Email</label>
                <input id="tx-footer-email" type="email" name="email" placeholder="Email" autoComplete="email" required />
                <button type="submit" className="tx-footer__submit">Subscribe</button>
              </div>
              {done && <p className="tx-footer__msg" role="status">Thanks for subscribing!</p>}
            </form>
          </div>

          <nav className="tx-footer__cols" aria-label="Footer">
            <div className="tx-footer__col" data-tx-reveal style={{ ["--d" as string]: "0.08s" }}>
              <h3 className="tx-footer__col-heading">Shop</h3>
              <ul className="tx-footer__links" role="list">
                <li><Link href="/shop">All cases</Link></li>
              </ul>
            </div>
            <div className="tx-footer__col" data-tx-reveal style={{ ["--d" as string]: "0.16s" }}>
              <h3 className="tx-footer__col-heading">Help</h3>
              <ul className="tx-footer__links" role="list">
                <li><Link href="/account">Your account</Link></li>
                <li><Link href="/orders">Your orders</Link></li>
                <li><Link href="/cart">Your bag</Link></li>
              </ul>
            </div>
            <div className="tx-footer__col" data-tx-reveal style={{ ["--d" as string]: "0.24s" }}>
              <h3 className="tx-footer__col-heading">Delivery</h3>
              <div className="tx-footer__rte"><p>Free delivery on every order, pay on delivery, and easy 7-day returns.</p></div>
            </div>
          </nav>
        </div>

        <div className="tx-footer__wordmark tx-landing--animate" data-tx-landing data-tx-reveal aria-hidden="true">
          <p className="tx-landing__heading tx-footer__wordmark-text">
            {[...WORDMARK].map((c, i) => <span key={i} className="tx-landing__char" style={{ ["--i" as string]: i }}>{c}</span>)}
          </p>
        </div>

        <div className="tx-footer__bottom">
          <p className="tx-footer__copy">© {new Date().getFullYear()} <Link href="/">Thingx</Link></p>
          <div className="tx-footer__end">
            <button type="button" className="tx-footer__top-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <span>Back to top</span>
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
