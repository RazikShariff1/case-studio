"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Props = { signedIn: boolean; cartCount: number };

// Outline icon + filled variant for the active tab.
const icons = {
  home: {
    off: <path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8z" />,
    on: <path d="M12 3.2 3.4 10.6A1 1 0 0 0 3 11.4V20a1 1 0 0 0 1 1h4.5v-6.5h7V21H20a1 1 0 0 0 1-1v-8.6a1 1 0 0 0-.4-.8L12 3.2z" stroke="none" fill="currentColor" />,
  },
  search: {
    off: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    on: <><circle cx="11" cy="11" r="6.5" strokeWidth="2.6" /><path d="m16 16 4 4" strokeWidth="2.6" /></>,
  },
  bag: {
    off: <><path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
    on: <><path d="M5.2 7.5h13.6l-1 13.5H6.2L5.2 7.5z" fill="currentColor" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
  },
  user: {
    off: <><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></>,
    on: <><circle cx="12" cy="8.5" r="3.7" fill="currentColor" /><path d="M4.5 20.5c.8-3.8 3.7-6 7.5-6s6.7 2.2 7.5 6z" fill="currentColor" /></>,
  },
};

export default function MobileTabs({ signedIn, cartCount }: Props) {
  const path = usePathname();
  const [typing, setTyping] = useState(false);

  // On-screen keyboards (esp. Android) shrink the viewport and shove fixed bars up over the
  // form. Hide the bar while any text field has focus.
  useEffect(() => {
    const isField = (el: EventTarget | null) =>
      el instanceof HTMLElement && (el.matches("input:not([type=checkbox]):not([type=radio]):not([type=hidden]), textarea, select") || el.isContentEditable);
    const on = (e: FocusEvent) => isField(e.target) && setTyping(true);
    const off = () => setTyping(false);
    document.addEventListener("focusin", on);
    document.addEventListener("focusout", off);
    return () => { document.removeEventListener("focusin", on); document.removeEventListener("focusout", off); };
  }, []);

  const tabs = [
    { key: "home", label: "Home", href: "/", on: path === "/" },
    { key: "search", label: "Shop", href: "/shop", on: path.startsWith("/shop") },
    { key: "bag", label: "Cart", href: "/cart", on: path === "/cart" || path === "/checkout" },
    { key: "user", label: signedIn ? "Orders" : "Sign in", href: signedIn ? "/orders" : "/login", on: ["/orders", "/login", "/register"].some((p) => path.startsWith(p)) },
  ] as const;

  return (
    <nav aria-label="Primary" hidden={typing}
      className="mobile-tabs fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 rounded-[26px] border border-line/80 bg-card p-1.5 shadow-[0_10px_30px_rgba(40,38,28,.18)] md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {tabs.map((t) => (
          <li key={t.key}>
            <Link href={t.href} aria-current={t.on ? "page" : undefined}
              className={`relative flex h-[56px] flex-col items-center justify-center gap-1 rounded-[20px] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-olive focus-visible:ring-offset-2 focus-visible:ring-offset-card active:scale-95 ${t.on ? "bg-olive text-white" : "text-ink/70 active:bg-olive/10"}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {t.on ? icons[t.key].on : icons[t.key].off}
              </svg>
              <span className={`text-[11px] leading-none ${t.on ? "font-semibold" : "font-medium"}`}>{t.label}</span>
              {t.key === "bag" && cartCount > 0 && (
                <span className={`absolute right-[22%] top-1.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold leading-none text-white ring-2 ${t.on ? "bg-danger ring-olive" : "bg-danger ring-card"}`}>{cartCount > 9 ? "9+" : cartCount}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
