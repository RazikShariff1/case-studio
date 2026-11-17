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
    <div className="tx-ad">
      <div className="tx-ad__inner">
        <div className="tx-ad__page">
          {sp.placed && (
            <div role="status" className="tx-ad__thanks">
              <b aria-hidden>✓</b>
              <h1>Thank you for your order.</h1>
              <p>We will pack it soon and let you know it is on its way.</p>
            </div>
          )}
          <Link href="/account#orders" className="tx-ad__mini">‹ My orders</Link>
          <div className="tx-ad__order is-open" style={{ marginTop: 16 }}>
            <div className="tx-ad__order-head">
              <div>
                <p className="tx-ad__label">Order ID</p>
                <p className="tx-ad__order-id"><span>{order.number}</span></p>
              </div>
              <div className="tx-ad__chips">
                <span className="tx-ad__chip">Placed {order.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}</span>
                <span className={`tx-ad__status tx-ad__status--${order.status === "CANCELLED" ? "cancelled" : order.status === "DISPATCHED" || order.status === "COMPLETED" ? "shipped" : "processing"}`}>{statusLabel(order.status)}</span>
              </div>
            </div>

            <div className="tx-ad__detail-block" style={{ marginTop: 20 }}>
              <p className="tx-ad__detail-title">Delivery</p>
              <OrderTracker status={order.status} />
            </div>
            {order.status === "PENDING" && <div style={{ marginTop: 16 }}><CancelOrder id={order.id} /></div>}

            <ul className="tx-ad__items" role="list" style={{ marginTop: 20 }}>
              {order.items.map((i) => (
                <li key={i.id} className="tx-ad__item">
                  <span className="tx-ad__item-media"><Image src={i.image} alt="" width={96} height={96} sizes="96px" /></span>
                  <span className="tx-ad__item-info">
                    {i.slug ? <Link href={`/product/${i.slug}`} className="tx-ad__item-title tx-ad__order-link">{i.name}</Link> : <span className="tx-ad__item-title">{i.name}</span>}
                    <span className="tx-ad__item-price">{formatPrice(i.unitCents * i.quantity)} <span className="tx-ad__soft">×{i.quantity}</span></span>
                    {(i.model || i.color) && <span className="tx-ad__item-variant">{[i.model, i.color].filter(Boolean).join(" · ")}</span>}
                  </span>
                </li>
              ))}
            </ul>

            <div className="tx-ad__detail-grid" style={{ marginTop: 20 }}>
              <div className="tx-ad__detail-block">
                <p className="tx-ad__detail-title">Delivering to</p>
                <div className="tx-ad__address-body"><strong>{a.name}</strong><br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}, {a.state} {a.pincode}<br />{a.country}<br />{a.phone}</div>
              </div>
              <div className="tx-ad__detail-block">
                <p className="tx-ad__detail-title">Payment</p>
                <dl className="tx-ad__sum">
                  <div><dt>Method</dt><dd>{order.paymentMethod === "COD" ? "Cash on delivery" : order.paymentMethod}</dd></div>
                  <div><dt>Subtotal</dt><dd>{formatPrice(order.subtotalCents)}</dd></div>
                  {order.discountCents > 0 && <div><dt>Discount</dt><dd>−{formatPrice(order.discountCents)}</dd></div>}
                  <div><dt>Shipping</dt><dd>Free</dd></div>
                  <div className="tx-ad__sum-total"><dt>Total</dt><dd>{formatPrice(order.totalCents)}</dd></div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
