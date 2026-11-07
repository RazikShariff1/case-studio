"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Field } from "./AuthForm";
import { INDIAN_STATES } from "@/lib/india";

export default function CheckoutForm({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError(""); setFields({});
    const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setBusy(false); setError(data.error ?? "Could not place order"); setFields(data.fields ?? {}); return; }
    router.push(`/orders/${data.id}?placed=1`);
    router.refresh();
  }

  return (
    <form id="checkout" onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="Full name" defaultValue={defaultName} autoComplete="name" error={fields.name} />
        <Field name="phone" type="tel" label="Mobile number" autoComplete="tel" hint="10-digit number, e.g. 98765 43210" error={fields.phone} />
      </div>
      <Field name="line1" label="Flat / house no., street, area" autoComplete="address-line1" error={fields.line1} />
      <Field name="line2" label="Apartment, suite, etc. (optional)" autoComplete="address-line2" required={false} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field name="city" label="City" autoComplete="address-level2" error={fields.city} />
        <div>
          <label className="label" htmlFor="state">State</label>
          <select id="state" name="state" required defaultValue="" autoComplete="address-level1" className="input" aria-invalid={!!fields.state}>
            <option value="" disabled>Select state</option>
            {INDIAN_STATES.map((st) => <option key={st}>{st}</option>)}
          </select>
          {fields.state && <p className="mt-1 text-xs text-danger">{fields.state}</p>}
        </div>
        <Field name="postal" label="PIN code" autoComplete="postal-code" hint="6 digits" error={fields.postal} />
      </div>
      <input type="hidden" name="country" value="India" />
      <div className="rounded-2xl border border-line bg-cream p-4 text-sm">
        <p className="font-semibold">Payment</p>
        <p className="text-muted">Cash on delivery. UPI and card payments are coming soon.</p>
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <button className="btn btn-dark w-full py-4" disabled={busy}>{busy ? "Placing order…" : "Place order"}</button>
    </form>
  );
}
