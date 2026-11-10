/**
 * Demo catalog (24 products). The number `n` is also the photo file name:
 *   n = 7  ->  public/products/7.jpg
 * Prices are in rupees here; the seed converts to paise.
 */
export type DemoProduct = {
  n: number;
  name: string;
  category: "minimal" | "trendy" | "luxury" | "colorful";
  price: number;
  compareAt?: number;
  desc: string;
  features: string[];
  colors: string[];
  rating: number;
  reviews: number;
  featured?: boolean;
};

export const COLOR_HEX: Record<string, string> = {
  Stone: "#7d7e76", Plum: "#4a2a55", Blush: "#e6b8bf", Black: "#222222", Olive: "#4b5438",
  Sand: "#d3bfa5", Cream: "#efe6d6", Sage: "#a9b79a", Pink: "#e9a9b8", Chrome: "#b9bcc4",
  Lilac: "#b9a8d8", Yellow: "#e8c53a", Blue: "#6f93c9", Clear: "#dfe3e4", Smoke: "#8a8d90",
  Navy: "#1f2a44", Oat: "#d8cdb9", Grey: "#8c8c88", Gold: "#c9a24a", Red: "#b3392f",
  Orange: "#e8833a", Green: "#3f7d5a", Teal: "#3a8f8a", White: "#f4f2ee", Brown: "#6b4a34",
};

const DUAL = ["Dual-layer protection", "Raised camera and screen lip", "Wireless charging compatible"];
const SLIM = ["Slim, pocket-friendly profile", "Raised camera and screen lip", "Anti-fingerprint finish"];

