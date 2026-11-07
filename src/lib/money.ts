// All amounts are stored as integers in paise (1/100 rupee).
export const formatPrice = (paise: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);

export const FREE_SHIPPING_OVER = 99900; // ₹999
export const SHIPPING_FLAT = 4900; // ₹49

export const shippingFor = (subtotalPaise: number) =>
  subtotalPaise === 0 || subtotalPaise >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FLAT;
