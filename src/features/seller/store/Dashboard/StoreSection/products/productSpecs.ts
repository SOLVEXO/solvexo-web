import { apiSetMetafieldValues } from '@/api/services/metafields';

/** "Brand name" -> "brand-name" (the machine key of a spec). Always starts with a letter, at most 40 characters. */
export function specKeyFrom(name: string): string {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 34);
  return /^[a-z]/.test(base) ? base : `spec-${base}`.replace(/-$/, '');
}

/** Add page: write the specs the seller typed once the product exists. Resolves false when saving failed (the product itself is already saved). */
export async function saveProductSpecs(storeId: string, productId: string, values: Record<string, string>): Promise<boolean> {
  const rows = Object.entries(values)
    .map(([k, v]) => ({ k, v: v.trim() }))
    .filter(r => r.v !== '')
    .map(r => { const i = r.k.indexOf(':'); return { namespace: r.k.slice(0, i), key: r.k.slice(i + 1), value: r.v }; });
  if (rows.length === 0) return true;
  try { await apiSetMetafieldValues(storeId, 'product', productId, rows); return true; } catch { return false; }
}
