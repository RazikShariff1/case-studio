/**
 * Product data layer, backed by the platform: products and categories from catalogue-svc, price and stock from inventory-svc.
 *
 * The catalogue is small, so it is loaded whole (cached for a short while) and filtered, sorted and paged here: catalogue-svc has
 * no price filter or sort, and a price lives in inventory-svc, not on the product. If it ever grows past a few hundred products,
 * move filtering to the platform instead.
 *
 * Mapping to the platform:
 *   product  -> catalogue product (metaData: features, rating, reviewCount, featured, imagePosition); category = its primary category's slug
 *   variant  -> catalogue variant (metaData: model, color, colorHex)
 *   price    -> inventory-svc availability: the best offer (cheapest seller with stock), else the first offer
 */
import { cache } from "react";
import { store, type Page } from "./platform";
import { toPaise } from "./money";
import { type SortKey } from "./catalog-constants";

export { CATEGORIES, PHONE_MODELS, SORTS } from "./catalog-constants";
export type { SortKey } from "./catalog-constants";

export type ShopQuery = {
  q?: string;
  category?: string;
  model?: string;
  color?: string;
  min?: number; // rupees
  max?: number; // rupees
  sort?: SortKey;
  page?: number;
};

const PAGE_SIZE = 12;
const CATALOGUE_TTL = 30; // seconds a catalogue or price read may be reused
const AVAILABILITY_CHUNK = 40;
const UNLIMITED_STOCK = 99;
const NO_PHOTO = "/site/no-photo.png";

// ---- what the platform sends ----

type PVariant = { id: number; status: string; name: string; images: string[] | null; metaData: Record<string, unknown> | null };
type PProduct = {
  id: number; slug: string; name: string; tagLine: string; description: string; images: string[] | null; status: string;
  primaryCategoryId: number | null; metaData: Record<string, unknown> | null; variants: PVariant[] | null; createdAt: string;
};
type PCategory = { id: number; slug: string };
type POffer = { sellerId: number; available: number; inStock: boolean; unlimitedStock: boolean; mrp: number | null; sellingPrice: number | null };
type PAvailability = { variantId: number; offers: POffer[] | null; bestOffer: POffer | null };

// ---- what the app uses ----

export type CatalogVariant = {
  id: string;
  model: string;
  color: string;
  colorHex: string;
  stock: number;
  sellerId: number;
  priceCents: number;
  compareAtCents: number | null;
};

export type CatalogProduct = {
  id: string;
  /** `<id>-<slug>`: the id makes a lookup one call, the slug keeps the URL readable. */
  slug: string;
  name: string;
  description: string;
  category: string;
  image: string;
  imagePosition: string;
  features: string[];
  rating: number;
  reviewCount: number;
  featured: boolean;
  createdAt: Date;
  priceCents: number;
  compareAtCents: number | null;
  variants: CatalogVariant[];
};

export type ProductListItem = CatalogProduct & { swatches: { color: string; hex: string }[] };

export type Catalog = {
  products: CatalogProduct[];
  /** variant id -> where to find it, for the cart and for order lines. */
  byVariant: Map<string, { product: CatalogProduct; variant: CatalogVariant }>;
};

// ---- loading ----

async function allPages<K extends string, T>(path: string, key: K, ttl: number): Promise<T[]> {
  const out: T[] = [];
  for (let offset = 0; ; ) {
    const p = await store<Page<K, T>>(`${path}${path.includes("?") ? "&" : "?"}limit=100&offset=${offset}`, { revalidate: ttl || undefined });
    const rows = p[key] ?? [];
    out.push(...rows);
    offset += rows.length;
    if (rows.length === 0 || offset >= p.count) return out;
  }
}

const str = (v: unknown, d = "") => (typeof v === "string" && v ? v : d);
const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);

