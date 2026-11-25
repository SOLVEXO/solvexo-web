import { isColorOptionName } from '@/features/storefront-themes/core/product/variantOptions';
import type { VariantRow } from './variantMatrix';

/**
 * Pure helpers for "which photos belong to which variant" in the seller form.
 * No React here so it is directly unit-testable.
 *
 * Shopify model: ONE list of product photos; a photo can be linked to one or many
 * variants. The option that decides the photos is the Colour option when there is
 * one (all sizes of Black share the Black photos), otherwise the first option.
 */

/** The option whose value groups variants for photos: Colour if present, else the first option. */
export function photoOptionName(rows: VariantRow[]): string | null {
  const names: string[] = [];
  for (const r of rows) for (const o of r.options) if (!names.includes(o.name)) names.push(o.name);
  return names.find(isColorOptionName) ?? names[0] ?? null;
}

/** The value of that option for one row ("Black"), or null when the row has no such option. */
export function groupValue(row: VariantRow, optionName: string | null): string | null {
  if (!optionName) return null;
  return row.options.find(o => o.name === optionName)?.value ?? null;
}

/** Keys of every row that shares this row's photo-option value (the row itself included). */
export function sameGroupKeys(rows: VariantRow[], row: VariantRow, optionName: string | null): string[] {
  const value = groupValue(row, optionName);
  if (value === null) return [row.key];
  return rows.filter(r => groupValue(r, optionName) === value).map(r => r.key);
}

/** Display name of a row: "Black / M". */
export function rowName(row: VariantRow): string {
  return row.options.map(o => o.value).join(' / ') || 'Variant';
}

/** Photos some variant OTHER than the given keys already claims (so "unassigned" = used by nobody). */
export function claimedByOthers(rows: VariantRow[], exceptKeys: string[]): Set<string> {
  const out = new Set<string>();
  for (const r of rows) {
    if (exceptKeys.includes(r.key)) continue;
    for (const u of r.images) out.add(u);
  }
  return out;
}

/** url -> the distinct option values (or variant names) it is linked to, for the little tags on the gallery. */
export function photoLabels(rows: VariantRow[]): Record<string, string[]> {
  const opt = photoOptionName(rows);
  const out: Record<string, string[]> = {};
  for (const r of rows) {
    const label = groupValue(r, opt) ?? rowName(r);
    for (const u of r.images) {
      const list = (out[u] ??= []);
      if (!list.includes(label)) list.push(label);
    }
  }
  return out;
}

/** Short tag text for a gallery tile: "Black", "Black +2". */
export function tagText(labels: string[] | undefined): string {
  if (!labels || labels.length === 0) return '';
  return labels.length === 1 ? labels[0] : `${labels[0]} +${labels.length - 1}`;
}

/** Links (or unlinks) photos to the given rows. */
export function setRowImages(rows: VariantRow[], keys: string[], update: (current: string[]) => string[]): VariantRow[] {
  return rows.map(r => (keys.includes(r.key) ? { ...r, images: update(r.images) } : r));
}

/** Product photos that no variant links to (they are the shared photos every variant shows after its own). */
export function unlinkedPhotos(rows: VariantRow[], productImages: string[]): string[] {
  const used = new Set(rows.flatMap(r => r.images));
  return productImages.filter(u => !used.has(u));
}
