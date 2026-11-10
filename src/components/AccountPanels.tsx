"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Field, StateSelect } from "./Field";
import { INDIAN_STATES } from "@/lib/india";
import type { SavedAddress } from "@/lib/addresses";

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data } as { ok: boolean; data: { error?: string; fields?: Record<string, string> } };
}

function Status({ text, ok }: { text: string; ok: boolean }) {
  return text ? <p role={ok ? "status" : "alert"} className={`text-[14px] ${ok ? "text-good" : "text-danger"}`}>{text}</p> : null;
}

export function ProfileForm({ name, email, phone }: { name: string; email: string; phone: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: true });
  const [fields, setFields] = useState<Record<string, string>>({});

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMsg({ text: "", ok: true }); setFields({});
    const r = await send("/api/account/profile", "PUT", Object.fromEntries(new FormData(e.currentTarget)));
    setBusy(false);
    if (!r.ok) { setFields(r.data.fields ?? {}); return setMsg({ text: r.data.error ?? "Could not save", ok: false }); }
    setMsg({ text: "Saved.", ok: true });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field name="name" label="Full name" defaultValue={name} autoComplete="name" error={fields.name} />
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" className="input bg-surface text-muted" value={email} disabled readOnly />
      </div>
      <Field name="phone" type="tel" inputMode="tel" label="Mobile number" defaultValue={phone} autoComplete="tel" required={false} error={fields.phone} />
      <Status {...msg} />
      <button className="btn btn-dark btn-sm" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
    </form>
  );
}

export function PasswordForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: true });
  const [fields, setFields] = useState<Record<string, string>>({});

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMsg({ text: "", ok: true }); setFields({});
    const r = await send("/api/account/password", "PUT", Object.fromEntries(new FormData(e.currentTarget)));
    setBusy(false);
    if (!r.ok) { setFields(r.data.fields ?? {}); return setMsg({ text: r.data.error ?? "Could not change your password", ok: false }); }
    // Changing the password signs every device out, this one included.
    router.push("/login?next=/account");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field name="currentPassword" type="password" label="Current password" autoComplete="current-password" error={fields.currentPassword} />
      <Field name="newPassword" type="password" label="New password" autoComplete="new-password" hint="At least 8 characters. You will be signed out everywhere afterwards." error={fields.newPassword} />
      <Status {...msg} />
      <button className="btn btn-dark btn-sm" disabled={busy}>{busy ? "Changing…" : "Change password"}</button>
    </form>
  );
}

export function AddressBook({ addresses }: { addresses: SavedAddress[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<SavedAddress | "new" | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: true });
  const [fields, setFields] = useState<Record<string, string>>({});
  const current = editing && editing !== "new" ? editing : null;

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMsg({ text: "", ok: true }); setFields({});
    const f = new FormData(e.currentTarget);
    const body = { ...Object.fromEntries(f), isDefault: f.get("isDefault") === "on" };
    const r = current ? await send(`/api/account/addresses/${current.id}`, "PUT", body) : await send("/api/account/addresses", "POST", body);
    setBusy(false);
    if (!r.ok) { setFields(r.data.fields ?? {}); return setMsg({ text: r.data.error ?? "Could not save the address", ok: false }); }
    setEditing(null);
    router.refresh();
  }

  async function remove(a: SavedAddress) {
    if (!confirm("Remove this address?")) return;
    const r = await send(`/api/account/addresses/${a.id}`, "DELETE");
    if (!r.ok) return setMsg({ text: r.data.error ?? "Could not remove the address", ok: false });
    router.refresh();
  }

  return (
    <div>
      {addresses.length === 0 && !editing && <p className="text-[15px] text-muted">You have no saved addresses yet.</p>}
      <ul className="grid gap-3 sm:grid-cols-2">
        {addresses.map((a) => (
          <li key={a.id} className="card p-5 text-[14px] leading-snug">
            <p className="text-[15px] font-semibold">{a.recipient}{a.isDefault && <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted">Default</span>}</p>
            {a.label && <p className="text-muted">{a.label}</p>}
            <p className="mt-1 text-muted">{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}, {a.state} {a.postalCode}<br />{a.phone}</p>
            <div className="mt-3 flex gap-5">
              <button className="link" onClick={() => { setEditing(a); setMsg({ text: "", ok: true }); setFields({}); }}>Edit</button>
              <button className="link" onClick={() => remove(a)}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
      <Status {...msg} />

      {editing ? (
        <form key={current?.id ?? "new"} onSubmit={save} className="tile mt-6 space-y-4 p-6" noValidate>
          <h3 className="text-[19px] font-semibold tracking-tight">{current ? "Edit address" : "New address"}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="recipient" label="Full name" defaultValue={current?.recipient} autoComplete="name" error={fields.recipient} />
            <Field name="phone" type="tel" inputMode="tel" label="Mobile number" defaultValue={current?.phone} autoComplete="tel" error={fields.phone} />
          </div>
          <Field name="label" label="Label (optional)" defaultValue={current?.label} hint="For example Home or Office" required={false} />
          <Field name="line1" label="Flat, house no., street, area" defaultValue={current?.line1} autoComplete="address-line1" error={fields.line1} />
          <Field name="line2" label="Apartment, suite, etc. (optional)" defaultValue={current?.line2} autoComplete="address-line2" required={false} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field name="city" label="City" defaultValue={current?.city} autoComplete="address-level2" error={fields.city} />
            <StateSelect states={INDIAN_STATES} defaultValue={current?.state ?? ""} error={fields.state} />
            <Field name="postalCode" label="PIN code" defaultValue={current?.postalCode} inputMode="numeric" autoComplete="postal-code" error={fields.postalCode} />
          </div>
          <input type="hidden" name="country" value="India" />
          <label className="flex items-center gap-3 text-[15px]"><input type="checkbox" name="isDefault" defaultChecked={current?.isDefault} className="h-5 w-5 accent-[#0071e3]" /> Make this my default address</label>
          <div className="flex gap-3">
            <button className="btn btn-blue btn-sm" disabled={busy}>{busy ? "Saving…" : "Save address"}</button>
            <button type="button" className="btn btn-plain btn-sm" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="btn btn-plain btn-sm mt-5" onClick={() => { setEditing("new"); setMsg({ text: "", ok: true }); setFields({}); }} disabled={addresses.length >= 20}>Add an address</button>
      )}
    </div>
  );
}

export function SignOut() {
  const router = useRouter();
  return (
    <button className="btn btn-plain btn-sm" onClick={async () => { await send("/api/auth/logout", "POST"); router.push("/"); router.refresh(); }}>Sign out</button>
  );
}
