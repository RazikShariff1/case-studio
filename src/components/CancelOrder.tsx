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

  if (!open) return <button type="button" className="tx-ad__mini tx-ad__mini--danger" onClick={() => setOpen(true)}>Cancel order</button>;

  return (
    <div role="alertdialog" aria-label="Cancel this order?" className="tx-ad__inline tx-ad__inline--confirm">
      <div className="tx-ad__form">
        <p className="tx-ad__confirm-title">Cancel this order?</p>
        <p className="tx-ad__soft">The items go back on the shelf. You have not paid anything.</p>
        {error && <p role="alert" className="tx-ad__form-error">{error}</p>}
        <div className="tx-ad__sheet-foot">
          <button type="button" className="tx-ad__btn tx-ad__btn--light" onClick={() => setOpen(false)} disabled={busy}>Keep my order</button>
          <button type="button" className="tx-ad__btn tx-ad__btn--danger" onClick={cancel} disabled={busy}>{busy ? "Cancelling…" : "Yes, cancel it"}</button>
        </div>
      </div>
    </div>
  );
}
