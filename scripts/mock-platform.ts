/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * A tiny in-memory stand-in for the platform's /store gateway, for working on the storefront without the real services:
 *
 *   npm run mock                       # listens on :4000
 *   PLATFORM_URL=http://localhost:4000 npm run dev
 *
 * It speaks the same shapes as customer-svc, catalogue-svc, inventory-svc and order-svc (GoFr's {"data": ...} envelope) and
 * serves data/products.ts as the catalogue. Nothing is persisted. It is a development aid, not a model of the services' rules.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomBytes } from "node:crypto";
import { PRODUCTS, COLOR_HEX } from "../data/products";
import { PHONE_MODELS, CATEGORIES } from "../src/lib/catalog-constants";

const PORT = Number(process.env.PORT ?? 4000);
const now = () => new Date().toISOString();
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// ---- catalogue ----
const categories = CATEGORIES.map((c, i) => ({ id: i + 1, slug: c.slug, name: c.label, status: "ENABLED" }));
let nextVariant = 1;
const stock = new Map<number, number>();
const catalogue = PRODUCTS.map((p) => ({
  id: p.n, slug: slugify(p.name), name: p.name, tagLine: "", description: p.desc, images: [`/products/${p.n}.jpeg`], status: "ENABLED",
  primaryCategoryId: categories.find((c) => c.slug === p.category)!.id, createdAt: new Date(Date.now() - p.n * 864e5).toISOString(),
  metaData: { features: p.features, rating: p.rating, reviewCount: p.reviews, featured: !!p.featured },
  price: p.price, mrp: p.compareAt ?? p.price,
  variants: PHONE_MODELS.flatMap((model, mi) => p.colors.map((color, ci) => {
    const id = nextVariant++;
    stock.set(id, (p.n + mi + ci) % 9 === 0 ? 0 : 6 + ((p.n * 3 + mi * 5 + ci * 7) % 25));
    return { id, productId: p.n, status: "ENABLED", name: `${model} · ${color}`, images: [], metaData: { model, color, colorHex: COLOR_HEX[color] } };
  })),
}));
const variantInfo = new Map(catalogue.flatMap((p) => p.variants.map((v) => [v.id, p] as const)));

// ---- accounts and orders ----
type Customer = { id: number; name: string; email: string; phone: string; status: string; password: string };
type Address = { id: number; customerId: number; label: string; recipient: string; phone: string; line1: string; line2: string; city: string; state: string; postalCode: string; country: string; isDefault: boolean };
const customers: Customer[] = [];
const sessions = new Map<string, { customerId: number; expiresAt: string }>();
const addresses: Address[] = [];
const orders: any[] = [];
let nextCustomer = 1, nextAddress = 1, nextOrder = 1000;

const body = async (req: IncomingMessage) => { let s = ""; for await (const c of req) s += c; try { return s ? JSON.parse(s) : {}; } catch { return {}; } };
const send = (res: ServerResponse, status: number, data?: unknown) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(data === undefined ? "" : JSON.stringify({ data }));
};
const err = (res: ServerResponse, status: number, message: string) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: { message } })); };
const pub = (c: Customer) => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, status: c.status, lastLoginAt: null, createdAt: now(), updatedAt: now() });

function me(req: IncomingMessage) {
  const token = /^Bearer (.+)$/i.exec(req.headers.authorization ?? "")?.[1] ?? "";
  const s = sessions.get(token);
  return s ? { token, customer: customers.find((c) => c.id === s.customerId)!, expiresAt: s.expiresAt } : null;
}
function open(c: Customer) {
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 864e5).toISOString();
  sessions.set(token, { customerId: c.id, expiresAt });
  return { token, expiresAt, customer: pub(c) };
}

