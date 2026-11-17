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
    <div className="tx-ad tx-auth">
      <div className="tx-ad__inner">
        <div className="tx-ad__guest">
          <div className="tx-ad__guest-card">
            <h1 className="tx-ad__guest-title">Create your account.</h1>
            <p className="tx-ad__guest-text">One account for your bag, addresses and orders.</p>
            <AuthForm mode="register" next={next} />
          </div>
        </div>
      </div>
    </div>
  );
}
