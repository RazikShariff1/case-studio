import { z } from "zod";
import { INDIAN_STATES, PHONE_RE, PIN_RE } from "@/lib/india";
import { requireToken } from "@/lib/auth";
import { readCart, hydrate, clearCart } from "@/lib/cart";
import { getFreshCatalog } from "@/lib/catalog";
import { placeOrder } from "@/lib/orders";
import { createAddress } from "@/lib/addresses";
import { ok, fail, handleError, readJson, HttpError } from "@/lib/api";

const schema = z.object({
  clientId: z.string().uuid("Please reload the page and try again"),
  name: z.string().trim().min(2, "Enter the recipient name").max(80),
  phone: z.string().trim().regex(PHONE_RE, "Enter a valid 10-digit mobile number"),
  line1: z.string().trim().min(3, "Enter your address").max(120),
  line2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2, "Enter your city").max(60),
  state: z.enum(INDIAN_STATES, { error: "Select your state" }),
  postal: z.string().trim().regex(PIN_RE, "Enter a valid 6-digit PIN code"),
  country: z.literal("India").default("India"),
  saveAddress: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const token = await requireToken();
    const ship = schema.parse(await readJson(req));

    const lines = await readCart();
    if (lines.length === 0) return fail("Your bag is empty", 400);

    // Read the catalogue fresh: the seller and price on each line must be today's, not up to half a minute old.
    const cart = hydrate(lines, await getFreshCatalog());
    if (cart.items.length < lines.length) throw new HttpError("Some items are no longer available. Please review your bag.", 409);

    let id: string;
    try {
      id = await placeOrder(token, {
        clientId: ship.clientId,
        items: cart.items.map((i) => ({ variantId: Number(i.variantId), sellerId: i.sellerId, quantity: i.quantity })),
        address: {
          name: ship.name, phone: ship.phone, line1: ship.line1, line2: ship.line2 ?? "", city: ship.city, state: ship.state,
          pincode: ship.postal, country: ship.country,
        },
      });
    } catch (e) {
      // order-svc answers 409 when stock ran out between the bag and the button.
      if (e instanceof HttpError && e.status === 409) throw new HttpError("Some items no longer have enough stock. Please review your bag.", 409);
      throw e;
    }

    await clearCart();

    // Best effort: a failure to remember the address must never fail an order that has been placed.
    if (ship.saveAddress) {
      await createAddress(token, {
        label: "", recipient: ship.name, phone: ship.phone, line1: ship.line1, line2: ship.line2 ?? "", city: ship.city, state: ship.state,
        postalCode: ship.postal, country: ship.country, isDefault: false,
      }).catch(() => undefined);
    }

    return ok({ id }, 201);
  } catch (e) {
    return handleError(e);
  }
}
