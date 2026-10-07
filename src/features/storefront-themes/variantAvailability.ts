import type { ProductVariant } from '@/api/services/marketplace';

/** Mirrors the server's ONE availability formula (`availableStock` in
 *  solvexo-api `common/stock-availability.util.ts`):
 *    stock - committedStock - damagedStock - inTransitStock
 *  The public product endpoint returns the raw variant, so the same numbers
 *  are available here. Digital products and "unlimited stock" variants are
 *  never tracked (Shopify: inventory tracking off). */
export function variantAvailable(v: ProductVariant | null | undefined, isDigital: boolean): number {
  if (!v) return 0;
  if (isDigital || v.unlimitedStock) return Infinity;
  return (Number(v.stock) || 0) - (Number(v.committedStock) || 0) - (Number(v.damagedStock) || 0) - (Number(v.inTransitStock) || 0);
}

/** Shopify "Continue selling when out of stock" -> `allowBackorder`. */
export function variantCanBuy(v: ProductVariant | null | undefined, isDigital: boolean): boolean {
  if (!v) return false;
  return !!v.allowBackorder || variantAvailable(v, isDigital) > 0;
}

/** Highest quantity a buyer may pick: the available units when inventory is
 *  tracked, no cap when the variant may be oversold / is untracked. */
export function variantMaxQty(v: ProductVariant | null | undefined, isDigital: boolean): number {
  if (!v) return 0;
  if (v.allowBackorder) return Infinity;
  return Math.max(0, variantAvailable(v, isDigital));
}

export type StockState = 'in_stock' | 'low' | 'sold_out' | 'backorder';

/** `lowThreshold` is the store's `lowStockThreshold` setting (<=0 / missing = never show low-stock text). */
export function stockState(v: ProductVariant | null | undefined, isDigital: boolean, lowThreshold?: number | null): StockState {
  const avail = variantAvailable(v, isDigital);
  if (avail > 0) return lowThreshold && lowThreshold > 0 && avail <= lowThreshold && Number.isFinite(avail) ? 'low' : 'in_stock';
  return v?.allowBackorder ? 'backorder' : 'sold_out';
}

/** Option-value availability for the variant picker: a value is unavailable
 *  when no purchasable variant combines it with the OTHER currently-selected
 *  options (Shopify/Dawn greys + strikes these but keeps them selectable). */
export function optionValueAvailable(
  variants: ProductVariant[], selected: ProductVariant | null, name: string, value: string, isDigital: boolean,
): boolean {
  const valueOf = (v: ProductVariant | null, n: string) => v?.options?.find(o => o.name === n)?.value;
  const names = Array.from(new Set(variants.flatMap(v => (v.options ?? []).map(o => o.name))));
  return variants.some(v =>
    valueOf(v, name) === value
    && names.every(n => n === name || valueOf(v, n) === valueOf(selected, n))
    && variantCanBuy(v, isDigital),
  );
}
