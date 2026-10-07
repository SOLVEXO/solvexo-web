import { useCallback, useEffect, useState } from 'react';
import { apiListCollections } from '@/api/services/collections';
import { apiGetStoreCategoryTree, type CategoryNode } from '@/api/services/categories';
import type { TaxOverride } from '@/api/services/store';

const inputCls = 'w-full px-3 py-[9px] rounded-lg text-[13px] border border-bone bg-bone text-charcoal outline-none box-border';

interface Option { id: string; name: string }

function flatten(nodes: CategoryNode[], depth = 0): Option[] {
  return nodes.flatMap(n => [{ id: n._id, name: `${'— '.repeat(depth)}${n.name}` }, ...flatten(n.children ?? [], depth + 1)]);
}

/** Shopify "Tax overrides": a different rate for products in chosen collections / categories (optionally one country/state). */
export function TaxOverridesEditor({ storeId, value, onChange }: { storeId: string; value: TaxOverride[]; onChange: (v: TaxOverride[]) => void }) {
  const [collections, setCollections] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([apiListCollections(storeId), apiGetStoreCategoryTree(storeId)])
      .then(([c, t]) => {
        setCollections((c.data ?? []).map(x => ({ id: x._id, name: x.name })));
        setCategories(flatten(t.data ?? []));
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Could not load collections and categories.'))
      .finally(() => setLoading(false));
  }, [storeId]);
  useEffect(load, [load]);

  const patch = (i: number, p: Partial<TaxOverride>) => onChange(value.map((o, j) => (j === i ? { ...o, ...p } : o)));
  const nameOf = (list: Option[], id: string) => list.find(o => o.id === id)?.name ?? 'Deleted';

  return (
    <div className="border-t border-bone pt-[18px] mb-[18px]">
      <p className="text-[12px] font-semibold text-charcoal mb-1">Tax overrides</p>
      <p className="text-[11px] text-slate mb-3">
        Charge a different rate for products in specific collections or categories (for example 0% on books). An override beats the
        region and default rates; leave Country blank to apply it everywhere.
      </p>
      {error && (
        <div role="alert" className="mb-3 flex items-center gap-2 text-[12px] text-red-600">
          {error}
          <button type="button" onClick={load} className="font-medium text-brand-orange hover:underline">Retry</button>
        </div>
      )}
      {loading && <p className="text-[11px] text-slate mb-2">Loading collections and categories…</p>}
      {value.map((o, i) => (
        <div key={o.id || i} className="rounded-lg border border-bone p-3 mb-3 space-y-2">
          <div className="flex items-center gap-2">
            <input value={o.name} onChange={e => patch(i, { name: e.target.value })} placeholder="Override name (e.g. Books)" maxLength={80} className={`${inputCls} flex-1`} aria-label="Override name" />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-slate hover:text-red-500 text-[16px] px-1 shrink-0" aria-label="Remove tax override">×</button>
          </div>
          <div className="flex items-center gap-2">
            <input value={o.country ?? ''} onChange={e => patch(i, { country: e.target.value.toUpperCase() || null, state: e.target.value ? o.state : null })} placeholder="US" maxLength={2} className={`${inputCls} w-16 text-center`} aria-label="Country code" title="2-letter country code; blank = everywhere" />
            <input value={o.state ?? ''} onChange={e => patch(i, { state: e.target.value || null })} disabled={!o.country} placeholder="State (optional)" className={`${inputCls} flex-1`} aria-label="State" />
            <input type="number" min={0} max={100} step={0.01} value={o.rate} onChange={e => patch(i, { rate: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} className={`${inputCls} w-20`} aria-label="Rate percent" />
            <span className="text-[12px] text-slate">%</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {o.collectionIds.map(id => (
              <span key={`c${id}`} className="inline-flex items-center gap-1 text-[11px] bg-bone rounded-full px-2 py-0.5">
                Collection: {nameOf(collections, id)}
                <button type="button" aria-label="Remove collection" onClick={() => patch(i, { collectionIds: o.collectionIds.filter(x => x !== id) })}>×</button>
              </span>
            ))}
            {o.categoryIds.map(id => (
              <span key={`k${id}`} className="inline-flex items-center gap-1 text-[11px] bg-bone rounded-full px-2 py-0.5">
                Category: {nameOf(categories, id)}
                <button type="button" aria-label="Remove category" onClick={() => patch(i, { categoryIds: o.categoryIds.filter(x => x !== id) })}>×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <select className={inputCls} value="" aria-label="Add collection" onChange={e => e.target.value && patch(i, { collectionIds: [...new Set([...o.collectionIds, e.target.value])] })}>
              <option value="">+ Add collection…</option>
              {collections.filter(c => !o.collectionIds.includes(c.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className={inputCls} value="" aria-label="Add category" onChange={e => e.target.value && patch(i, { categoryIds: [...new Set([...o.categoryIds, e.target.value])] })}>
              <option value="">+ Add category…</option>
              {categories.filter(c => !o.categoryIds.includes(c.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {o.collectionIds.length + o.categoryIds.length === 0 && <p className="text-[11px] text-red-600">Pick at least one collection or category.</p>}
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { id: '', name: '', country: null, state: null, rate: 0, collectionIds: [], categoryIds: [] }])} className="text-[12px] font-medium text-brand-orange hover:underline">
        + Add tax override
      </button>
    </div>
  );
}
