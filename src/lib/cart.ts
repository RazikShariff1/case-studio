/**
 * The cart lives in a cookie: a short list of `{variantId, quantity}`. The platform has no cart service, and nothing in a cart
 * is trusted: every line is re-read against the live catalogue (price, stock, seller) when it is shown, and again at checkout,
 * where order-svc prices the order from inventory-svc itself. Signing in does not change the cart, so there is nothing to merge.
 */
import { cookies } from "next/headers";
import { cache } from "react";
import { HttpError } from "./api";
import { getCatalog, type Catalog } from "./catalog";

const CART_COOKIE = "cart";
const MAX_LINES = 30;
export const MAX_PER_LINE = 10;

export type RawLine = { v: string; q: number };

export type CartLine = {
  /** The variant id: a cart has one line per variant. */
  id: string;
  variantId: string;
  sellerId: number;
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

const clamp = (q: number, max: number) => Math.max(0, Math.min(Math.floor(q), max));

function parse(raw: string | undefined): RawLine[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    const seen = new Set<string>();
    const out: RawLine[] = [];
    for (const l of v) {
      if (typeof l?.v !== "string" || !/^\d+$/.test(l.v) || typeof l?.q !== "number" || seen.has(l.v)) continue;
      const q = clamp(l.q, MAX_PER_LINE);
      if (q > 0) {
        seen.add(l.v);
        out.push({ v: l.v, q });
      }
      if (out.length >= MAX_LINES) break;
    }
    return out;
  } catch {
    return [];
  }
}

/** Read-only: safe in Server Components. */
export const readCart = cache(async () => parse((await cookies()).get(CART_COOKIE)?.value));

/** Route handlers only (sets a cookie). */
async function writeCart(lines: RawLine[]) {
  const jar = await cookies();
  if (lines.length === 0) {
    jar.delete(CART_COOKIE);
    return;
  }
  jar.set(CART_COOKIE, JSON.stringify(lines), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
}

/** Turns raw lines into a priced cart. Lines whose variant is gone or sold out are left out. */
export function hydrate(lines: RawLine[], catalog: Catalog): CartData {
  const items: CartLine[] = [];
  for (const l of lines) {
    const hit = catalog.byVariant.get(l.v);
    if (!hit || hit.variant.stock <= 0) continue;
    const { product: p, variant: v } = hit;
    items.push({
      id: v.id,
      variantId: v.id,
      sellerId: v.sellerId,
      quantity: clamp(l.q, v.stock),
      stock: v.stock,
      name: p.name,
      slug: p.slug,
      image: p.image,
      imagePosition: p.imagePosition,
      model: v.model,
      color: v.color,
      unitCents: v.priceCents,
    });
  }
  const subtotalCents = items.reduce((s, i) => s + i.unitCents * i.quantity, 0);
  return {
    items,
    count: items.reduce((s, i) => s + i.quantity, 0),
    subtotalCents,
    shippingCents: 0, // the platform does not charge for delivery
    totalCents: subtotalCents,
  };
}

const EMPTY: Catalog = { products: [], byVariant: new Map() };

export async function getCartData(): Promise<CartData> {
  const lines = await readCart();
  // An empty bag needs no catalogue, so the header never waits on the platform for it.
  return hydrate(lines, lines.length ? await getCatalog() : EMPTY);
}

export async function addToCart(variantId: string, quantity: number): Promise<CartData> {
  const catalog = await getCatalog();
  const hit = catalog.byVariant.get(variantId);
  if (!hit) throw new HttpError("That option is no longer available", 404);

  const lines = parse((await cookies()).get(CART_COOKIE)?.value);
  const have = lines.find((l) => l.v === variantId)?.q ?? 0;
  const { stock } = hit.variant;
  if (stock <= 0) throw new HttpError("Sorry, this option is out of stock", 409);
  if (have + quantity > stock) throw new HttpError(`Only ${stock} left in stock`, 409);
  if (have + quantity > MAX_PER_LINE) throw new HttpError(`You can order up to ${MAX_PER_LINE} of one item`, 409);

  const next = have ? lines.map((l) => (l.v === variantId ? { v: l.v, q: have + quantity } : l)) : [...lines, { v: variantId, q: quantity }];
  if (next.length > MAX_LINES) throw new HttpError("Your bag is full", 409);
  await writeCart(next);
  return hydrate(next, catalog);
}

export async function setItemQuantity(variantId: string, quantity: number): Promise<CartData> {
  const catalog = await getCatalog();
  const lines = parse((await cookies()).get(CART_COOKIE)?.value);
  if (!lines.some((l) => l.v === variantId)) throw new HttpError("Item not found", 404);

  if (quantity > 0) {
    const stock = catalog.byVariant.get(variantId)?.variant.stock ?? 0;
    if (quantity > stock) throw new HttpError(`Only ${stock} left in stock`, 409);
  }

  const next = lines.flatMap((l) => (l.v !== variantId ? [l] : quantity > 0 ? [{ v: l.v, q: clamp(quantity, MAX_PER_LINE) }] : []));
  await writeCart(next);
  return hydrate(next, catalog);
}

export async function clearCart() {
  await writeCart([]);
}
