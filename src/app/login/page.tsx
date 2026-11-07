import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const next = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  if (await getUser()) redirect(next);
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-10">
      <div className="w-full max-w-md rounded-[2rem] bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mb-6 mt-1 text-sm text-muted">Sign in to check out and track your orders.</p>
        <AuthForm mode="login" next={next} />
      </div>
    </div>
  );
}
