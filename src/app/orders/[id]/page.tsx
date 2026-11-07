import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { formatPrice } from "@/lib/money";

export const metadata: Metadata = { title: "Order details" };
export const dynamic = "force-dynamic";

export default async function OrderPage({ params, searchParams }: PageProps<"/orders/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const user = await getUser();
  if (!user) redirect(`/login?next=/orders/${id}`);
  const order = await prisma.order.findFirst({ where: { id, userId: user.id }, include: { items: true } });
  if (!order) notFound();

  return (
    <div className="container-x max-w-3xl py-8">
      {sp.placed && (
        <div role="status" className="mb-6 rounded-3xl bg-olive p-6 text-white">
          <p className="text-xl font-semibold">Thank you — your order is placed 🎉</p>
          <p className="mt-1 text-sm text-white/75">We’ll get it packed and on its way soon.</p>
        </div>
      )}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{order.number}</h1>
        <span className="rounded-full bg-sage px-3 py-1 text-xs font-semibold capitalize text-olive">{order.status.toLowerCase()}</span>
      </div>
      <p className="mt-1 text-sm text-muted">Placed {order.createdAt.toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Kolkata" })}</p>

      <ul className="mt-6 space-y-3">
        {order.items.map((i) => (
          <li key={i.id} className="flex items-center gap-4 rounded-3xl bg-card p-3">
            <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl bg-tile"><Image src={i.image} alt="" fill sizes="64px" className="object-contain p-1.5 mix-blend-multiply" /></div>
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{i.name}</p><p className="text-sm text-muted">{i.model} · {i.color} · ×{i.quantity}</p></div>
            <p className="font-semibold">{formatPrice(i.unitCents * i.quantity)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-card p-5 text-sm">
          <p className="mb-2 font-semibold">Shipping to</p>
          <p>{order.shipName}</p><p>{order.shipLine1}{order.shipLine2 ? `, ${order.shipLine2}` : ""}</p>
          <p>{order.shipCity}, {order.shipState} {order.shipPostal}</p><p>{order.shipCountry}</p><p className="mt-1 text-muted">{order.shipPhone}</p>
        </div>
        <dl className="space-y-2 rounded-3xl bg-card p-5 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(order.subtotalCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{order.shippingCents ? formatPrice(order.shippingCents) : "Free"}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Payment</dt><dd>{order.paymentMethod === "COD" ? "Cash on delivery" : order.paymentMethod}</dd></div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatPrice(order.totalCents)}</dd></div>
        </dl>
      </div>
      <Link href="/orders" className="btn btn-ghost mt-6">← All orders</Link>
    </div>
  );
}
