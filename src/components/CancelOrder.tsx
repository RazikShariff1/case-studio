"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CancelOrder({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function cancel() {
    setBusy(true); setError("");
    const res = await fetch(`/api/orders/${id}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "Cancelled by customer" }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Could not cancel this order");
    setOpen(false);
    router.refresh();
  }

  if (!open) return <button className="link text-[15px]" onClick={() => setOpen(true)}>Cancel order</button>;

  return (
    <div role="alertdialog" aria-label="Cancel this order?" className="tile p-6">
      <p className="text-[19px] font-semibold tracking-tight">Cancel this order?</p>
      <p className="mt-1 text-[14px] text-muted">The items go back on the shelf. You have not paid anything.</p>
      {error && <p role="alert" className="mt-3 text-[14px] text-danger">{error}</p>}
      <div className="mt-5 flex gap-3">
        <button className="btn btn-dark btn-sm" onClick={cancel} disabled={busy}>{busy ? "Cancelling…" : "Yes, cancel it"}</button>
        <button className="btn btn-plain btn-sm" onClick={() => setOpen(false)} disabled={busy}>Keep my order</button>
      </div>
    </div>
  );
}
