import { z } from "zod";
import { setItemQuantity, getCartData } from "@/lib/cart";
import { ok, handleError, readJson } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { quantity } = z.object({ quantity: z.number().int().min(0).max(10) }).parse(await readJson(req));
    await setItemQuantity(id, quantity);
    return ok(await getCartData());
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await setItemQuantity(id, 0);
    return ok(await getCartData());
  } catch (e) {
    return handleError(e);
  }
}
