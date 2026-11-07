import type { Metadata } from "next";
import { getCartData } from "@/lib/cart";
import { getUser } from "@/lib/auth";
import CartView from "@/components/CartView";

export const metadata: Metadata = { title: "Your cart" };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const [cart, user] = await Promise.all([getCartData(), getUser()]);
  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Your cart</h1>
      <CartView initial={cart} signedIn={!!user} />
    </div>
  );
}
