"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProfileForm, AddressBook, SignOut } from "@/components/AccountPanels";
import { formatPrice } from "@/lib/money";
import type { SavedAddress } from "@/lib/addresses";

export type HubOrder = {
  id: string; number: string; status: string; statusLabel: string; createdAt: string; totalCents: number; subtotalCents: number; discountCents: number; paymentMethod: string;
  address: { name: string; line1: string; line2: string; city: string; state: string; pincode: string; country: string; phone: string };
  items: { id: string; name: string; slug: string | null; image: string; model: string; color: string; unitCents: number; quantity: number }[];
};
type Props = { name: string; email: string; phone: string; orders: HubOrder[] | null; addresses: SavedAddress[] };
type Tab = "orders" | "profile" | "addresses" | "help";

const I = {
  bag: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>,
  user: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" /></svg>,
  pin: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  help: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" /><path d="M12 17h.01" /></svg>,
  out: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" /><path d="m15 16 4-4-4-4" /><path d="M19 12H9" /></svg>,
  chev: <svg className="tx-ad__chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>,
  truck: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3z" /><path d="M14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.5" /><circle cx="17" cy="17.5" r="1.5" /></svg>,
};

const NAV: { tab: Tab; icon: React.ReactNode; title: string; sub: string }[] = [
  { tab: "orders", icon: I.bag, title: "My orders", sub: "Track, return or buy again" },
  { tab: "profile", icon: I.user, title: "Profile", sub: "Name, email and phone" },
  { tab: "addresses", icon: I.pin, title: "Saved addresses", sub: "Where we deliver" },
  { tab: "help", icon: I.help, title: "Help center", sub: "FAQs and contact" },
];

export const TOPICS = [
  { q: "Where is my order?", a: "You'll see its progress under My orders as soon as it is packed and on the way." },
  { q: "How do I return or exchange something?", a: "Open the order under My orders and contact us with your order number. Returns are accepted within 7 days of delivery." },
  { q: "Can I cancel my order?", a: "Yes, while it is still being processed. Open the order and choose Cancel order." },
  { q: "Will this case fit my phone?", a: "Every case is made for one phone model. Pick your phone on the product page before adding it to your bag." },
];

const stateOf = (s: string) => (s === "CANCELLED" ? "cancelled" : s === "DISPATCHED" || s === "COMPLETED" ? "shipped" : "processing");
const STEPS = ["Order placed", "Packed", "On the way", "Delivered"];
const stepAt = (s: string) => Math.max(0, ["PENDING", "PACKED", "DISPATCHED", "COMPLETED"].indexOf(s));
const date = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export function Help() {
  return (
    <div className="tx-ad__help">
      <div>
        <h2 className="tx-ad__h2">Help center</h2>
        <div className="tx-ad__faq">
          {TOPICS.map((t) => (
            <details key={t.q} className="tx-ad__q">
              <summary><span>{t.q}</span><span className="tx-ad__plus" aria-hidden="true" /></summary>
              <div className="tx-ad__a"><p>{t.a}</p></div>
            </details>
          ))}
        </div>
      </div>
      <aside className="tx-ad__contact">
        <p className="tx-ad__card-title">Still need help?</p>
        <p className="tx-ad__soft">Send us a message with your order number. We usually reply within a day.</p>
        <a className="tx-ad__btn" href="mailto:support@thingx.in">Contact us</a>
      </aside>
    </div>
  );
}

