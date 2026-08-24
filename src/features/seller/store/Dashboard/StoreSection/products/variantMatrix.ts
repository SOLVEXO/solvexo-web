/**
 * Pure Cartesian-product logic for the variant matrix editor — no React here
 * so it's directly unit-testable. This is the actual capability the backend
 * (`ProductVariantsService`, `addPhysicalProduct`) already fully supports but
 * the seller-facing form never exposed: real Size×Color-style variant
 * generation instead of one flat variant with cosmetic option tags.
 */

export interface OptionType {
  /** e.g. "Size" */
  name: string;
  /** e.g. ["S", "M", "L"] — order is preserved and is the display order. */
  values: string[];
}

export interface VariantCombination {
  /** One {name, value} pair per option type, e.g. [{name:'Size',value:'M'},{name:'Color',value:'Red'}]. */
  options: { name: string; value: string }[];
  /** Stable, order-independent key for matching a combination across regenerations (see `mergeExistingRows`). */
  key: string;
}

/** Matches the backend's `MAX_OPTIONS_PER_VARIANT` (ProductVariant.options is capped at 3 attributes). */
export const MAX_OPTION_TYPES = 3;

/** Matches Shopify's own documented ceiling — a sane bound so a seller can't accidentally generate an unusable four-digit matrix from a typo (e.g. pasting 40 values into one field). */
export const MAX_VARIANT_COMBINATIONS = 100;

export function combinationKey(options: { name: string; value: string }[]): string {
  return options
    .map(o => `${o.name.trim().toLowerCase()}:${o.value.trim().toLowerCase()}`)
    .sort()
    .join('|');
}

/**
 * The actual Cartesian product. Empty/whitespace-only values are dropped
 * before multiplying (a stray empty row in the values input shouldn't
 * silently double the matrix with blank-valued variants). Option types with
 * zero real values are dropped entirely, same reasoning.
 */
export function buildCombinations(optionTypes: OptionType[]): VariantCombination[] {
  const cleaned = optionTypes
    .map(t => ({ name: t.name.trim(), values: t.values.map(v => v.trim()).filter(Boolean) }))
    .filter(t => t.name && t.values.length > 0);

  if (cleaned.length === 0) return [];

  let combos: { name: string; value: string }[][] = [[]];
  for (const type of cleaned) {
    const next: { name: string; value: string }[][] = [];
    for (const combo of combos) {
      for (const value of type.values) {
        next.push([...combo, { name: type.name, value }]);
      }
    }
    combos = next;
  }

  return combos.map(options => ({ options, key: combinationKey(options) }));
}

/**
 * Regenerating the matrix (add/remove a value or option type) must not
 * silently wipe out price/SKU/stock a seller already entered for a
 * combination that still exists — this re-keys by `combinationKey` so an
 * unaffected row's data survives, and only genuinely new combinations get
 * blank defaults.
 */
export interface VariantRow {
  key: string;
  options: { name: string; value: string }[];
  price: string;
  compareAtPrice: string;
  sku: string;
  barcode: string;
  stock: string;
  unlimitedStock: boolean;
}

export function blankVariantRow(combo: VariantCombination): VariantRow {
  return { key: combo.key, options: combo.options, price: '', compareAtPrice: '', sku: '', barcode: '', stock: '', unlimitedStock: false };
}

export function mergeExistingRows<Row extends { key: string }>(
  newCombinations: VariantCombination[],
  existingRows: Row[],
  makeBlankRow: (combo: VariantCombination) => Row,
): Row[] {
  const existingByKey = new Map(existingRows.map(r => [r.key, r]));
  return newCombinations.map(combo => existingByKey.get(combo.key) ?? makeBlankRow(combo));
}
