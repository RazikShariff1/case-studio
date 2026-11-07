import { PrismaClient } from "@prisma/client";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PRODUCTS, COLOR_HEX } from "./products";

const prisma = new PrismaClient();

const MODELS_ALL = ["iPhone 15 Pro", "iPhone 15", "iPhone 14", "Galaxy S24", "OnePlus 12", "Redmi Note 13 Pro"];

/** public/products/<n>.(jpeg|jpg|png|webp): if several exist for a number, the newest file wins. */
function photoFor(n: number): string {
  const dir = join(process.cwd(), "public", "products");
  const hits = readdirSync(dir)
    .filter((f) => new RegExp(`^${n}\\.(jpe?g|png|webp)$`, "i").test(f))
    .map((f) => ({ f, t: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  if (hits.length === 0) {
    console.warn(`  ! no photo for product ${n} (expected public/products/${n}.jpeg), using placeholder`);
    return "/site/no-photo.png";
  }
  return `/products/${hits[0].f}`;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function main() {
  // Replaces the catalog only. Users and orders are kept (order items keep their own
  // name/price snapshot; their variant link becomes null). Cart lines vanish with their variants.
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();

  const ids = new Map<number, string>();
  await prisma.product.createMany({
    data: PRODUCTS.map((p, i) => {
      const id = `prd_${String(p.n).padStart(2, "0")}`;
      ids.set(p.n, id);
      return {
        id,
        slug: slugify(p.name),
        name: p.name,
        description: p.desc,
        category: p.category,
        priceCents: p.price * 100,
        compareAtCents: p.compareAt ? p.compareAt * 100 : null,
        image: photoFor(p.n), // <- drop your photo in public/products/
        imagePosition: "50% 50%",
        features: p.features,
        rating: p.rating,
        reviewCount: p.reviews,
        featured: !!p.featured,
        createdAt: new Date(Date.now() - i * 86_400_000),
      };
    }),
  });

  await prisma.variant.createMany({
    data: PRODUCTS.flatMap((p, i) =>
      MODELS_ALL.flatMap((model, mi) =>
        p.colors.map((color, ci) => {
          if (!COLOR_HEX[color]) throw new Error(`Missing hex for colour "${color}"`);
          return {
            productId: ids.get(p.n)!,
            model,
            color,
            colorHex: COLOR_HEX[color],
            // A few sold-out combinations on purpose, to show that state in the UI.
            stock: (i + mi + ci) % 9 === 0 ? 0 : 6 + ((i * 3 + mi * 5 + ci * 7) % 25),
            sku: `${slugify(p.name)}-${slugify(model)}-${color.toLowerCase()}`,
          };
        }),
      ),
    ),
  });

  console.log(`Seeded ${PRODUCTS.length} products`);
}

main().finally(() => prisma.$disconnect());
