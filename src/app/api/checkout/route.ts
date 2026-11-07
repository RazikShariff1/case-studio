import { randomBytes } from "node:crypto";
import { z } from "zod";
import { INDIAN_STATES, PHONE_RE, PIN_RE } from "@/lib/india";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { findCart } from "@/lib/cart";
import { shippingFor } from "@/lib/money";
import { ok, fail, handleError, readJson, HttpError } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(2, "Enter the recipient name").max(80),
  phone: z.string().trim().regex(PHONE_RE, "Enter a valid 10-digit mobile number"),
  line1: z.string().trim().min(3, "Enter your address").max(120),
  line2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2, "Enter your city").max(60),
  state: z.enum(INDIAN_STATES, { error: "Select your state" }),
  postal: z.string().trim().regex(PIN_RE, "Enter a valid 6-digit PIN code"),
  country: z.literal("India").default("India"),
});

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) return fail("Please sign in to place your order", 401);
    const ship = schema.parse(await readJson(req));

    const cart = await findCart();
    if (!cart || cart.items.length === 0) return fail("Your cart is empty", 400);

    const order = await prisma.$transaction(async (tx) => {
      // Decrement stock for every line in ONE statement (fewer round trips to a remote DB).
      // A line that lacks stock isn't updated, so the count falls short and the whole order aborts.
      const ids = cart.items.map((i) => i.variantId);
      const qtys = cart.items.map((i) => i.quantity);
      const updated = await tx.$executeRaw`
        UPDATE "Variant" v SET stock = v.stock - t.q
        FROM (SELECT unnest(${ids}::text[]) AS id, unnest(${qtys}::int[]) AS q) t
        WHERE v.id = t.id AND v.stock >= t.q`;
      if (updated !== cart.items.length) {
        throw new HttpError("Some items no longer have enough stock. Please review your cart.", 409);
      }
      const subtotal = cart.items.reduce((s, i) => s + i.variant.product.priceCents * i.quantity, 0);
      const shipping = shippingFor(subtotal);
      const created = await tx.order.create({
        data: {
          number: `CS-${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString("hex").toUpperCase()}`,
          userId: user.id,
          subtotalCents: subtotal,
          shippingCents: shipping,
          totalCents: subtotal + shipping,
          paymentMethod: "COD",
          shipName: ship.name, shipPhone: ship.phone, shipLine1: ship.line1, shipLine2: ship.line2 || null,
          shipCity: ship.city, shipState: ship.state, shipPostal: ship.postal, shipCountry: ship.country,
          items: {
            create: cart.items.map((i) => ({
              variantId: i.variantId,
              name: i.variant.product.name,
              image: i.variant.product.image,
              model: i.variant.model,
              color: i.variant.color,
              unitCents: i.variant.product.priceCents,
              quantity: i.quantity,
            })),
          },
        },
      });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    }, { maxWait: 10_000, timeout: 20_000 });

    return ok({ id: order.id, number: order.number }, 201);
  } catch (e) {
    return handleError(e);
  }
}
