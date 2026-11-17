import type { Finish } from "./case-scene";

/** Which 3D finish best shows a product: the category sets the look, clear cases are see-through. */
export function finishFor(category: string, name: string): Finish {
  if (/clear|crystal|transparent/i.test(name)) return "clear";
  if (category === "luxury") return "metal";
  if (category === "trendy") return "waves";
  if (category === "colorful") return "gradient";
  return "matte";
}
