export type PriceFields = {
  single_discounted_price?: string | number | null;
  dual_discounted_price?: string | number | null;
  triple_discounted_price?: string | number | null;
  quad_discounted_price?: string | number | null;
  single_actual_price?: string | number | null;
  dual_actual_price?: string | number | null;
  triple_actual_price?: string | number | null;
  quad_actual_price?: string | number | null;
};

export function pickLeadPrice(p: PriceFields): number | null {
  const seq = [
    p.dual_discounted_price,
    p.single_discounted_price,
    p.triple_discounted_price,
    p.quad_discounted_price,
    p.dual_actual_price,
    p.single_actual_price,
  ];
  for (const v of seq) {
    if (v === null || v === undefined || v === "") continue;
    const n = typeof v === "string" ? Number(v) : v;
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return null;
}

export function pickTierPrice(
  disc: string | number | null | undefined,
  act: string | number | null | undefined
): number | null {
  for (const v of [disc, act]) {
    if (v === null || v === undefined || v === "") continue;
    const n = typeof v === "string" ? Number(v) : v;
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return null;
}
