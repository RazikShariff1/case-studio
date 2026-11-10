"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Field } from "./Field";

const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") ? n : "/");

export default function AuthForm({ mode, next }: { mode: "login" | "register"; next: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError(""); setFields({});
    const body = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false); setError(data.error ?? "Something went wrong"); setFields(data.fields ?? {});
      return;
    }
    router.push(safeNext(next));
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {!isLogin && <Field name="name" label="Full name" autoComplete="name" error={fields.name} />}
      <Field name="email" type="email" inputMode="email" label="Email" autoComplete="email" error={fields.email} />
      <Field name="password" type="password" label="Password" autoComplete={isLogin ? "current-password" : "new-password"} error={fields.password} hint={isLogin ? undefined : "At least 8 characters"} />
      {error && <p role="alert" className="text-[14px] text-danger">{error}</p>}
      <button className="btn btn-blue btn-block" disabled={busy}>{busy ? "Please wait…" : isLogin ? "Sign in" : "Create account"}</button>
      <p className="pt-2 text-center text-[14px] text-muted">
        {isLogin ? "New to Case Studio? " : "Already have an account? "}
        <Link className="link" href={`${isLogin ? "/register" : "/login"}?next=${encodeURIComponent(next)}`}>{isLogin ? "Create an account" : "Sign in"}</Link>
      </p>
    </form>
  );
}
