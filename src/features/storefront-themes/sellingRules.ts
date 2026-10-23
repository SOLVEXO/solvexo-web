import { ts } from '@/utils/tStatic';
import { activeLocale } from './core/locale';
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

/** Cart lines have no stock figure, so only the seller's own maximum (and the cart's 999 cap) bounds them. */
export const CART_LINE_CAP = 999;

/** Rules for a cart line (the cart payload carries the product's three order-quantity fields). */
export const cartLineRules = (line: RuleSource | null | undefined): QtyRules => resolveQtyRules(line, CART_LINE_CAP);

/** Next legal quantity after pressing + / -; null when already at the end (min for -, max for +). */
export function stepQty(current: number, dir: 1 | -1, r: QtyRules): number | null {
  if (dir > 0 ? current >= r.max : current <= r.min) return null;
  const next = clampQty(current + dir * r.step, r);
  return next === current ? null : next;
}

export function qtyRuleHint(r: QtyRules): string | null {
  const parts: string[] = [];
  if (r.min > 1) parts.push(ts('product.minQty', 'Minimum {{count}}', { count: r.min }));
  if (r.step > 1) parts.push(ts('product.stepQty', 'sold in multiples of {{count}}', { count: r.step }));
  return parts.length ? parts.join(', ') : null;
}

/** Hint for a cart line: min / multiples, plus the seller's maximum when one is set. */
export function cartQtyHint(line: RuleSource | null | undefined): string | null {
  const r = cartLineRules(line);
  const parts: string[] = [];
  if (r.min > 1) parts.push(ts('cart.minQty', 'Minimum {{count}}', { count: r.min }));
  if (r.step > 1) parts.push(ts('cart.stepQty', 'Multiples of {{count}}', { count: r.step }));
  if (line?.orderMaxQuantity) parts.push(ts('cart.maxQty', 'Maximum {{count}}', { count: r.max }));
  return parts.length ? parts.join(' · ') : null;
}

export function preorderLabel(p: { preorder?: { enabled?: boolean; availableOn?: string | null } | null } | null | undefined): string | null {
  if (!p?.preorder?.enabled) return null;
  const d = p.preorder.availableOn ? new Date(p.preorder.availableOn) : null;
  return d && !Number.isNaN(d.getTime()) ? ts('product.preorderShips', 'Pre-order — ships from {{date}}', { date: d.toLocaleDateString(activeLocale(), { day: 'numeric', month: 'long', year: 'numeric' }) }) : ts('product.preorder', 'Pre-order');
}
