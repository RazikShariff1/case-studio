import { z } from "zod";
import { setItemQuantity } from "@/lib/cart";
import { ok, handleError, readJson } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// A cart has one line per variant, so the line's id is the variant's id.
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { quantity } = z.object({ quantity: z.number().int().min(0).max(10) }).parse(await readJson(req));
    return ok(await setItemQuantity(id, quantity));
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    return ok(await setItemQuantity(id, 0));
  } catch (e) {
    return handleError(e);
  }
}
