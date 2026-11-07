/**
 * Static "cosmetic" assets (hero, banners, collections, category tiles, showcase video).
 * Product photos are NOT here, they come with the product data.
 *
 * Drop a file into public/site/ named after the slot, any extension (jpg, jpeg, png, webp,
 * mp4...). `npm run dev` / `npm run build` scan the folder automatically (or run `npm run assets`).
 * If two files share a slot name, the newest wins. See public/site/README.md for sizes.
 */
import { FILES } from "./site-assets.generated";

const FALLBACK = "/site/no-photo.png";
const url = (name: string) => (FILES[name] ? `/site/${encodeURIComponent(FILES[name])}` : null);
const img = (name: string, position = "50% 50%", alt = "") => ({ src: url(name) ?? FALLBACK, position, alt });

const SLUGS = ["minimal", "trendy", "luxury", "colorful"] as const;

export const SITE = {
  heroMobile: img("hero-mobile", "60% 45%"),
  heroDesktop: img("hero-desktop", "50% 50%", "Premium phone cases"),
  bannerMobile: img("banner-mobile", "55% 50%"),
  bannerWide: img("banner-wide", "50% 50%", "New collection"),
  categories: Object.fromEntries(SLUGS.map((s) => [s, img(`cat-${s}`)])) as Record<(typeof SLUGS)[number], ReturnType<typeof img>>,
  /** Wide banner shown at the top of /shop?category=... Missing file = no banner. */
  collections: Object.fromEntries(SLUGS.map((s) => [s, url(`collection-${s}`)])) as Record<(typeof SLUGS)[number], string | null>,
  showcaseVideo: { src: url("showcase"), poster: url("showcase-poster") ?? FALLBACK },
};
