import Link from "next/link";
import type { Metadata } from "next";
import { getCartData } from "@/lib/cart";
import { getUser } from "@/lib/auth";
import CartView from "@/components/CartView";

export const metadata: Metadata = { title: "Bag" };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const [cart, user] = await Promise.all([getCartData(), getUser()]);
  return (
    <div className="tx-cart">
      <div className="tx-cart__head">
        <h1 className="tx-cart__title">Your cart</h1>
        <Link href="/shop" className="tx-cart__link">Continue shopping</Link>
      </div>
      <CartView initial={cart} signedIn={!!user} />
    </div>
  );
}
