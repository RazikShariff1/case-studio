import { requireToken } from "@/lib/auth";
import { listOrders } from "@/lib/orders";
import { ok, handleError } from "@/lib/api";

export async function GET() {
  try {
    return ok({ orders: await listOrders(await requireToken()) });
  } catch (e) {
    return handleError(e);
  }
}
