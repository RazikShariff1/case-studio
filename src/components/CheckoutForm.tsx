"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Field, StateSelect } from "./Field";
import { INDIAN_STATES } from "@/lib/india";
import type { SavedAddress } from "@/lib/addresses";

export default function CheckoutForm({ defaultName, defaultPhone, addresses }: { defaultName: string; defaultPhone: string; addresses: SavedAddress[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  // One id per visit to this page: a double click or a retry places the same order, never two.
  const [clientId] = useState(() => crypto.randomUUID());
  const [picked, setPicked] = useState<string>(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "new");
  const chosen = addresses.find((a) => a.id === picked);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError(""); setFields({});
    const form = new FormData(e.currentTarget);
    const body = { ...Object.fromEntries(form), clientId, saveAddress: picked === "new" && form.get("saveAddress") === "on" };
    const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setBusy(false); setError(data.error ?? "Could not place your order"); setFields(data.fields ?? {}); return; }
    router.push(`/orders/${data.id}?placed=1`);
    router.refresh();
  }

  return (
    <form id="checkout" onSubmit={submit} className="space-y-10" noValidate>
      <section aria-labelledby="delivery">
        <h2 id="delivery" className="text-[24px] font-semibold tracking-tight">Where should we deliver?</h2>

        {addresses.length > 0 && (
          <fieldset className="mt-5 grid gap-3 sm:grid-cols-2">
            <legend className="sr-only">Saved addresses</legend>
            {addresses.map((a) => (
              <label key={a.id} className={`cursor-pointer rounded-2xl border p-4 text-[14px] leading-snug transition ${picked === a.id ? "border-blue ring-1 ring-blue" : "border-line hover:border-ink/40"}`}>
                <input type="radio" name="saved" className="sr-only" checked={picked === a.id} onChange={() => setPicked(a.id)} />
                <span className="block text-[15px] font-semibold">{a.recipient}{a.label && <span className="ml-2 font-normal text-muted">{a.label}</span>}</span>
                <span className="block text-muted">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</span>
                <span className="block text-muted">{a.city}, {a.state} {a.postalCode}</span>
              </label>
            ))}
            <label className={`cursor-pointer rounded-2xl border p-4 text-[15px] font-semibold transition ${picked === "new" ? "border-blue ring-1 ring-blue" : "border-line hover:border-ink/40"}`}>
              <input type="radio" name="saved" className="sr-only" checked={picked === "new"} onChange={() => setPicked("new")} />
              Use a different address
            </label>
          </fieldset>
        )}

        {/* Remounted when the choice changes, so the fields start from the chosen address. */}
        <div key={picked} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="name" label="Full name" defaultValue={chosen?.recipient ?? defaultName} autoComplete="name" error={fields.name} />
            <Field name="phone" type="tel" inputMode="tel" label="Mobile number" defaultValue={chosen?.phone ?? defaultPhone} autoComplete="tel" hint="10 digits, for the delivery partner" error={fields.phone} />
          </div>
          <Field name="line1" label="Flat, house no., street, area" defaultValue={chosen?.line1} autoComplete="address-line1" error={fields.line1} />
          <Field name="line2" label="Apartment, suite, etc. (optional)" defaultValue={chosen?.line2} autoComplete="address-line2" required={false} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field name="city" label="City" defaultValue={chosen?.city} autoComplete="address-level2" error={fields.city} />
            <StateSelect states={INDIAN_STATES} defaultValue={chosen?.state ?? ""} error={fields.state} />
            <Field name="postal" label="PIN code" defaultValue={chosen?.postalCode} inputMode="numeric" autoComplete="postal-code" hint="6 digits" error={fields.postal} />
          </div>
          <input type="hidden" name="country" value="India" />
          {picked === "new" && (
            <label className="flex items-center gap-3 text-[15px]">
              <input type="checkbox" name="saveAddress" defaultChecked className="h-5 w-5 accent-[#0071e3]" /> Save this address for next time
            </label>
          )}
        </div>
      </section>

      <section aria-labelledby="payment">
        <h2 id="payment" className="text-[24px] font-semibold tracking-tight">How would you like to pay?</h2>
        <div className="mt-5 rounded-2xl border border-blue p-5 ring-1 ring-blue">
          <p className="text-[17px] font-semibold">Cash on delivery</p>
          <p className="mt-0.5 text-[14px] text-muted">Pay when your order arrives. UPI and card payments are coming soon.</p>
        </div>
      </section>

      {error && <p role="alert" className="text-[14px] text-danger">{error}</p>}
      <button className="btn btn-blue btn-block md:w-auto md:min-w-64" disabled={busy}>{busy ? "Placing your order…" : "Place Order"}</button>
    </form>
  );
}