async function build(ttl: number): Promise<Catalog> {
  const [products, categories] = await Promise.all([
    allPages<"products", PProduct>("/catalogue-svc/product", "products", ttl),
    allPages<"categories", PCategory>("/catalogue-svc/category", "categories", ttl),
  ]);

  const variantIds = products.flatMap((p) => (p.variants ?? []).filter((v) => v.status === "ENABLED").map((v) => v.id));
  const chunks: number[][] = [];
  for (let i = 0; i < variantIds.length; i += AVAILABILITY_CHUNK) chunks.push(variantIds.slice(i, i + AVAILABILITY_CHUNK));

  const availability = new Map<number, PAvailability>();
  const answers = await Promise.all(
    chunks.map((ids) => store<PAvailability[]>(`/inventory-svc/stock/availability?variantIds=${ids.join(",")}`, { revalidate: ttl || undefined })),
  );
  answers.flat().forEach((a) => availability.set(a.variantId, a));

  const slugOf = new Map(categories.map((c) => [c.id, c.slug]));
  const out: CatalogProduct[] = [];

  for (const p of products) {
    const variants: CatalogVariant[] = [];

    for (const v of p.variants ?? []) {
      if (v.status !== "ENABLED") continue;
      const a = availability.get(v.id);
      const offer = a?.bestOffer ?? a?.offers?.[0];
      if (!offer || (offer.sellingPrice == null && offer.mrp == null)) continue; // nobody sells it: not for sale

      const selling = offer.sellingPrice ?? offer.mrp ?? 0;
      const meta = v.metaData ?? {};

      variants.push({
        id: String(v.id),
        model: str(meta.model, v.name),
        color: str(meta.color),
        colorHex: str(meta.colorHex, "#cccccc"),
        // Only the best offer has stock to sell; a sold-out variant still shows its first offer's price.
        stock: a?.bestOffer ? (a.bestOffer.unlimitedStock ? UNLIMITED_STOCK : Math.max(0, a.bestOffer.available)) : 0,
        sellerId: offer.sellerId,
        priceCents: toPaise(selling),
        compareAtCents: offer.mrp != null && offer.mrp > selling ? toPaise(offer.mrp) : null,
      });
    }

    if (variants.length === 0) continue;

    // The product's own price is its cheapest variant in stock (or its cheapest at all when everything is sold out).
    const inStock = variants.filter((v) => v.stock > 0);
    const cheapest = [...(inStock.length ? inStock : variants)].sort((a, b) => a.priceCents - b.priceCents)[0];
    const meta = p.metaData ?? {};

    out.push({
      id: String(p.id),
      slug: `${p.id}-${p.slug}`,
      name: p.name,
      description: p.description || p.tagLine,
      category: (p.primaryCategoryId != null && slugOf.get(p.primaryCategoryId)) || "",
      image: p.images?.[0] || NO_PHOTO,
      imagePosition: str(meta.imagePosition, "50% 50%"),
      features: Array.isArray(meta.features) ? meta.features.filter((f): f is string => typeof f === "string") : [],
      rating: num(meta.rating, 4.5),
      reviewCount: num(meta.reviewCount, 0),
      featured: meta.featured === true,
      createdAt: new Date(p.createdAt),
      priceCents: cheapest.priceCents,
      compareAtCents: cheapest.compareAtCents,
      variants,
    });
  }

  const byVariant: Catalog["byVariant"] = new Map();
  out.forEach((product) => product.variants.forEach((variant) => byVariant.set(variant.id, { product, variant })));

  return { products: out, byVariant };
}

/** The catalogue as shoppers see it, reused for a short while. One load per request however many callers ask. */
export const getCatalog = cache(() => build(CATALOGUE_TTL));

/** The catalogue read fresh, for the moment of checkout when the seller and price must be current. */
export const getFreshCatalog = () => build(0);

// ---- the functions the pages use ----

const sorters: Record<SortKey, (a: CatalogProduct, b: CatalogProduct) => number> = {
  featured: (a, b) => Number(b.featured) - Number(a.featured) || b.reviewCount - a.reviewCount,
  new: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  "price-asc": (a, b) => a.priceCents - b.priceCents,
  "price-desc": (a, b) => b.priceCents - a.priceCents,
  rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
};

export async function listProducts(query: ShopQuery = {}) {
  const { q, category, model, color, min, max, sort = "featured" } = query;
  const page = Math.max(1, query.page ?? 1);
  const needle = q?.trim().toLowerCase();
  const { products } = await getCatalog();

  const matches = products.filter((p) => {
    if (category && p.category !== category) return false;
    if (needle && ![p.name, p.description, p.category].some((s) => s.toLowerCase().includes(needle))) return false;
    if (min != null && p.priceCents < toPaise(min)) return false;
    if (max != null && p.priceCents > toPaise(max)) return false;
    if ((model || color) && !p.variants.some((v) => v.stock > 0 && (!model || v.model === model) && (!color || v.color === color))) return false;
    return true;
  });

  matches.sort(sorters[sort] ?? sorters.featured);
  const total = matches.length;

  return {
    items: matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(withSwatches),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

/** A product by its `<id>-<slug>` path segment, or null. */
export async function getProduct(slug: string): Promise<CatalogProduct | null> {
  const id = /^(\d+)(?:-|$)/.exec(slug)?.[1];
  if (!id) return null;
  return (await getCatalog()).products.find((p) => p.id === id) ?? null;
}

export async function relatedProducts(category: string, excludeId: string, take = 4) {
  const { products } = await getCatalog();
  return products
    .filter((p) => p.category === category && p.id !== excludeId)
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, take)
    .map(withSwatches);
}

export async function listColors() {
  const { products } = await getCatalog();
  const seen = new Map<string, string>();
  products.forEach((p) => p.variants.forEach((v) => v.color && !seen.has(v.color) && seen.set(v.color, v.colorHex)));
  return [...seen].map(([color, colorHex]) => ({ color, colorHex })).sort((a, b) => a.color.localeCompare(b.color));
}

function withSwatches(p: CatalogProduct): ProductListItem {
  const seen = new Map<string, string>();
  p.variants.forEach((v) => v.color && !seen.has(v.color) && seen.set(v.color, v.colorHex));
  return { ...p, swatches: [...seen].map(([color, hex]) => ({ color, hex })) };
}
