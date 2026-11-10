import type { Metadata } from "next";
import { getCartData } from "@/lib/cart";
import { getUser } from "@/lib/auth";
import CartView from "@/components/CartView";

export const metadata: Metadata = { title: "Bag" };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const [cart, user] = await Promise.all([getCartData(), getUser()]);
  return (
    <div className="container-s py-14 md:py-20">
      <h1 className="h-page mb-12">{cart.items.length ? "Review your bag." : "Your bag"} <span className="text-muted">{cart.items.length ? "Free delivery on everything." : ""}</span></h1>
      <CartView initial={cart} signedIn={!!user} />
    </div>
  );
}
