"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

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
      <Field name="email" type="email" label="Email" autoComplete="email" error={fields.email} />
      <Field name="password" type="password" label="Password" autoComplete={isLogin ? "current-password" : "new-password"} error={fields.password} hint={isLogin ? undefined : "At least 8 characters"} />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <button className="btn btn-dark w-full" disabled={busy}>{busy ? "Please wait…" : isLogin ? "Sign in" : "Create account"}</button>
      <p className="text-center text-sm text-muted">
        {isLogin ? "New to Case Studio? " : "Already have an account? "}
        <Link className="font-semibold text-ink underline" href={`${isLogin ? "/register" : "/login"}?next=${encodeURIComponent(next)}`}>
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}

export function Field({ name, label, type = "text", error, hint, autoComplete, defaultValue, required = true }: {
  name: string; label: string; type?: string; error?: string; hint?: string; autoComplete?: string; defaultValue?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} className="input" autoComplete={autoComplete} defaultValue={defaultValue} required={required}
        aria-invalid={!!error} aria-describedby={error ? `${name}-err` : undefined} />
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p id={`${name}-err`} className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
