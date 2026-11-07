import Image from "next/image";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { getCartData } from "@/lib/cart";
import { formatPrice } from "@/lib/money";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/checkout");
  const cart = await getCartData();
  if (cart.items.length === 0) redirect("/cart");

  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Checkout</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="rounded-3xl bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Shipping details</h2>
          <CheckoutForm defaultName={user.name} />
        </div>
        <aside className="h-fit rounded-3xl bg-card p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Your order</h2>
          <ul className="mt-4 space-y-3">
            {cart.items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 text-sm">
                <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xl bg-tile">
                  <Image src={i.image} alt="" fill sizes="48px" className="object-contain p-1 mix-blend-multiply" />
                </div>
                <div className="min-w-0 flex-1"><p className="truncate font-medium">{i.name}</p><p className="text-xs text-muted">{i.model} · {i.color} · ×{i.quantity}</p></div>
                <p>{formatPrice(i.unitCents * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(cart.subtotalCents)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{cart.shippingCents ? formatPrice(cart.shippingCents) : "Free"}</dd></div>
            <div className="flex justify-between pt-2 text-base font-semibold"><dt>Total</dt><dd>{formatPrice(cart.totalCents)}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
