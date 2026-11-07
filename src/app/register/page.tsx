import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account" };
export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const next = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  if (await getUser()) redirect(next);
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-10">
      <div className="w-full max-w-md rounded-[2rem] bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mb-6 mt-1 text-sm text-muted">Save your cart, check out faster and track orders.</p>
        <AuthForm mode="register" next={next} />
      </div>
    </div>
  );
}
