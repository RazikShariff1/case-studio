import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUser, getToken } from "@/lib/auth";
import { getOrder, statusLabel } from "@/lib/orders";
import { formatPrice } from "@/lib/money";
import OrderTracker from "@/components/OrderTracker";
import CancelOrder from "@/components/CancelOrder";

export const metadata: Metadata = { title: "Order details" };
export const dynamic = "force-dynamic";

export default async function OrderPage({ params, searchParams }: PageProps<"/orders/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const user = await getUser();
  if (!user) redirect(`/login?next=/orders/${id}`);
  const order = await getOrder((await getToken())!, id);
  if (!order) notFound();
  const a = order.address;

  return (
    <div className="container-xs py-14 md:py-20">
      {sp.placed && (
        <div role="status" className="rise mb-12 text-center">
          <p className="text-[56px] leading-none" aria-hidden>✓</p>
          <h1 className="h-page mt-4">Thank you for your order.</h1>
          <p className="h-sub mt-3 text-muted">We will pack it soon and let you know it is on its way.</p>
        </div>
      )}

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className={sp.placed ? "text-[24px] font-semibold tracking-tight" : "h-page"}>Order {order.number}</h2>
        <p className="text-[14px] font-semibold">{statusLabel(order.status)}</p>
      </div>
      <p className="mt-1 text-[14px] text-muted">Placed {order.createdAt.toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Kolkata" })}</p>

      <div className="mt-8"><OrderTracker status={order.status} /></div>
      {order.status === "PENDING" && <div className="mt-6"><CancelOrder id={order.id} /></div>}

      <ul className="divide-y divide-line border-y border-line mt-10">
        {order.items.map((i) => (
          <li key={i.id} className="flex items-center gap-4 py-5">
            <div className="tile relative h-20 w-16 shrink-0 overflow-hidden !rounded-xl"><Image src={i.image} alt="" fill sizes="64px" className="object-contain p-1.5 mix-blend-multiply" /></div>
            <div className="min-w-0 flex-1">
              {i.slug ? <Link href={`/product/${i.slug}`} className="block truncate text-[17px] font-semibold hover:underline">{i.name}</Link> : <p className="truncate text-[17px] font-semibold">{i.name}</p>}
              <p className="text-[14px] text-muted">{[i.model, i.color].filter(Boolean).join(" · ")} · ×{i.quantity}</p>
            </div>
            <p className="text-[17px]">{formatPrice(i.unitCents * i.quantity)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-10 sm:grid-cols-2">
        <section aria-labelledby="ship">
          <h3 id="ship" className="text-[14px] font-semibold">Delivering to</h3>
          <address className="mt-2 text-[15px] not-italic leading-snug text-muted">
            <span className="block text-ink">{a.name}</span>
            {a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}, {a.state} {a.pincode}<br />{a.country}<br />{a.phone}
          </address>
        </section>
        <section aria-labelledby="pay">
          <h3 id="pay" className="text-[14px] font-semibold">Payment</h3>
          <dl className="mt-2 space-y-2 text-[15px]">
            <div className="flex justify-between"><dt className="text-muted">Method</dt><dd>{order.paymentMethod === "COD" ? "Cash on delivery" : order.paymentMethod}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(order.subtotalCents)}</dd></div>
            {order.discountCents > 0 && <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd>−{formatPrice(order.discountCents)}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>Free</dd></div>
            <div className="divider flex justify-between pt-3 text-[19px] font-semibold"><dt>Total</dt><dd>{formatPrice(order.totalCents)}</dd></div>
          </dl>
        </section>
      </div>
      <Link href="/orders" className="link link-arrow mt-12 inline-block">All orders</Link>
    </div>
  );
}
