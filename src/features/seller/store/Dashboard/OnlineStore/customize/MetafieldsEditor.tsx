import { useState, useEffect, useCallback } from 'react';
import { Check, Loader2 } from 'lucide-react';
import {
  apiGetMetafieldValues, apiSetMetafieldValues,
  type MetafieldValueEntry, type MetafieldOwnerResource,
} from '@/api/services/metafields';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';
const ta  = `${inp} resize-y min-h-[70px]`;

function ValueInput({ entry, value, onChange }: { entry: MetafieldValueEntry; value: string; onChange: (v: string) => void }) {
  switch (entry.type) {
    case 'multi_line_text_field':
      return <textarea className={ta} value={value} onChange={e => onChange(e.target.value)} />;
    case 'number_integer':
      return <input type="number" step={1} className={inp} value={value} onChange={e => onChange(e.target.value)} />;
    case 'number_decimal':
      return <input type="number" step="any" className={inp} value={value} onChange={e => onChange(e.target.value)} />;
    case 'boolean':
      return (
        <select className={inp} value={value || 'false'} onChange={e => onChange(e.target.value)}>
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    case 'date':
      return <input type="date" className={inp} value={value} onChange={e => onChange(e.target.value)} />;
    case 'url':
      return <input type="url" className={inp} placeholder="https://…" value={value} onChange={e => onChange(e.target.value)} />;
    case 'color':
      return (
        <div className="flex items-center gap-2">
          <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)} className="w-9 h-9 rounded border border-bone cursor-pointer p-0.5" />
          <input className={inp} value={value} onChange={e => onChange(e.target.value)} placeholder="#000000" />
        </div>
      );
    case 'json':
      return <textarea className={`${ta} font-mono text-[12px]`} value={value} onChange={e => onChange(e.target.value)} placeholder="{}" />;
    default:
      return <input className={inp} value={value} onChange={e => onChange(e.target.value)} />;
  }
}

/** Real per-resource custom-field editor — this is the merchant-facing half
 *  of the Metafields system (the other half, `MetafieldDefinitionsPage`,
 *  is where a seller declares which fields exist at all). Embed anywhere a
 *  resource is edited (currently `StoreEditProduct.tsx`); renders nothing at
 *  all if the store has no definitions for this `ownerResource` yet, so a
 *  seller who's never touched Custom Fields sees no empty/dead UI. */
export function MetafieldsEditor({ storeId, ownerResource, ownerId }: {
  storeId: string;
  ownerResource: MetafieldOwnerResource;
  ownerId: string;
}) {
  const [entries, setEntries] = useState<MetafieldValueEntry[] | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiGetMetafieldValues(storeId, ownerResource, ownerId)
      .then(res => {
        if (cancelled) return;
        setEntries(res.data);
        setValues(Object.fromEntries(res.data.map(e => [`${e.namespace}:${e.key}`, e.value])));
      })
      .catch(() => { if (!cancelled) setEntries([]); });
    return () => { cancelled = true; };
  }, [storeId, ownerResource, ownerId]);

  const setFieldValue = useCallback((namespace: string, key: string, v: string) => {
    setSaved(false);
    setValues(prev => ({ ...prev, [`${namespace}:${key}`]: v }));
  }, []);

  const handleSave = async () => {
    if (!entries) return;
    setSaving(true);
    setError('');
    try {
      const payload = entries.map(e => ({ namespace: e.namespace, key: e.key, value: values[`${e.namespace}:${e.key}`] ?? '' }));
      const res = await apiSetMetafieldValues(storeId, ownerResource, ownerId, payload);
      setEntries(res.data);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save custom fields.');
    } finally {
      setSaving(false);
    }
  };

  if (entries === null) return null; // still loading — no flash of an empty card
  if (entries.length === 0) return null; // no definitions for this resource type — nothing to show

  // Owns its own card chrome (rather than relying on a caller-provided
  // wrapper) specifically so it can render nothing at all — including no
  // empty card shell — for a store with no definitions for this resource
  // type, which resolves asynchronously and can't be known by the caller
  // before this component's own fetch completes.
  return (
    <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-bone">
        <p className="text-[13px] font-bold text-charcoal">Custom Fields</p>
      </div>
      <div className="px-5 py-4 flex flex-col gap-3">
          {entries.map(entry => (
            <div key={entry.definitionId}>
              <label className="block text-[12px] font-medium text-charcoal mb-1">
                {entry.name}{entry.required && <span className="text-brand-orange ml-[2px]"> *</span>}
              </label>
              <ValueInput entry={entry} value={values[`${entry.namespace}:${entry.key}`] ?? ''} onChange={v => setFieldValue(entry.namespace, entry.key, v)} />
            </div>
          ))}
          {error && <p className="text-[12px] text-error">{error}</p>}
          <div className="flex items-center gap-3">
            <button
              type="button" onClick={handleSave} disabled={saving}
              className="px-3 py-1.5 text-[12px] font-semibold rounded-lg border border-bone bg-white text-charcoal cursor-pointer disabled:opacity-60"
            >
              {saving ? <Loader2 size={13} className="animate-spin inline" /> : 'Save Custom Fields'}
            </button>
            {saved && !saving && (
              <span className="flex items-center gap-1 text-[12px] font-semibold text-success"><Check size={13} /> Saved</span>
            )}
          </div>
      </div>
    </div>
  );
}
