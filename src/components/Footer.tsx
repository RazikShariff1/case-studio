import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="container-x flex flex-col items-start justify-between gap-6 py-10 text-sm text-muted md:flex-row md:items-center">
        <Logo />
        <p>© {new Date().getFullYear()} Case Studio. Premium phone cases.</p>
        <nav className="flex gap-5">
          <Link href="/shop">Shop</Link>
          <Link href="/cart">Cart</Link>
          <Link href="/orders">Orders</Link>
        </nav>
      </div>
    </footer>
  );
}
