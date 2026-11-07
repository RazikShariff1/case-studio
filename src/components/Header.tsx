import Link from "next/link";
import Logo from "./Logo";
import UserMenu from "./UserMenu";
import type { SessionUser } from "@/lib/auth";

export default function Header({ user, cartCount }: { user: SessionUser | null; cartCount: number }) {
  const cart = { count: cartCount };
  return (
    <header className="site-header sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <span className="site-logo"><Logo /></span>
        <nav className="hidden items-center gap-7 text-sm font-medium md:flex" aria-label="Main">
          <Link href="/shop" className="hover:text-olive-2">Shop</Link>
          <Link href="/shop?category=minimal" className="hover:text-olive-2">Minimal</Link>
          <Link href="/shop?category=trendy" className="hover:text-olive-2">Trendy</Link>
          <Link href="/shop?category=luxury" className="hover:text-olive-2">Luxury</Link>
          <Link href="/shop?category=colorful" className="hover:text-olive-2">Colorful</Link>
        </nav>
        <div className="flex items-center gap-1">
          <Link href="/shop" aria-label="Search" className="grid h-10 w-10 place-items-center rounded-full hover:bg-card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
          </Link>
          <UserMenu user={user} />
          <Link href="/cart" aria-label={`Cart, ${cart.count} items`} className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>
            {cart.count > 0 && (
              <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-olive px-1 text-[10px] font-bold text-white">{cart.count}</span>
            )}
          </Link>
        </div>
      </div>
      <nav className="site-subnav container-x flex gap-5 overflow-x-auto pb-2 text-sm font-medium md:hidden" aria-label="Categories">
        {["minimal", "trendy", "luxury", "colorful"].map((c) => (
          <Link key={c} href={`/shop?category=${c}`} className="whitespace-nowrap capitalize text-muted">{c}</Link>
        ))}
      </nav>
    </header>
  );
}
