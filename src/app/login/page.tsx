import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const next = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  if (await getUser()) redirect(next);
  return (
    <div className="container-xs py-14 md:py-24">
      <h1 className="h-page text-center">Sign in.</h1>
      <p className="mb-10 mt-3 text-center text-[17px] text-muted">Sign in to check out faster and follow your orders.</p>
      <div className="mx-auto max-w-sm"><AuthForm mode="login" next={next} /></div>
    </div>
  );
}
