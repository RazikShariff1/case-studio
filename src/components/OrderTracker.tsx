import { STAGES, type OrderStatus } from "@/lib/orders";

/** Where an order is, as four steps: placed, packed, on the way, delivered. A cancelled order says so instead. */
export default function OrderTracker({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") return <p className="tx-ad__soft">This order was cancelled.</p>;
  const at = Math.max(0, STAGES.findIndex((s) => s.status === status));
  return (
    <ol className="tx-ad__track" aria-label="Order progress">
      {STAGES.map((s, i) => (
        <li key={s.status} className={i <= at ? "is-on" : ""} aria-current={i === at ? "step" : undefined}><i /><p>{s.label}</p></li>
      ))}
    </ol>
  );
}
