import { useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';
import { apiGetPublicStoreProducts, type PublicStoreFacets } from '@/api/services/store';
import { featuredProductsQuery } from '@/features/storefront-themes/core/sectionProductQuery';
import { useKeyedLoad } from '@/components/comman/dashboard/useKeyedLoad';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none focus:border-brand-orange';
const MAX_ITEMS = 20;

/** The store's own tags / vendors / price range, from the same "facets" the shop filters use: one request per store. */
function useStoreFacets(storeId: string) {
  return useKeyedLoad(() => apiGetPublicStoreProducts(storeId, { limit: 1, facets: true }).then(r => r.data?.facets ?? null), `facets:${storeId}`, !!storeId);
}

type Facets = (PublicStoreFacets & { vendors?: { value: string; count: number }[] }) | null;

/** A short list of values (tags or vendors) as chips, with suggestions taken from the store's real data and a free "add" box. */
export function ValueListField({ value, source, storeId, onChange }: {
  value: unknown;
  source: 'tags' | 'vendors';
  storeId: string;
  onChange: (next: string[]) => void;
}) {
  const listId = useId();
  const [draft, setDraft] = useState('');
  const { data } = useStoreFacets(storeId);
  const facets = data as Facets;
  const chosen = (Array.isArray(value) ? value : []).filter((v): v is string => typeof v === 'string');
  const known = ((source === 'tags' ? facets?.tags : facets?.vendors) ?? []).filter(o => !chosen.some(c => c.toLowerCase() === o.value.toLowerCase()));

  const add = (raw: string) => {
    const v = raw.trim().replace(/[,<>]/g, '').slice(0, 60);
    if (!v || chosen.length >= MAX_ITEMS || chosen.some(c => c.toLowerCase() === v.toLowerCase())) { setDraft(''); return; }
    onChange([...chosen, v]);
    setDraft('');
  };
  const noun = source === 'tags' ? 'tag' : 'vendor';

  return (
    <div className="flex flex-col gap-2">
      {chosen.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0" aria-label={`Chosen ${noun}s`}>
          {chosen.map(c => (
            <li key={c} className="inline-flex items-center gap-1 rounded-full bg-cream border border-bone pl-2.5 pr-1 py-0.5 text-[12px] text-charcoal">
              {c}
              <button type="button" aria-label={`Remove ${c}`} onClick={() => onChange(chosen.filter(x => x !== c))} className="w-4 h-4 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer text-slate hover:bg-bone"><X size={11} /></button>
            </li>
          ))}
        </ul>
      )}
      <input
        className={inp} list={listId} value={draft} maxLength={60} disabled={chosen.length >= MAX_ITEMS}
        placeholder={chosen.length >= MAX_ITEMS ? `Up to ${MAX_ITEMS}` : `Type or pick a ${noun}, press Enter`}
        aria-label={`Add a ${noun}`}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(draft); } }}
        onBlur={() => { if (draft.trim()) add(draft); }}
      />
      <datalist id={listId}>{known.slice(0, 100).map(o => <option key={o.value} value={o.value}>{`${o.value} (${o.count})`}</option>)}</datalist>
      <p className="text-[11.5px] text-slate">Products with <strong>any</strong> of these {noun}s match.{known.length === 0 && chosen.length === 0 ? ` Your store has no ${noun}s yet; add them on your products.` : ''}</p>
    </div>
  );
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** "N products match" for the rules as they are now, so the seller sees the effect of every change. */
export function RulesPreviewField({ settings, storeId }: { settings: Record<string, unknown>; storeId: string }) {
  const query = featuredProductsQuery(settings);
  const key = useDebounced(JSON.stringify({ ...query, limit: 1 }), 450);
  const { data, error, loading } = useKeyedLoad(
    () => apiGetPublicStoreProducts(storeId, JSON.parse(key)).then(r => r.data?.pagination?.total ?? 0),
    `rules:${storeId}:${key}`, !!storeId,
  );
  const { data: facetData } = useStoreFacets(storeId);
  const price = (facetData as Facets)?.price;

  let line: string;
  let tone = 'text-slate';
  if (error) line = 'Could not check right now. The rules are still saved.';
  else if (loading || data === null) line = 'Counting matching products…';
  else if (data === 0) { line = 'No products match these rules yet, so this section will not show on the page.'; tone = 'text-error'; }
  else line = `${data} product${data === 1 ? '' : 's'} match${data === 1 ? 'es' : ''} these rules.`;

  return (
    <div role="status" aria-live="polite" className="rounded-lg bg-cream/70 border border-bone px-3 py-2 text-[12.5px]">
      <p className={`m-0 font-medium ${tone}`}>{line}</p>
      {price && price.min !== null && price.max !== null && <p className="m-0 mt-0.5 text-[11.5px] text-slate">Your prices run from {price.min} to {price.max}{price.currency ? ` ${price.currency}` : ''}.</p>}
    </div>
  );
}
