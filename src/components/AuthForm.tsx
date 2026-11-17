"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { TxField } from "./AccountPanels";

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
    <form onSubmit={submit} noValidate>
      {!isLogin && <TxField name="name" label="Full name" autoComplete="name" error={fields.name} full />}
      <TxField name="email" type="email" inputMode="email" label="Email" autoComplete="email" error={fields.email} full />
      <TxField name="password" type="password" label="Password" autoComplete={isLogin ? "current-password" : "new-password"} error={fields.password} hint={isLogin ? undefined : "At least 8 characters"} full />
      {error && <p role="alert" className="tx-ad__form-error">{error}</p>}
      <button className="tx-ad__btn tx-ad__btn--wide" disabled={busy}>{busy ? "Please wait…" : isLogin ? "Sign in" : "Create account"}</button>
      <p className="tx-ad__soft tx-ad__guest-note">
        {isLogin ? "New to Thingx? " : "Already have an account? "}
        <Link className="tx-ad__link" href={`${isLogin ? "/register" : "/login"}?next=${encodeURIComponent(next)}`}>{isLogin ? "Create an account" : "Sign in"}</Link>
      </p>
    </form>
  );
}
