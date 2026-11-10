import Image from "next/image";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUser, getToken } from "@/lib/auth";
import { getCartData } from "@/lib/cart";
import { listAddresses } from "@/lib/addresses";
import { formatPrice } from "@/lib/money";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/checkout");
  const cart = await getCartData();
  if (cart.items.length === 0) redirect("/cart");
  const token = await getToken();
  // Saved addresses are a convenience: checkout still works without them.
  const addresses = token ? await listAddresses(token).catch(() => []) : [];

  return (
    <div className="container-s py-14 md:py-20">
      <h1 className="h-page mb-12">Checkout.</h1>
      <div className="grid gap-14 lg:grid-cols-[1fr_340px]">
        <CheckoutForm defaultName={user.name} defaultPhone={user.phone} addresses={addresses} />
        <aside className="h-fit lg:sticky lg:top-20">
          <h2 className="text-[21px] font-semibold tracking-tight">Your bag</h2>
          <ul className="mt-5 space-y-4">
            {cart.items.map((i) => (
              <li key={i.id} className="flex items-center gap-3">
                <div className="tile relative h-16 w-14 shrink-0 overflow-hidden !rounded-xl">
                  <Image src={i.image} alt="" fill sizes="56px" className="object-contain p-1.5 mix-blend-multiply" />
                </div>
                <div className="min-w-0 flex-1 text-[14px]"><p className="truncate font-semibold">{i.name}</p><p className="text-muted">{[i.model, i.color].filter(Boolean).join(" · ")} · ×{i.quantity}</p></div>
                <p className="text-[14px]">{formatPrice(i.unitCents * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="divider mt-6 space-y-3 pt-5 text-[15px]">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(cart.subtotalCents)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>Free</dd></div>
            <div className="flex justify-between pt-2 text-[21px] font-semibold"><dt>Total</dt><dd>{formatPrice(cart.totalCents)}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
