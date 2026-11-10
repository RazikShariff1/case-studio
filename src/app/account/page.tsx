import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUser, getToken } from "@/lib/auth";
import { listAddresses } from "@/lib/addresses";
import { ProfileForm, PasswordForm, AddressBook, SignOut } from "@/components/AccountPanels";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/account");
  const addresses = await listAddresses((await getToken())!).catch(() => []);

  return (
    <div className="container-xs py-14 md:py-20">
      <h1 className="h-page">Hello, {user.name.split(" ")[0]}.</h1>
      <p className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[17px]">
        <Link href="/orders" className="link link-arrow">Your orders</Link>
        <Link href="/cart" className="link link-arrow">Your bag</Link>
      </p>

      <section className="mt-14" aria-labelledby="profile"><h2 id="profile" className="mb-5 text-[24px] font-semibold tracking-tight">Your details</h2><ProfileForm name={user.name} email={user.email} phone={user.phone} /></section>
      <section className="divider mt-14 pt-14" aria-labelledby="addresses"><h2 id="addresses" className="mb-5 text-[24px] font-semibold tracking-tight">Addresses</h2><AddressBook addresses={addresses} /></section>
      <section className="divider mt-14 pt-14" aria-labelledby="security"><h2 id="security" className="mb-5 text-[24px] font-semibold tracking-tight">Password</h2><PasswordForm /></section>
      <section className="divider mt-14 pt-10"><SignOut /></section>
    </div>
  );
}
