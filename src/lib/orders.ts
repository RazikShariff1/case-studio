/** Orders, from order-svc. The platform's order lines carry only a variant id and a price, so names and photos are re-joined from the catalogue. */
import { HttpError } from "./api";
import { store, type Page } from "./platform";
import { getCatalog } from "./catalog";
import { toPaise } from "./money";

type PItem = { id: number; variantId: number; sellerId: number; quantity: number; unitPrice: number; lineTotal: number };
type PAddress = { name: string; phone: string; line1: string; line2: string; city: string; state: string; pincode: string; country: string };
type POrder = {
  referenceNumber: number; status: string; paymentMethod: string; paymentStatus: string; subtotal: number; discountTotal: number; total: number;
  deliveryAddress: PAddress; notes: string; cancellationReason: string; items: PItem[] | null; createdAt: string; completedAt: string | null;
};

export type OrderStatus = "PENDING" | "PACKED" | "DISPATCHED" | "COMPLETED" | "CANCELLED";

/** The stages an order passes through, in order, with the words shoppers see. */
export const STAGES: { status: OrderStatus; label: string }[] = [
  { status: "PENDING", label: "Order placed" },
  { status: "PACKED", label: "Packed" },
  { status: "DISPATCHED", label: "On the way" },
  { status: "COMPLETED", label: "Delivered" },
];

export const statusLabel = (s: string) => (s === "CANCELLED" ? "Cancelled" : (STAGES.find((x) => x.status === s)?.label ?? s.toLowerCase()));

export type OrderLine = { id: string; name: string; slug: string | null; image: string; model: string; color: string; unitCents: number; quantity: number };
export type Order = {
  id: string; // the order's reference number
  number: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  address: PAddress;
  cancellationReason: string;
  createdAt: Date;
  items: OrderLine[];
};

async function shape(orders: POrder[]): Promise<Order[]> {
  const { byVariant } = await getCatalog();
  return orders.map((o) => ({
    id: String(o.referenceNumber),
    number: `#${o.referenceNumber}`,
    status: o.status as OrderStatus,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    subtotalCents: toPaise(o.subtotal),
    discountCents: toPaise(o.discountTotal ?? 0),
    totalCents: toPaise(o.total),
    address: o.deliveryAddress,
    cancellationReason: o.cancellationReason ?? "",
    createdAt: new Date(o.createdAt),
    items: (o.items ?? []).map((i) => {
      const hit = byVariant.get(String(i.variantId));
      return {
        id: String(i.id),
        name: hit?.product.name ?? `Item ${i.variantId}`,
        slug: hit?.product.slug ?? null,
        image: hit?.product.image ?? "/site/no-photo.png",
        model: hit?.variant.model ?? "",
        color: hit?.variant.color ?? "",
        unitCents: toPaise(i.unitPrice),
        quantity: i.quantity,
      };
    }),
  }));
}

/** The shopper's orders, newest first. order-svc only ever returns their own. */
export async function listOrders(token: string): Promise<Order[]> {
  const p = await store<Page<"order", POrder>>("/order-svc/order?limit=50", { token });
  return shape(p.order ?? []);
}

/** One of the shopper's orders; null when it does not exist or is not theirs (order-svc answers 404 for both). */
export async function getOrder(token: string, ref: string): Promise<Order | null> {
  if (!/^\d+$/.test(ref)) return null;
  try {
    const p = await store<{ order: POrder }>(`/order-svc/order/${ref}`, { token });
    return (await shape([p.order]))[0];
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return null;
    throw e;
  }
}

export async function cancelOrder(token: string, ref: string, reason: string) {
  if (!/^\d+$/.test(ref)) throw new HttpError("Order not found", 404);
  await store(`/order-svc/order/${ref}`, { method: "PATCH", token, body: { status: "CANCELLED", cancellationReason: reason } });
}

export type PlaceInput = {
  clientId: string;
  items: { variantId: number; sellerId: number; quantity: number }[];
  address: PAddress;
};

/** Places a cash-on-delivery order. The same clientId returns the same order, so a double click or a retry cannot place two. */
export async function placeOrder(token: string, input: PlaceInput): Promise<string> {
  const p = await store<{ order: POrder }>("/order-svc/order", {
    method: "POST",
    token,
    body: { clientId: input.clientId, items: input.items, deliveryAddress: input.address, paymentMethod: "COD" },
  });
  return String(p.order.referenceNumber);
}
