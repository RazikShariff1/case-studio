import { z } from "zod";
import { requireToken } from "@/lib/auth";
import { cancelOrder } from "@/lib/orders";
import { ok, handleError, readJson } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({ reason: z.string().trim().max(200).default("Cancelled by customer") });

export async function POST(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { reason } = schema.parse(await readJson(req).catch(() => ({})));
    await cancelOrder(await requireToken(), id, reason);
    return ok({ ok: true });
  } catch (e) {
    // order-svc says 409 when the order is already packed: only a pending order can be cancelled.
    return handleError(e, { 409: "This order has already been packed and can no longer be cancelled" });
  }
}
