export const CATEGORIES = [
  { slug: "minimal", label: "Minimal" },
  { slug: "trendy", label: "Trendy" },
  { slug: "luxury", label: "Luxury" },
  { slug: "colorful", label: "Colorful" },
] as const;

export const PHONE_MODELS = ["iPhone 15 Pro", "iPhone 15", "iPhone 14", "Galaxy S24", "OnePlus 12", "Redmi Note 13 Pro"] as const;

export const SORTS = {
  featured: "Featured",
  new: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  rating: "Top rated",
} as const;
export type SortKey = keyof typeof SORTS;

