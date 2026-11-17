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
    <div className="tx-cart tx-co">
      <div className="tx-cart__head"><h1 className="tx-cart__title">Checkout</h1></div>
      <div className="tx-co__grid">
        <CheckoutForm defaultName={user.name} defaultPhone={user.phone} addresses={addresses} />
        <aside className="tx-sum" style={{ position: "sticky", top: 96 }}>
          <h2>Order summary</h2>
          <ul role="list" style={{ display: "grid", gap: 16, margin: "0 0 24px", padding: 0, listStyle: "none" }}>
            {cart.items.map((i) => (
              <li key={i.id} className="tx-co__line">
                <div className="tx-item__img">
                  <Image src={i.image} alt="" fill sizes="56px" />
                </div>
                <div className="min-w-0 flex-1 text-[14px]"><p className="truncate font-semibold">{i.name}</p><p className="text-muted">{[i.model, i.color].filter(Boolean).join(" · ")} · ×{i.quantity}</p></div>
                <p className="text-[14px]">{formatPrice(i.unitCents * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl>
            <div><dt>Subtotal</dt><dd>{formatPrice(cart.subtotalCents)}</dd></div>
            <div><dt>Delivery</dt><dd>Free</dd></div>
            <div className="is-total"><dt>Total</dt><dd>{formatPrice(cart.totalCents)}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
