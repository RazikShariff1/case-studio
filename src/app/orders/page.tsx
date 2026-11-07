import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { formatPrice } from "@/lib/money";

export const metadata: Metadata = { title: "My orders" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/orders");
  const orders = await prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { items: true } });

  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">My orders</h1>
      {orders.length === 0 ? (
        <div className="rounded-3xl bg-card p-12 text-center">
          <p className="text-lg font-semibold">No orders yet</p>
          <Link href="/shop" className="btn btn-dark mt-5">Start shopping</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-card p-5 transition hover:bg-white">
                <div>
                  <p className="font-semibold">{o.number}</p>
                  <p className="text-sm text-muted">{o.createdAt.toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" })} · {o.items.reduce((s, i) => s + i.quantity, 0)} items</p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusPill status={o.status} />
                  <p className="font-semibold">{formatPrice(o.totalCents)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  return <span className="rounded-full bg-sage px-3 py-1 text-xs font-semibold capitalize text-olive">{status.toLowerCase()}</span>;
}
