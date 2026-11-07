import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { getUser } from "./auth";
import { HttpError } from "./api";
import { shippingFor } from "./money";

const CART_COOKIE = "cart_id";

const include = {
  items: {
    orderBy: { id: "asc" },
    include: { variant: { include: { product: true } } },
  },
} satisfies Prisma.CartInclude;

type CartRow = Prisma.CartGetPayload<{ include: typeof include }>;

export type CartLine = {
  id: string;
  variantId: string;
  quantity: number;
  stock: number;
  name: string;
  slug: string;
  image: string;
  imagePosition: string;
  model: string;
  color: string;
  unitCents: number;
};
export type CartData = {
  items: CartLine[];
  count: number;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
};

export function serializeCart(cart: CartRow | null): CartData {
  const items: CartLine[] = (cart?.items ?? []).map((i) => ({
    id: i.id,
    variantId: i.variantId,
    quantity: i.quantity,
    stock: i.variant.stock,
    name: i.variant.product.name,
    slug: i.variant.product.slug,
    image: i.variant.product.image,
    imagePosition: i.variant.product.imagePosition,
    model: i.variant.model,
    color: i.variant.color,
    unitCents: i.variant.product.priceCents,
  }));
  const subtotalCents = items.reduce((s, i) => s + i.unitCents * i.quantity, 0);
  const shippingCents = shippingFor(subtotalCents);
  return {
    items,
    count: items.reduce((s, i) => s + i.quantity, 0),
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
  };
}

/** Read-only: safe in Server Components. Returns null if no cart exists yet. */
export async function findCart(): Promise<CartRow | null> {
  const user = await getUser();
  if (user) return prisma.cart.findUnique({ where: { userId: user.id }, include });
  const id = (await cookies()).get(CART_COOKIE)?.value;
  if (!id) return null;
  return prisma.cart.findFirst({ where: { id, userId: null }, include });
}

export async function getCartData() {
  return serializeCart(await findCart());
}

/** Route handlers only (may set a cookie). */
export async function getOrCreateCart(): Promise<CartRow> {
  const existing = await findCart();
  if (existing) return existing;
  const user = await getUser();
  const cart = await prisma.cart.create({ data: { userId: user?.id }, include });
  if (!user) {
    (await cookies()).set(CART_COOKIE, cart.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 60,
    });
  }
  return cart;
}

export async function addToCart(variantId: string, quantity: number) {
  const variant = await prisma.variant.findUnique({ where: { id: variantId } });
  if (!variant) throw new HttpError("That option is no longer available", 404);
  const cart = await getOrCreateCart();
  const current = cart.items.find((i) => i.variantId === variantId)?.quantity ?? 0;
  const next = current + quantity;
  if (variant.stock <= 0) throw new HttpError("Sorry, this option is out of stock", 409);
  if (next > variant.stock) throw new HttpError(`Only ${variant.stock} left in stock`, 409);
  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: { cartId: cart.id, variantId, quantity },
    update: { quantity: next },
  });
}

export async function setItemQuantity(itemId: string, quantity: number) {
  const cart = await findCart();
  const item = cart?.items.find((i) => i.id === itemId);
  if (!cart || !item) throw new HttpError("Item not found", 404);
  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    return;
  }
  if (quantity > item.variant.stock) throw new HttpError(`Only ${item.variant.stock} left in stock`, 409);
  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
}

/** After login/register: fold the guest cart (cookie) into the user's cart. */
export async function mergeGuestCart(userId: string) {
  const jar = await cookies();
  const guestId = jar.get(CART_COOKIE)?.value;
  if (!guestId) return;
  jar.delete(CART_COOKIE);
  const guest = await prisma.cart.findFirst({ where: { id: guestId, userId: null }, include: { items: true } });
  if (!guest) return;
  const mine = await prisma.cart.findUnique({ where: { userId }, include: { items: true } });
  if (!mine) {
    await prisma.cart.update({ where: { id: guest.id }, data: { userId } });
    return;
  }
  await prisma.$transaction(async (tx) => {
    for (const g of guest.items) {
      const v = await tx.variant.findUnique({ where: { id: g.variantId } });
      if (!v) continue;
      const have = mine.items.find((i) => i.variantId === g.variantId)?.quantity ?? 0;
      const quantity = Math.min(have + g.quantity, v.stock);
      if (quantity <= 0) continue;
      await tx.cartItem.upsert({
        where: { cartId_variantId: { cartId: mine.id, variantId: g.variantId } },
        create: { cartId: mine.id, variantId: g.variantId, quantity },
        update: { quantity },
      });
    }
    await tx.cart.delete({ where: { id: guest.id } });
  });
}