function offer(variantId: number) {
  const p = variantInfo.get(variantId);
  const qty = stock.get(variantId) ?? 0;
  if (!p) return null;
  const o = { sellerId: 1, available: qty, inStock: qty > 0, unlimitedStock: false, unit: 1, mrp: p.mrp, discount: p.mrp - p.price, sellingPrice: p.price };
  return { variantId, offers: [o], bestOffer: qty > 0 ? o : null };
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://x");
  const path = url.pathname.replace(/^\/store/, "");
  const m = req.method ?? "GET";
  const b = ["POST", "PUT", "PATCH"].includes(m) ? await body(req) : {};
  const sess = me(req);
  console.log(m, url.pathname + url.search);

  if (path === "/customer-svc/auth/register" && m === "POST") {
    if (customers.some((c) => c.email === b.email)) return err(res, 409, "entity already exists");
    const c: Customer = { id: nextCustomer++, name: b.name, email: String(b.email).toLowerCase(), phone: b.phone ?? "", status: "active", password: b.password };
    customers.push(c);
    return send(res, 201, open(c));
  }
  if (path === "/customer-svc/auth/login" && m === "POST") {
    const c = customers.find((x) => x.email === String(b.email).toLowerCase());
    return c && c.password === b.password ? send(res, 201, open(c)) : err(res, 401, "invalid credentials");
  }
  if (path === "/customer-svc/auth/me" && m === "GET") return sess ? send(res, 200, { customer: pub(sess.customer), expiresAt: sess.expiresAt }) : err(res, 401, "invalid or expired token");
  if (path === "/customer-svc/auth/session" && m === "DELETE") { if (sess) sessions.delete(sess.token); return send(res, 204); }

  if (path.startsWith("/customer-svc/customer/me")) {
    if (!sess) return err(res, 401, "invalid or expired token");
    const c = sess.customer;
    if (path === "/customer-svc/customer/me" && m === "GET") return send(res, 200, pub(c));
    if (path === "/customer-svc/customer/me" && m === "PUT") { c.name = b.name; c.phone = b.phone ?? ""; return send(res, 200, pub(c)); }
    if (path === "/customer-svc/customer/me/password" && m === "PUT") {
      if (c.password !== b.currentPassword) return err(res, 401, "current password is wrong");
      c.password = b.newPassword; [...sessions].filter(([, s]) => s.customerId === c.id).forEach(([t]) => sessions.delete(t));
      return send(res, 204);
    }
    const mine = addresses.filter((a) => a.customerId === c.id);
    if (path === "/customer-svc/customer/me/address" && m === "GET") return send(res, 200, [...mine].sort((a, z) => Number(z.isDefault) - Number(a.isDefault) || a.id - z.id));
    if (path === "/customer-svc/customer/me/address" && m === "POST") {
      const a: Address = { id: nextAddress++, customerId: c.id, ...b, isDefault: !!b.isDefault || mine.length === 0 };
      if (a.isDefault) mine.forEach((x) => (x.isDefault = false));
      addresses.push(a);
      return send(res, 201, a);
    }
    const id = Number(/\/address\/(\d+)$/.exec(path)?.[1]);
    const a = mine.find((x) => x.id === id);
    if (id) {
      if (!a) return err(res, 404, "entity not found");
      if (m === "GET") return send(res, 200, a);
      if (m === "PUT") { if (b.isDefault) mine.forEach((x) => (x.isDefault = false)); Object.assign(a, b); return send(res, 200, a); }
      if (m === "DELETE") { addresses.splice(addresses.indexOf(a), 1); return send(res, 204); }
    }
  }

  if (path === "/catalogue-svc/product" && m === "GET") return send(res, 200, { products: catalogue.map((p) => Object.fromEntries(Object.entries(p).filter(([k]) => k !== "price" && k !== "mrp"))), count: catalogue.length, offset: 0, limit: 100 });
  if (path === "/catalogue-svc/category" && m === "GET") return send(res, 200, { categories, count: categories.length, offset: 0, limit: 100 });
  if (path === "/inventory-svc/stock/availability" && m === "GET") {
    const ids = (url.searchParams.get("variantIds") ?? "").split(",").map(Number).filter(Boolean);
    return send(res, 200, ids.map(offer).filter(Boolean));
  }

  if (path.startsWith("/order-svc/order")) {
    if (!sess) return err(res, 401, "invalid or expired token");
    const mine = orders.filter((o) => o.customerId === sess.customer.id);
    if (path === "/order-svc/order" && m === "GET") return send(res, 200, { count: mine.length, offset: 0, limit: 50, order: [...mine].reverse() });
    if (path === "/order-svc/order" && m === "POST") {
      const dup = mine.find((o) => o.clientId === b.clientId);
      if (dup) return send(res, 201, { order: dup });
      const items = [];
      for (const i of b.items ?? []) {
        const left = stock.get(i.variantId) ?? 0, p = variantInfo.get(i.variantId);
        if (!p || left < i.quantity) return err(res, 409, `insufficient stock for variant ${i.variantId}`);
        items.push({ id: items.length + 1, variantId: i.variantId, sellerId: i.sellerId, quantity: i.quantity, unitPrice: p.price, lineTotal: p.price * i.quantity });
      }
      items.forEach((i) => stock.set(i.variantId, (stock.get(i.variantId) ?? 0) - i.quantity));
      const total = items.reduce((s, i) => s + i.lineTotal, 0);
      const o = { referenceNumber: nextOrder++, clientId: b.clientId, customerId: sess.customer.id, status: "PENDING", paymentMethod: "COD", paymentStatus: "PENDING", subtotal: total, discountTotal: 0, total, deliveryAddress: b.deliveryAddress, notes: "", cancellationReason: "", items, createdAt: now(), completedAt: null };
      orders.push(o);
      return send(res, 201, { order: o });
    }
    const ref = Number(/\/order\/(\d+)$/.exec(path)?.[1]);
    const o = mine.find((x) => x.referenceNumber === ref);
    if (ref) {
      if (!o) return err(res, 404, "entity not found");
      if (m === "GET") return send(res, 200, { order: o });
      if (m === "PATCH") {
        if (b.status === "CANCELLED") {
          if (o.status !== "PENDING") return err(res, 409, "order cannot be cancelled");
          o.status = "CANCELLED"; o.cancellationReason = b.cancellationReason ?? "";
          o.items.forEach((i: any) => stock.set(i.variantId, (stock.get(i.variantId) ?? 0) + i.quantity));
        }
        return send(res, 200, { order: o });
      }
    }
  }

  err(res, 404, "not found");
}).listen(PORT, () => console.log(`mock platform on http://localhost:${PORT} (${catalogue.length} products)`));
