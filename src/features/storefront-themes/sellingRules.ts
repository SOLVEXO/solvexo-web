/** Seller-set order quantity rules (minimum / maximum / multiples of) read off a product; missing = 1 / no cap / 1. */
export interface QtyRules { min: number; max: number; step: number }

interface RuleSource { orderMinQuantity?: number | null; orderMaxQuantity?: number | null; orderQuantityStep?: number | null }

/** `stockMax` is the most the stock allows; the seller's own maximum can only lower it. */
export function resolveQtyRules(product: RuleSource | null | undefined, stockMax: number): QtyRules {
  const step = Math.max(1, Math.floor(product?.orderQuantityStep ?? 1));
  const min = Math.max(1, Math.floor(product?.orderMinQuantity ?? 1));
  const cap = product?.orderMaxQuantity ? Math.min(stockMax, product.orderMaxQuantity) : stockMax;
  // Highest allowed value that is min + k*step.
  const max = cap >= min ? min + Math.floor((cap - min) / step) * step : min;
  return { min, max, step };
}

export const clampQty = (q: number, r: QtyRules): number => {
  const snapped = r.min + Math.round((Math.max(r.min, q) - r.min) / r.step) * r.step;
  return Math.min(r.max, Math.max(r.min, snapped));
};

export function qtyRuleHint(r: QtyRules): string | null {
  const parts: string[] = [];
  if (r.min > 1) parts.push(`Minimum ${r.min}`);
  if (r.step > 1) parts.push(`sold in multiples of ${r.step}`);
  return parts.length ? parts.join(', ') : null;
}

export function preorderLabel(p: { preorder?: { enabled?: boolean; availableOn?: string | null } | null } | null | undefined): string | null {
  if (!p?.preorder?.enabled) return null;
  const d = p.preorder.availableOn ? new Date(p.preorder.availableOn) : null;
  return d && !Number.isNaN(d.getTime()) ? `Pre-order — ships from ${d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Pre-order';
}
