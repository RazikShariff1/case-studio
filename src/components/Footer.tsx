import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog-constants";

export default function Footer() {
  return (
    <footer className="mt-24 bg-surface text-[12px] text-muted">
      <div className="container-x py-10">
        <p className="max-w-3xl border-b border-line pb-4 leading-snug">
          Free delivery on every order. Pay when it arrives with cash on delivery. If a case is not right, return it within 7 days.
        </p>
        <div className="grid grid-cols-2 gap-8 py-8 md:grid-cols-4">
          <nav aria-label="Shop">
            <p className="mb-2.5 font-semibold text-ink">Shop</p>
            <ul className="space-y-2">
              <li><Link href="/shop" className="hover:underline">All cases</Link></li>
              {CATEGORIES.map((c) => <li key={c.slug}><Link href={`/shop?category=${c.slug}`} className="hover:underline">{c.label}</Link></li>)}
            </ul>
          </nav>
          <nav aria-label="Account">
            <p className="mb-2.5 font-semibold text-ink">Account</p>
            <ul className="space-y-2">
              <li><Link href="/account" className="hover:underline">Manage your account</Link></li>
              <li><Link href="/orders" className="hover:underline">Your orders</Link></li>
              <li><Link href="/cart" className="hover:underline">Your bag</Link></li>
            </ul>
          </nav>
          <div className="col-span-2 md:col-span-2">
            <p className="mb-2.5 font-semibold text-ink">Delivery &amp; returns</p>
            <p className="max-w-md leading-snug">Orders are packed within a day and delivered across India. Cancel any time before an order is packed from your orders page.</p>
          </div>
        </div>
        <p className="divider pt-4">Copyright © {new Date().getFullYear()} Case Studio. All rights reserved.</p>
      </div>
    </footer>
  );
}
