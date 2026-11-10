import { STAGES, type OrderStatus } from "@/lib/orders";

/** Where an order is, as four steps: placed, packed, on the way, delivered. A cancelled order says so instead. */
export default function OrderTracker({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") {
    return <p className="rounded-2xl bg-surface px-5 py-4 text-[17px] font-semibold text-danger">This order was cancelled.</p>;
  }
  const at = Math.max(0, STAGES.findIndex((s) => s.status === status));
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
      {STAGES.map((s, i) => (
        <li key={s.status} aria-current={i === at ? "step" : undefined}>
          <div className={`h-1.5 rounded-full ${i <= at ? "bg-good" : "bg-surface-2"}`} />
          <p className={`mt-2 text-[12px] leading-tight sm:text-[14px] ${i <= at ? "font-semibold text-ink" : "text-muted"}`}>{s.label}</p>
        </li>
      ))}
    </ol>
  );
}
