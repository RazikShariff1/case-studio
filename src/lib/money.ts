// Amounts in the app are integers in paise (1/100 rupee). The platform's prices are rupees; convert at the edge with toPaise.
export const formatPrice = (paise: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);

export const toPaise = (rupees: number) => Math.round(rupees * 100);
