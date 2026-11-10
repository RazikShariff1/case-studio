import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: PageProps<"/register">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const next = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  if (await getUser()) redirect(next);
  return (
    <div className="container-xs py-14 md:py-24">
      <h1 className="h-page text-center">Create your account.</h1>
      <p className="mb-10 mt-3 text-center text-[17px] text-muted">One account for your bag, addresses and orders.</p>
      <div className="mx-auto max-w-sm"><AuthForm mode="register" next={next} /></div>
    </div>
  );
}
