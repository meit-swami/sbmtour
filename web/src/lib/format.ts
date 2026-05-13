/** Format an INR amount (number) into ₹X,XX,XXX. Returns null for invalid input. */
export function formatINR(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n) || n <= 0) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Returns the INR value of a number (assumes input already INR). */
export function toINR(value: number): number {
  return Math.round(value);
}
