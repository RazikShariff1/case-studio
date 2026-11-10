import { z } from "zod";
import { addToCart, getCartData, MAX_PER_LINE } from "@/lib/cart";
import { ok, handleError, readJson } from "@/lib/api";

export async function GET() {
  try {
    return ok(await getCartData());
  } catch (e) {
    return handleError(e);
  }
}

const schema = z.object({ variantId: z.string().regex(/^\d+$/), quantity: z.number().int().min(1).max(MAX_PER_LINE).default(1) });

export async function POST(req: Request) {
  try {
    const { variantId, quantity } = schema.parse(await readJson(req));
    return ok(await addToCart(variantId, quantity), 201);
  } catch (e) {
    return handleError(e);
  }
}
