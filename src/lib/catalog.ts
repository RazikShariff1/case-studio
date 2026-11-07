/**
 * Product data layer. Today it reads the seeded dummy catalog from Postgres.
 * When the real products API is ready, re-implement these functions against it
 * (keep the return types) and nothing else in the app needs to change.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

import { type SortKey } from "./catalog-constants";
export { CATEGORIES, PHONE_MODELS, SORTS } from "./catalog-constants";
export type { SortKey } from "./catalog-constants";

export type ShopQuery = {
  q?: string;
  category?: string;
  model?: string;
  color?: string;
  min?: number;
  max?: number;
  sort?: SortKey;
  page?: number;
};

const PAGE_SIZE = 12;

const orderBy = (sort: SortKey): Prisma.ProductOrderByWithRelationInput[] => {
  switch (sort) {
    case "new": return [{ createdAt: "desc" }];
    case "price-asc": return [{ priceCents: "asc" }];
    case "price-desc": return [{ priceCents: "desc" }];
    case "rating": return [{ rating: "desc" }, { reviewCount: "desc" }];
    default: return [{ featured: "desc" }, { reviewCount: "desc" }];
  }
};

export async function listProducts(query: ShopQuery = {}) {
  const { q, category, model, color, min, max, sort = "featured" } = query;
  const page = Math.max(1, query.page ?? 1);
  const variantFilter: Prisma.VariantWhereInput = {};
  if (model) variantFilter.model = model;
  if (color) variantFilter.color = color;

  const where: Prisma.ProductWhereInput = {
    ...(category && { category }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...((min != null || max != null) && {
      priceCents: { ...(min != null && { gte: Math.round(min * 100) }), ...(max != null && { lte: Math.round(max * 100) }) },
    }),
    ...(model || color ? { variants: { some: { ...variantFilter, stock: { gt: 0 } } } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: orderBy(sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { variants: { select: { color: true, colorHex: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: items.map((p) => ({
      ...p,
      swatches: uniqueSwatches(p.variants),
    })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export type ProductListItem = Awaited<ReturnType<typeof listProducts>>["items"][number];

export async function getProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: { variants: { orderBy: { id: "asc" } } }, // creation order: seed lists colours in display order
  });
}

export async function relatedProducts(category: string, excludeId: string, take = 4) {
  const items = await prisma.product.findMany({
    where: { category, id: { not: excludeId } },
    take,
    orderBy: { reviewCount: "desc" },
    include: { variants: { select: { color: true, colorHex: true } } },
  });
  return items.map((p) => ({ ...p, swatches: uniqueSwatches(p.variants) }));
}

export async function listColors() {
  const rows = await prisma.variant.findMany({ distinct: ["color"], select: { color: true, colorHex: true }, orderBy: { color: "asc" } });
  return rows;
}

function uniqueSwatches(v: { color: string; colorHex: string }[]) {
  const seen = new Map<string, string>();
  v.forEach((x) => seen.has(x.color) || seen.set(x.color, x.colorHex));
  return [...seen].map(([color, hex]) => ({ color, hex }));
}
