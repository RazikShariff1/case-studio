import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUser, getToken } from "@/lib/auth";
import { listOrders, statusLabel } from "@/lib/orders";
import { formatPrice } from "@/lib/money";

export const metadata: Metadata = { title: "Your orders" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/orders");
  const token = (await getToken())!;
  const orders = await listOrders(token).catch(() => null);

  return (
    <div className="container-s py-14 md:py-20">
      <h1 className="h-page mb-12">Your orders.</h1>
      {orders === null ? (
        <div className="tile p-12 text-center">
          <p className="text-[21px] font-semibold">We could not load your orders.</p>
          <p className="mt-1 text-muted">Please try again in a moment.</p>
          <Link href="/orders" className="btn btn-blue mt-6">Try again</Link>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-[28px] font-semibold tracking-tight">No orders yet.</p>
          <p className="mt-2 text-[17px] text-muted">When you place an order, it shows up here.</p>
          <Link href="/shop" className="btn btn-blue mt-8">Start shopping</Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/orders/${o.id}`} className="card block p-6 transition hover:shadow-[0_4px_24px_rgba(0,0,0,.08)]">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[19px] font-semibold tracking-tight">Order {o.number}</p>
                  <p className={`text-[14px] font-semibold ${o.status === "CANCELLED" ? "text-danger" : o.status === "COMPLETED" ? "text-good" : "text-ink"}`}>{statusLabel(o.status)}</p>
                </div>
                <p className="mt-0.5 text-[14px] text-muted">{o.createdAt.toLocaleDateString("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" })} · {o.items.reduce((s, i) => s + i.quantity, 0)} items · {formatPrice(o.totalCents)}</p>
                <div className="mt-4 flex gap-2">
                  {o.items.slice(0, 5).map((i) => (
                    <div key={i.id} className="tile relative h-14 w-12 overflow-hidden !rounded-xl"><Image src={i.image} alt={i.name} fill sizes="48px" className="object-contain p-1 mix-blend-multiply" /></div>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
