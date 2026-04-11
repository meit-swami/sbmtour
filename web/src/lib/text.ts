export function stripHtml(html: string, maxLen?: number): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  let t = doc.body.textContent ?? "";
  t = t.replace(/\s+/g, " ").trim();
  if (maxLen != null && t.length > maxLen) {
    return `${t.slice(0, maxLen).trim()}…`;
  }
  return t;
}

export function formatInr(n: number | string | null | undefined): string | null {
  if (n === null || n === undefined || n === "") return null;
  const num = typeof n === "string" ? Number(n) : n;
  if (Number.isNaN(num) || num <= 0) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}
