import { z } from "zod";
import { addToCart, getCartData } from "@/lib/cart";
import { ok, handleError, readJson } from "@/lib/api";

export async function GET() {
  return ok(await getCartData());
}

const schema = z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(10).default(1) });

export async function POST(req: Request) {
  try {
    const { variantId, quantity } = schema.parse(await readJson(req));
    await addToCart(variantId, quantity);
    return ok(await getCartData(), 201);
  } catch (e) {
    return handleError(e);
  }
}