export const PRODUCTS: DemoProduct[] = [
  // ---- Minimal ----
  { n: 1, name: "Frosted MagSafe Case", category: "minimal", price: 799, featured: true, rating: 4.9, reviews: 812, colors: ["Stone", "Plum", "Blush", "Black"],
    desc: "A soft-touch translucent back with a built-in MagSafe ring and a raised camera guard. Calm colours, strong magnets.",
    features: ["Built-in MagSafe magnets", "Drop protection up to 10 ft", "Fingerprint-resistant frosted back"] },
  { n: 2, name: "Clear Crystal Case", category: "minimal", price: 499, rating: 4.6, reviews: 1240, colors: ["Clear", "Smoke"],
    desc: "Show off your phone's own colour. Crystal-clear back that resists yellowing, with a flexible shock-absorbing bumper.",
    features: ["Anti-yellowing clear back", "Shock-absorbing bumper", "Wireless charging compatible"] },
  { n: 3, name: "Matte Slim Case", category: "minimal", price: 599, rating: 4.7, reviews: 690, colors: ["Black", "Sage", "Sand", "Navy"],
    desc: "Ultra-thin and silky matte. Just enough protection without the bulk.", features: SLIM },
  { n: 4, name: "Sandy Waves Case", category: "minimal", price: 749, rating: 4.8, reviews: 320, colors: ["Sand", "Olive", "Black"],
    desc: "Embossed wave texture in warm sand tones. Grippy, understated and quietly luxurious.",
    features: ["Embossed wave texture", "Microfibre-lined interior", "Raised camera and screen lip"] },
  { n: 5, name: "Silicone Soft-Touch Case", category: "minimal", price: 649, rating: 4.7, reviews: 905, colors: ["Cream", "Olive", "Blush", "Lilac", "Black"],
    desc: "Liquid silicone that feels smooth and grips like nothing else. Microfibre lining keeps the phone scratch-free.",
    features: ["Liquid silicone exterior", "Microfibre lining", "Raised camera and screen lip"] },
  { n: 6, name: "Linen Texture Case", category: "minimal", price: 849, rating: 4.5, reviews: 154, colors: ["Oat", "Grey", "Sage"],
    desc: "A woven linen look on a tough shell. Earthy, tactile and different from the usual plastic.",
    features: ["Woven linen-look finish", "Dual-layer protection", "Wireless charging compatible"] },

  // ---- Trendy ----
  { n: 7, name: "Morning Coffee Club", category: "trendy", price: 699, compareAt: 899, rating: 4.8, reviews: 540, colors: ["Pink", "Cream", "Sage"],
    desc: "A type-led print for people who run on espresso. Dual-layer tough case with a glossy finish.",
    features: ["Glossy scratch-resistant print", ...DUAL.slice(0, 2)] },
  { n: 8, name: "Retro Checkerboard Case", category: "trendy", price: 649, rating: 4.7, reviews: 388, colors: ["Black", "Pink", "Blue"],
    desc: "Bold black-and-white checks with a pop of colour. Skater energy, everyday protection.", features: DUAL },
  { n: 9, name: "Floral Glow Case", category: "trendy", price: 699, featured: true, rating: 4.9, reviews: 603, colors: ["Cream", "Black", "Blush"],
    desc: "Wildflowers in a riot of colour on a glossy, impact-resistant shell with a bold bumper.", features: DUAL },
  { n: 10, name: "Strawberry Stripes Case", category: "trendy", price: 649, rating: 4.5, reviews: 91, colors: ["Pink", "Blush"],
    desc: "Candy stripes in red and pink. Sweet, sharp and impossible to lose on a table.", features: DUAL },
  { n: 11, name: "Cassette Mixtape Case", category: "trendy", price: 599, rating: 4.8, reviews: 276, colors: ["Yellow", "Black", "Cream"],
    desc: "Retro mix-tape energy. A tough dual-layer case that rewinds the decade.", features: DUAL },
  { n: 12, name: "Smiley Doodle Case", category: "trendy", price: 599, rating: 4.6, reviews: 212, colors: ["Yellow", "Black", "White"],
    desc: "Hand-drawn smiles all over. Instant good mood, every time you pick up your phone.", features: DUAL },

  // ---- Luxury ----
  { n: 13, name: "Chrome Ripple Case", category: "luxury", price: 999, featured: true, rating: 4.7, reviews: 421, colors: ["Chrome", "Blue", "Plum"],
    desc: "Liquid-metal ripples catch the light from every angle. A statement case with a mirror-like finish.",
    features: ["Electroplated ripple finish", "Rigid frame, flexible bumper", "Raised camera protection"] },
  { n: 14, name: "Black Leather Case", category: "luxury", price: 1299, rating: 4.8, reviews: 266, colors: ["Black", "Brown", "Navy"],
    desc: "Full-grain-look vegan leather that softens with use. Quiet, classic and built to age well.",
    features: ["Premium vegan leather", "Microfibre-lined interior", "Wireless charging compatible"] },
  { n: 15, name: "Quilted Diamond Case", category: "luxury", price: 1199, rating: 4.6, reviews: 143, colors: ["Black", "Blush", "Cream"],
    desc: "Diamond-quilted texture in a soft, padded finish. Fashion-house look without the price tag.",
    features: ["Quilted soft-touch finish", "Raised camera and screen lip", "Wireless charging compatible"] },
  { n: 16, name: "Marble Gold Case", category: "luxury", price: 1099, rating: 4.7, reviews: 309, colors: ["White", "Black", "Pink"],
    desc: "Polished marble pattern with gold-tone accents on a scratch-resistant glossy shell.",
    features: ["Gold-tone camera ring", "Scratch-resistant gloss", "Dual-layer protection"] },
  { n: 17, name: "Carbon Fibre Armor Case", category: "luxury", price: 1399, rating: 4.8, reviews: 187, colors: ["Black", "Grey"],
    desc: "Carbon-fibre texture over military-grade shock absorption. Tough on the outside, sleek in the hand.",
    features: ["Carbon-fibre texture", "Military-grade drop protection", "Reinforced corners"] },
  { n: 18, name: "Candy Chrome Case", category: "luxury", price: 1049, rating: 4.5, reviews: 133, colors: ["Plum", "Lilac", "Chrome"],
    desc: "Purple chrome waves with a playful candy print. Heavy on personality, light in the hand.",
    features: ["Electroplated ripple finish", "Rigid frame, flexible bumper", "Scratch-resistant coating"] },

  // ---- Colorful ----
  { n: 19, name: "Matcha Mornings", category: "colorful", price: 699, rating: 4.6, reviews: 187, colors: ["Sage", "Cream"],
    desc: "Soft sage with bold matcha typography. Slim, grippy and made to be noticed.", features: DUAL },
  { n: 20, name: "Pastel Gradient Case", category: "colorful", price: 599, featured: true, rating: 4.8, reviews: 478, colors: ["Pink", "Lilac", "Blue", "Sage"],
    desc: "Soft pastel gradients that melt from one shade to the next. Glossy, glowy and gentle on the eyes.", features: DUAL },
  { n: 21, name: "Neon Pop Case", category: "colorful", price: 549, rating: 4.4, reviews: 96, colors: ["Orange", "Green", "Pink"],
    desc: "Electric colours you can spot from across the room. Tough, grippy and loud in the best way.", features: DUAL },
  { n: 22, name: "Holo Rainbow Case", category: "colorful", price: 799, rating: 4.7, reviews: 255, colors: ["Chrome", "Pink", "Blue"],
    desc: "A holographic finish that shifts through every colour as you turn it in the light.",
    features: ["Holographic finish", "Dual-layer protection", "Raised camera protection"] },
  { n: 23, name: "Tie-Dye Swirl Case", category: "colorful", price: 649, rating: 4.5, reviews: 167, colors: ["Blue", "Pink", "Green", "Orange"],
    desc: "Every swirl is a little different. Summer-festival colours on a tough glossy shell.", features: DUAL },
  { n: 24, name: "Sunset Ombre Case", category: "colorful", price: 699, rating: 4.7, reviews: 334, colors: ["Orange", "Pink", "Plum"],
    desc: "Warm orange fading into pink and plum, like the last ten minutes of daylight.", features: DUAL },
];
