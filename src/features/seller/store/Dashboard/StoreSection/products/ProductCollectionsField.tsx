import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiListCollections, type CollectionData } from '@/api/services/collections';

interface Props {
  storeId: string;
  /** Ids of the manual collections the product is in. */
  value: string[];
  onChange: (ids: string[]) => void;
  /** False while the product's current collections are still loading (edit form): the picker stays locked so a save cannot wipe them. */
  ready?: boolean;
}

/** Shopify-style "Collections" picker on the product form: a product can sit in any number of (manual) collections.
 *  Automatic collections (tag / category rules) fill themselves, so they are listed as information only. */
export function ProductCollectionsField({ storeId, value, onChange, ready = true }: Props) {
  const [all, setAll] = useState<CollectionData[] | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    apiListCollections(storeId)
      .then(res => { if (alive) { setAll(res.data ?? []); setError(''); } })
      .catch(() => { if (alive) setError('Could not load your collections.'); });
    return () => { alive = false; };
  }, [storeId, attempt]);

  const manual = useMemo(() => (all ?? []).filter(c => c.type === 'manual'), [all]);
  const auto = useMemo(() => (all ?? []).filter(c => c.type === 'automatic'), [all]);
  const shown = manual.filter(c => c.name.toLowerCase().includes(q.trim().toLowerCase()));
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);

  if (error) {
    return (
      <p className="text-[12px] text-error">{error}{' '}
        <button type="button" onClick={() => setAttempt(n => n + 1)} className="font-semibold text-brand-orange bg-transparent border-none cursor-pointer">Retry</button>
      </p>
    );
  }
  if (all === null || !ready) return <p className="text-[12px] text-slate">Loading collections…</p>;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12px] text-slate">
        A product can be in as many collections as you like (for example Horror and Romance). Category above stays one per product.
      </p>
      {manual.length === 0 ? (
        <p className="text-[12px] text-slate">
          You have no manual collections yet. <Link to={`/store/${storeId}/collections`} className="font-semibold text-brand-orange">Create one</Link> and it will appear here.
        </p>
      ) : (
        <>
          {manual.length > 6 && (
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search collections" aria-label="Search collections"
              className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white" />
          )}
          <ul className="m-0 p-0 list-none max-h-[220px] overflow-y-auto border border-bone rounded-lg divide-y divide-bone">
            {shown.map(c => (
              <li key={c._id}>
                <label className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-charcoal cursor-pointer">
                  <input type="checkbox" checked={value.includes(c._id)} onChange={() => toggle(c._id)} />
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  {c.status !== 'active' && <span className="text-[11px] text-slate">Draft</span>}
                </label>
              </li>
            ))}
            {shown.length === 0 && <li className="px-3 py-2 text-[12px] text-slate">No collection matches.</li>}
          </ul>
        </>
      )}
      {auto.length > 0 && (
        <p className="text-[11px] text-slate">Automatic collections ({auto.length}) add matching products by themselves, using their tags or category rules.</p>
      )}
    </div>
  );
}
