# Case Studio

Consumer storefront for phone cases. Next.js (App Router) + Prisma + Postgres.
Admin lives in a separate project; this app is customer-facing only.

## Run

```bash
npm install
cp .env.example .env        # then set AUTH_SECRET (openssl rand -hex 32)
npm run db:up               # Postgres in Docker
npm run db:migrate          # create tables
npm run db:seed             # 12 dummy products
npm run dev
```

## What's here

| Area | Where |
| --- | --- |
| Catalog (search, filters, sort, pagination) | `src/lib/catalog.ts`, `/shop`, `GET /api/products` |
| Auth (email + password, httpOnly JWT cookie) | `src/lib/auth.ts`, `/api/auth/*` |
| Cart (guest cookie cart, merged into the user's on login) | `src/lib/cart.ts`, `/api/cart` |
| Checkout and orders (stock decremented in a transaction, COD) | `/api/checkout`, `/orders` |

## Swapping in the real products API

`src/lib/catalog.ts` is the only file that reads product data. Re-implement
`listProducts`, `getProduct`, `relatedProducts` and `listColors` against the API
and keep the return shapes. Cart and checkout read variants and prices from the
local DB today, so they will need to follow once products come from the API.