function OrdersPanel({ orders }: { orders: HubOrder[] | null }) {
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  if (orders === null) {
    return (
      <div className="tx-ad__empty">
        <p className="tx-ad__empty-title">We could not load your orders</p>
        <p>Please try again in a moment.</p>
        <Link className="tx-ad__btn" href="/account">Try again</Link>
      </div>
    );
  }
  const count = (f: string) => (f === "all" ? orders.length : orders.filter((o) => stateOf(o.status) === f).length);
  const shown = orders.filter((o) => filter === "all" || stateOf(o.status) === filter);

  return (
    <>
      <h2 className="tx-ad__h2">My orders</h2>
      {orders.length === 0 ? (
        <div className="tx-ad__empty">
          <span className="tx-ad__empty-icon">{I.bag}</span>
          <p className="tx-ad__empty-title">No orders yet</p>
          <p>When you buy something, you&apos;ll track it right here.</p>
          <Link className="tx-ad__btn" href="/shop">Start shopping</Link>
        </div>
      ) : (
        <>
          <div className="tx-ad__filters" role="group" aria-label="Filter orders">
            {([["all", "All orders"], ["processing", "Processing"], ["shipped", "Shipped"], ["cancelled", "Cancelled"]] as const).map(([f, l]) => (
              <button key={f} type="button" className="tx-ad__filter" aria-pressed={filter === f} onClick={() => setFilter(f)}><span>{l}</span><span className="tx-ad__count">{count(f)}</span></button>
            ))}
          </div>
          <ul className="tx-ad__orders" role="list">
            {shown.map((o) => {
              const st = stateOf(o.status);
              const isOpen = open === o.id;
              const a = o.address;
              return (
                <li key={o.id} className={`tx-ad__order${isOpen ? " is-open" : ""}`} data-state={st}>
                  <div className="tx-ad__order-head">
                    <div>
                      <p className="tx-ad__label">Order ID</p>
                      <p className="tx-ad__order-id">{I.bag}<span>{o.number}</span></p>
                    </div>
                    <div className="tx-ad__chips">
                      <span className="tx-ad__chip">Placed {date(o.createdAt)}</span>
                      <span className={`tx-ad__status tx-ad__status--${st}`}>{o.statusLabel}</span>
                    </div>
                  </div>
                  <div className="tx-ad__route">
                    <span className="tx-ad__chip tx-ad__chip--icon">{I.truck}Thingx</span>
                    <span className="tx-ad__route-line" aria-hidden="true" />
                    <span className="tx-ad__chip tx-ad__chip--icon">{I.pin}{a.city || a.state}</span>
                  </div>
                  <ul className="tx-ad__items" role="list">
                    {o.items.map((i, n) => (
                      <li key={i.id} className={`tx-ad__item${n >= 3 ? " is-extra" : ""}`}>
                        <span className="tx-ad__item-media"><Image src={i.image} alt="" width={96} height={96} sizes="96px" /></span>
                        <span className="tx-ad__item-info">
                          <span className="tx-ad__item-title">{i.name}</span>
                          <span className="tx-ad__item-price">{formatPrice(i.unitCents)} <span className="tx-ad__soft">×{i.quantity}</span></span>
                          {(i.model || i.color) && <span className="tx-ad__item-variant">{[i.model, i.color].filter(Boolean).join(" · ")}</span>}
                        </span>
                      </li>
                    ))}
                    {o.items.length > 3 && !isOpen && <li className="tx-ad__more">+ {o.items.length - 3} more item{o.items.length > 4 ? "s" : ""}</li>}
                  </ul>
                  <div className="tx-ad__order-foot">
                    <p>Total: <strong>{formatPrice(o.totalCents)}</strong> <span className="tx-ad__soft">({o.items.reduce((s, i) => s + i.quantity, 0)} items)</span></p>
                    <button type="button" className="tx-ad__btn" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : o.id)}>{isOpen ? "Hide details" : "Details"}</button>
                  </div>
                  {isOpen && (
                    <div className="tx-ad__detail">
                      <div className="tx-ad__detail-block">
                        <p className="tx-ad__detail-title">Delivery</p>
                        {o.status === "CANCELLED" ? <p className="tx-ad__soft">This order was cancelled.</p> : (
                          <ol className="tx-ad__track" aria-label="Order progress">
                            {STEPS.map((s, n) => <li key={s} className={n <= stepAt(o.status) ? "is-on" : ""}><i /><p>{s}</p></li>)}
                          </ol>
                        )}
                      </div>
                      <div className="tx-ad__detail-grid">
                        <div className="tx-ad__detail-block">
                          <p className="tx-ad__detail-title">Delivery address</p>
                          <div className="tx-ad__address-body"><strong>{a.name}</strong><br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}, {a.state} {a.pincode}<br />{a.country}<br />{a.phone}</div>
                        </div>
                        <div className="tx-ad__detail-block">
                          <p className="tx-ad__detail-title">Payment</p>
                          <dl className="tx-ad__sum">
                            <div><dt>Subtotal</dt><dd>{formatPrice(o.subtotalCents)}</dd></div>
                            {o.discountCents > 0 && <div><dt>Discount</dt><dd>−{formatPrice(o.discountCents)}</dd></div>}
                            <div><dt>Shipping</dt><dd>Free</dd></div>
                            <div className="tx-ad__sum-total"><dt>Total</dt><dd>{formatPrice(o.totalCents)}</dd></div>
                          </dl>
                          <p className="tx-ad__soft tx-ad__paid">{o.paymentMethod === "COD" ? "Pay on delivery" : o.paymentMethod}</p>
                        </div>
                      </div>
                      <div className="tx-ad__detail-help">
                        <Link className="tx-ad__mini" href={`/orders/${o.id}`}>Open full order page</Link>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {shown.length === 0 && <p className="tx-ad__none">No orders here.</p>}
        </>
      )}
    </>
  );
}

/** "My account": a sidebar of tabs (kept in the URL hash) and the chosen panel beside it, as in the Shopify theme. */
export default function AccountHub({ name, email, phone, orders, addresses }: Props) {
  const [tab, setTab] = useState<Tab | "">("orders");
  const [greet, setGreet] = useState("Hello,");

  useEffect(() => {
    const h = new Date().getHours();
    setGreet(h < 12 ? "Good morning," : h < 17 ? "Good afternoon," : "Good evening,");
    const phoneMq = matchMedia("(max-width: 899px)");
    const read = () => {
      const t = location.hash.slice(1) as Tab;
      setTab(NAV.some((n) => n.tab === t) ? t : phoneMq.matches ? "" : "orders");
    };
    read();
    addEventListener("hashchange", read);
    addEventListener("popstate", read);
    return () => { removeEventListener("hashchange", read); removeEventListener("popstate", read); };
  }, []);

  const pick = (t: Tab) => {
    if (location.hash !== `#${t}`) history.pushState(null, "", `#${t}`);
    setTab(t);
    if (matchMedia("(max-width: 899px)").matches) scrollTo({ top: 0 });
  };
  const back = () => { history.pushState(null, "", location.pathname + location.search); setTab(matchMedia("(max-width: 899px)").matches ? "" : "orders"); scrollTo({ top: 0 }); };
  const first = name.split(" ")[0] || "there";

  return (
    <div className={`tx-ad${tab === "" ? " is-menu" : ""}`}>
      <div className="tx-ad__inner">
        <div className="tx-ad__layout">
          <aside className="tx-ad__side">
            <div className="tx-ad__me">
              <span className="tx-ad__avatar" aria-hidden="true">{(name || email).slice(0, 1).toUpperCase()}</span>
              <div className="tx-ad__me-text">
                <p className="tx-ad__greet">{greet}</p>
                <h1 className="tx-ad__name">{first}</h1>
                <p className="tx-ad__mail" title={email}>{email}</p>
              </div>
            </div>
            <nav className="tx-ad__nav" aria-label="Account">
              <div role="tablist" aria-orientation="vertical">
                {NAV.map((n) => (
                  <button key={n.tab} type="button" role="tab" id={`tx-ad-tab-${n.tab}`} aria-controls={`tx-ad-${n.tab}`} aria-selected={tab === n.tab} tabIndex={tab === n.tab ? 0 : -1} onClick={() => pick(n.tab)}>
                    <span className="tx-ad__ico">{n.icon}</span><span className="tx-ad__lbl"><b>{n.title}</b><small>{n.sub}</small></span>{I.chev}
                  </button>
                ))}
              </div>
            </nav>
            <SignOut>{I.out}<span>Log out</span></SignOut>
          </aside>

          <div className="tx-ad__main">
            <button type="button" className="tx-ad__back" onClick={back}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>Account</button>
            {tab === "orders" && <div className="tx-ad__panel tx-ad__panel--orders" id="tx-ad-orders" role="tabpanel" aria-labelledby="tx-ad-tab-orders"><OrdersPanel orders={orders} /></div>}
            {tab === "profile" && <div className="tx-ad__panel" id="tx-ad-profile" role="tabpanel" aria-labelledby="tx-ad-tab-profile"><ProfileForm name={name} email={email} phone={phone} /></div>}
            {tab === "addresses" && <div className="tx-ad__panel" id="tx-ad-addresses" role="tabpanel" aria-labelledby="tx-ad-tab-addresses"><AddressBook addresses={addresses} /></div>}
            {tab === "help" && <div className="tx-ad__panel" id="tx-ad-help" role="tabpanel" aria-labelledby="tx-ad-tab-help"><Help /></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
