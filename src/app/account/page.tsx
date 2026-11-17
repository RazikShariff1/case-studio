import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUser, getToken } from "@/lib/auth";
import { listAddresses } from "@/lib/addresses";
import { listOrders, statusLabel } from "@/lib/orders";
import AccountHub, { type HubOrder } from "@/components/AccountHub";

export const metadata: Metadata = { title: "My account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/account");
  const token = (await getToken())!;
  const [addresses, orders] = await Promise.all([listAddresses(token).catch(() => []), listOrders(token).catch(() => null)]);

  const hubOrders: HubOrder[] | null = orders && orders.map((o) => ({
    id: o.id, number: o.number, status: o.status, statusLabel: statusLabel(o.status), createdAt: o.createdAt.toISOString(),
    totalCents: o.totalCents, subtotalCents: o.subtotalCents, discountCents: o.discountCents, paymentMethod: o.paymentMethod,
    address: o.address, items: o.items,
  }));

  return <AccountHub name={user.name} email={user.email} phone={user.phone} orders={hubOrders} addresses={addresses} />;
}
