/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Loads the demo catalogue (data/products.ts: 24 cases, each in several colours for each phone) into the platform:
 * a seller and a brand, the four categories, products with their photos, variants (phone x colour), and an approved offer with
 * stock for every variant. Safe to run again: anything that already exists is found by its clientItemId and left alone.
 *
 *   PLATFORM_URL=https://... ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed
 *
 * It works through the team's /api realm as the platform's admin; the storefront itself only ever uses /store.
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PRODUCTS, COLOR_HEX } from "../data/products";
import { PHONE_MODELS, CATEGORIES } from "../src/lib/catalog-constants";

const BASE = (process.env.PLATFORM_URL ?? "https://as-project-j88g.onrender.com").replace(/\/+$/, "");
const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (the platform's admin).");
  process.exit(1);
}

let token = "";

async function api<T = any>(method: string, path: string, body?: unknown, okStatuses: number[] = []): Promise<{ status: number; data: T }> {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(90_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok && !okStatuses.includes(res.status)) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(json).slice(0, 300)}`);
  return { status: res.status, data: json?.data as T };
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** public/products/<n>.(jpeg|jpg|png|webp): the newest file wins. */
function photoFor(n: number): string {
  const dir = join(process.cwd(), "public", "products");
  const hits = readdirSync(dir)
    .filter((f) => new RegExp(`^${n}\\.(jpe?g|png|webp)$`, "i").test(f))
    .map((f) => ({ f, t: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  return hits.length ? `/products/${hits[0].f}` : "/site/no-photo.png";
}

/** Runs tasks a few at a time: the platform may be a small, sleepy instance. */
async function pool<T>(items: T[], size: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: size }, async () => { while (i < items.length) await fn(items[i++]); }));
}

async function findOne<T extends { id: number }>(path: string, key: string): Promise<T | undefined> {
  const { data } = await api<Record<string, T[]>>("GET", path);
  return data?.[key]?.[0];
}

async function main() {
  const login = await api<{ token: string }>("POST", "/account-svc/auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  token = login.data.token;
  console.log("signed in as admin");

  const sellers = (await api<{ id: number; name: string }[]>("GET", "/catalogue-svc/seller?limit=100")).data;
  const seller = sellers.find((s) => s.name === "Case Studio") ?? (await api<{ id: number }>("POST", "/catalogue-svc/seller", { name: "Case Studio", status: "active" })).data;

  const brands = (await api<{ brands: { id: number; name: string }[] }>("GET", "/catalogue-svc/brand?limit=100")).data.brands;
  const brand = brands.find((b) => b.name === "Case Studio") ?? (await api<{ id: number }>("POST", "/catalogue-svc/brand", { name: "Case Studio", status: "ENABLED" })).data;

  const cats = (await api<{ categories: { id: number; slug: string }[] }>("GET", "/catalogue-svc/category?limit=100")).data.categories;
  const categoryId = new Map<string, number>();
  for (const c of CATEGORIES) {
    const hit = cats.find((x) => x.slug === c.slug);
    categoryId.set(c.slug, hit?.id ?? (await api<{ id: number }>("POST", "/catalogue-svc/category", { name: c.label, slug: c.slug, status: "ENABLED" })).data.id);
  }
  console.log(`seller ${seller.id}, brand ${brand.id}, ${categoryId.size} categories`);

  let done = 0;
  await pool(PRODUCTS, 2, async (p) => {
    const clientItemId = `cs-${p.n}`;
    let product = await findOne<{ id: number }>(`/catalogue-svc/product?clientItemId=${clientItemId}`, "products");
    product ??= (
      await api<{ id: number }>("POST", "/catalogue-svc/product", {
        name: p.name, slug: `${slugify(p.name)}`, tagLine: p.desc.split(". ")[0], description: p.desc, images: [photoFor(p.n)],
        primaryCategoryId: categoryId.get(p.category), categoryIds: [categoryId.get(p.category)], brandId: brand.id,
        status: "ENABLED", hasVariants: true, clientItemId,
        metaData: { features: p.features, rating: p.rating, reviewCount: p.reviews, featured: !!p.featured, imagePosition: "50% 50%" },
      })
    ).data;

    const variants: { id: number; qty: number }[] = [];
    let vi = 0;
    for (const [mi, model] of PHONE_MODELS.entries()) {
      for (const [ci, color] of p.colors.entries()) {
        if (!COLOR_HEX[color]) throw new Error(`Missing hex for colour "${color}"`);
        const sku = `cs-${p.n}-${slugify(model)}-${color.toLowerCase()}`;
        let v = await findOne<{ id: number }>(`/catalogue-svc/variant?clientItemId=${sku}`, "variants");
        v ??= (
          await api<{ id: number }>("POST", "/catalogue-svc/variant", {
            productId: product.id, name: `${model} · ${color}`, clientItemId: sku, status: "ENABLED",
            metaData: { model, color, colorHex: COLOR_HEX[color] },
          })
        ).data;
        // A few sold-out combinations on purpose, to show that state in the store.
        variants.push({ id: v.id, qty: (p.n + mi + ci) % 9 === 0 ? 0 : 6 + ((p.n * 3 + mi * 5 + ci * 7) % 25) });
        vi++;
      }
    }

    // One approved request per product creates every variant's offer (mrp, discount) for the seller. Skipped when it already exists.
    const has = await api("GET", `/inventory-svc/stock/${variants[0].id}/seller/${seller.id}`, undefined, [404]);
    if (has.status === 404) {
      const mrp = p.compareAt ?? p.price;
      await api("PUT", `/catalogue-svc/product/${product.id}/permissible-seller`, { sellerIds: [seller.id] });
      const req = await api<{ id: number }>("POST", "/catalogue-svc/seller-product-request", {
        sellerId: seller.id, productId: product.id, status: "PENDING", items: variants.map((v) => ({ variantId: v.id, mrp, discount: mrp - p.price })),
      });
      await api("PUT", `/catalogue-svc/seller-product-request/${req.data.id}/approval`, { status: "APPROVED" });
    }

    for (const v of variants) await api("PUT", `/inventory-svc/stock/${v.id}/seller/${seller.id}`, { quantity: v.qty, unit: 1, notes: "seed" });
    console.log(`  ${++done}/${PRODUCTS.length} ${p.name} (${vi} variants)`);
  });

  console.log("done");
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
