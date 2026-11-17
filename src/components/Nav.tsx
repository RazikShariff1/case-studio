"use client";

import SearchPanel from "@/components/SearchPanel";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

const LINKS = [{ href: "/shop", label: "Store" }];

const Icon = ({ d, extra }: { d: string; extra?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
    {extra && <path d={extra} />}
  </svg>
);

export default function Nav({ signedIn, bagCount }: { signedIn: boolean; bagCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  // A panel is open only on the page it was opened on, so navigating closes it without any effect.
  const [menuAt, setMenuAt] = useState<string | null>(null);
  const [searchAt, setSearchAt] = useState<string | null>(null);
  const menu = menuAt === pathname;
  const search = searchAt === pathname;
  const input = useRef<HTMLInputElement>(null);

  // Lock scrolling while a panel is open, and focus the search box.
  useEffect(() => {
    document.body.style.overflow = menu || search ? "hidden" : "";
    if (search) input.current?.focus();
    return () => { document.body.style.overflow = ""; };
  }, [menu, search]);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    setSearchAt(null);
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

  return (
    <>
      <header className="nav-glass tx-header sticky top-0 z-50">
        <nav aria-label="Global" className="container-x flex h-[56px] items-center justify-between gap-2">
          <button className="-ml-2 grid h-11 w-11 place-items-center md:hidden" aria-label={menu ? "Close menu" : "Menu"} aria-expanded={menu} onClick={() => { setMenuAt(menu ? null : pathname); setSearchAt(null); }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden>
              {menu ? <path d="M3 3l12 12M15 3L3 15" /> : <path d="M2 6h14M2 12h14" />}
            </svg>
          </button>

          <Link href="/" aria-label="Thingx home" className="tx-logo max-md:absolute max-md:left-1/2 max-md:-translate-x-1/2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/theme/thingx-mark.png" alt="Thingx" width={29} height={32} className="tx-mark" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/theme/thingx-wordmark.png" alt="Thingx" width={100} height={32} className="tx-wordmark" />
          </Link>

          <ul className="hidden items-center gap-8 md:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="nav-link" aria-current={pathname === "/shop" && l.href === "/shop" ? "page" : undefined}>{l.label}</Link>
              </li>
            ))}
          </ul>

          <div className="-mr-2 flex items-center">
            <button className="grid h-11 w-11 place-items-center text-ink/80 hover:text-black" aria-label="Search" aria-expanded={search} onClick={() => { setSearchAt(search ? null : pathname); setMenuAt(null); }}>
              <Icon d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13z" extra="m16 16 4.5 4.5" />
            </button>
            <Link href={signedIn ? "/account" : "/login"} className="grid h-11 w-11 place-items-center text-ink/80 hover:text-black" aria-label={signedIn ? "Account" : "Sign in"}>
              <Icon d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" extra="M4.5 20a7.5 7.5 0 0 1 15 0" />
            </Link>
            <Link href="/cart" className="relative grid h-11 w-11 place-items-center text-ink/80 hover:text-black" aria-label={`Bag, ${bagCount} ${bagCount === 1 ? "item" : "items"}`}>
              <Icon d="M5.5 8h13l-1 12h-11l-1-12z" extra="M9 8V7a3 3 0 0 1 6 0v1" />
              {bagCount > 0 && <span className="absolute right-1.5 top-2 grid h-4 min-w-4 place-items-center rounded-full bg-blue px-1 text-[10px] font-semibold leading-none text-white">{bagCount}</span>}
            </Link>
          </div>
        </nav>
      </header>

      <SearchPanel open={search} onClose={() => setSearchAt(null)} top={56} />

      {/* Menu: full-screen list on phones. */}
      {menu && (
        <div className="fixed inset-x-0 bottom-0 top-12 z-40 overflow-y-auto bg-white rise md:hidden" role="dialog" aria-label="Menu">
          <ul className="container-x space-y-1 pt-6 text-[28px] font-semibold tracking-tight">
            {LINKS.map((l) => <li key={l.href}><Link href={l.href} className="block py-2.5">{l.label}</Link></li>)}
            <li className="divider mt-3 pt-3 text-[17px] font-normal text-muted">
              <Link href={signedIn ? "/account" : "/login"} className="block py-2">{signedIn ? "Account" : "Sign in"}</Link>
              <Link href="/orders" className="block py-2">Orders</Link>
            </li>
          </ul>
        </div>
      )}
    </>
  );
}
