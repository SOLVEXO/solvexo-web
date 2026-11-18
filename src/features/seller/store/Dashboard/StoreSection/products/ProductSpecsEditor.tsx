import { useEffect, useRef, useState } from 'react';
import { specKeyFrom } from './productSpecs';
import { Check, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { ActionMenu, Button, Modal } from '@/components/comman/ui';
import { can } from '@/hooks/auth/useCan';
import { ValueInput } from '@/features/seller/store/Dashboard/OnlineStore/customize/MetafieldsEditor';
import {
  apiCreateMetafieldDefinition, apiDeleteMetafieldDefinition, apiGetMetafieldDefinitionUsage, apiGetMetafieldValues, apiListMetafieldDefinitions, apiSetMetafieldValues, apiUpdateMetafieldDefinition,
  type MetafieldDefinition,
} from '@/api/services/metafields';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none focus:border-brand-orange';

/** One spec row the product form shows: the field's name + its value for THIS product. */
const valueKey = (d: Pick<MetafieldDefinition, 'namespace' | 'key'>) => `${d.namespace}:${d.key}`;

/** Specifications of a product (Brand, Capacity, Colour ...), saved as custom fields (metafields) of the product so every
 *  product of the store uses the SAME field names. The seller types the value; "+ Add spec" creates a new shared field
 *  right here (no trip to Settings). Shown on the storefront as the Specifications table / "Additional information" tab.
 *  - Edit page: pass `productId`; the card loads and saves the values itself.
 *  - Add page: no `productId` yet; the parent receives the values through `onValuesChange` and saves them after the
 *    product exists (see `saveProductSpecs`). */
export function ProductSpecsEditor({ storeId, productId, onValuesChange }: {
  storeId: string;
  productId?: string;
  onValuesChange?: (values: Record<string, string>) => void;
}) {
  const [defs, setDefs] = useState<MetafieldDefinition[] | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [attempt, setAttempt] = useState(0);
  // Rename / delete of a spec: the spec is shared by every product, so the dialog says so.
  const [manage, setManage] = useState<{ def: MetafieldDefinition; mode: 'rename' | 'delete'; used: number | null } | null>(null);
  const [renameTo, setRenameTo] = useState('');
  const [manageBusy, setManageBusy] = useState(false);
  const [manageError, setManageError] = useState('');
  const canManage = can('content.metaobjects.manage');
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (adding) nameRef.current?.focus(); }, [adding]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiListMetafieldDefinitions(storeId, 'product'),
      productId ? apiGetMetafieldValues(storeId, 'product', productId) : Promise.resolve(null),
    ]).then(([defRes, valRes]) => {
      if (cancelled) return;
      setDefs(defRes.data);
      if (valRes) setValues(Object.fromEntries(valRes.data.map(e => [`${e.namespace}:${e.key}`, e.value])));
    }).catch(() => { if (!cancelled) setLoadError('Could not load specifications.'); });
    return () => { cancelled = true; };
  }, [storeId, productId, attempt]);

  const change = (d: MetafieldDefinition, v: string) => {
    setSaved(false);
    const next = { ...values, [valueKey(d)]: v };
    setValues(next);
    onValuesChange?.(next);
  };

  const addSpec = async () => {
    const name = newName.trim();
    if (!name) return;
    if ((defs ?? []).some(d => d.name.toLowerCase() === name.toLowerCase())) { setAddError('You already have a spec with this name.'); return; }
    setBusy(true); setAddError('');
    try {
      const base = specKeyFrom(name);
      let res;
      try {
        res = await apiCreateMetafieldDefinition(storeId, { ownerResource: 'product', key: base, name: name.slice(0, 60), type: 'single_line_text_field', storefrontAccess: true });
      } catch {
        // The key may be taken by a field with a different name: retry once with a short suffix.
        res = await apiCreateMetafieldDefinition(storeId, { ownerResource: 'product', key: `${base.slice(0, 34)}-${Math.random().toString(36).slice(2, 6)}`, name: name.slice(0, 60), type: 'single_line_text_field', storefrontAccess: true });
      }
      setDefs(prev => [...(prev ?? []), res.data]);
      setNewName(''); setAdding(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Could not add this spec.');
    } finally {
      setBusy(false);
    }
  };

  const openManage = (def: MetafieldDefinition, mode: 'rename' | 'delete') => {
    setManage({ def, mode, used: null }); setRenameTo(def.name); setManageError('');
    if (mode === 'delete') {
      apiGetMetafieldDefinitionUsage(storeId, def._id)
        .then(r => setManage(m => (m && m.def._id === def._id ? { ...m, used: r.data.used } : m)))
        .catch(() => setManage(m => (m && m.def._id === def._id ? { ...m, used: -1 } : m)));
    }
  };

  const doRename = async () => {
    if (!manage) return;
    const name = renameTo.trim().slice(0, 60);
    if (!name) { setManageError('Give the spec a name.'); return; }
    if ((defs ?? []).some(d => d._id !== manage.def._id && d.name.toLowerCase() === name.toLowerCase())) { setManageError('You already have a spec with this name.'); return; }
    setManageBusy(true); setManageError('');
    try {
      const res = await apiUpdateMetafieldDefinition(storeId, manage.def._id, { name });
      setDefs(prev => (prev ?? []).map(d => (d._id === manage.def._id ? { ...d, name: res.data?.name ?? name } : d)));
      setManage(null);
    } catch (err) {
      setManageError(err instanceof Error ? err.message : 'Could not rename this spec.');
    } finally { setManageBusy(false); }
  };

  const doDelete = async () => {
    if (!manage) return;
    setManageBusy(true); setManageError('');
    try {
      await apiDeleteMetafieldDefinition(storeId, manage.def._id);
      const gone = valueKey(manage.def);
      setDefs(prev => (prev ?? []).filter(d => d._id !== manage.def._id));
      const { [gone]: _removed, ...rest } = values;
      setValues(rest);
      onValuesChange?.(rest);
      setManage(null);
    } catch (err) {
      setManageError(err instanceof Error ? err.message : 'Could not delete this spec.');
    } finally { setManageBusy(false); }
  };

  const save = async () => {
    if (!productId || !defs) return;
    setSaving(true); setSaveError('');
    try {
      await apiSetMetafieldValues(storeId, 'product', productId, defs.map(d => ({ namespace: d.namespace, key: d.key, value: (values[valueKey(d)] ?? '').trim() })));
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save specifications.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-bone">
        <p className="text-[13px] font-bold text-charcoal m-0">Specifications</p>
        <p className="text-[12px] text-slate m-0 mt-0.5">Shown as a table on the product page.</p>
      </div>
      <div className="px-5 py-4 flex flex-col gap-3">
        {loadError && (
          <p className="text-[12px] text-error m-0">{loadError} <button type="button" onClick={() => { setLoadError(''); setAttempt(a => a + 1); }} className="underline bg-transparent border-none cursor-pointer text-error p-0">Retry</button></p>
        )}
        {!loadError && defs === null && <p className="text-[12px] text-slate m-0">Loading…</p>}
        {defs && defs.length === 0 && !adding && <p className="text-[12px] text-slate m-0">No specs yet. Add the first one, for example Brand or Capacity.</p>}
        {defs && defs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {defs.map(d => (
              <div key={d._id} className="relative">
                <label className="block">
                  <span className="block text-[12px] font-medium text-charcoal mb-1 pr-8">{d.name}{d.required && <span className="text-brand-orange"> *</span>}</span>
                  <ValueInput entry={{ definitionId: d._id, namespace: d.namespace, key: d.key, name: d.name, type: d.type, required: d.required, value: values[valueKey(d)] ?? '' }} value={values[valueKey(d)] ?? ''} onChange={v => change(d, v)} />
                </label>
                {canManage && (
                  <div className="absolute right-0 -top-1">
                    <ActionMenu ariaLabel={`Manage spec ${d.name}`} items={[
                      { label: 'Rename', icon: <Pencil size={13} />, onClick: () => openManage(d, 'rename') },
                      { label: 'Delete', icon: <Trash2 size={13} />, danger: true, onClick: () => openManage(d, 'delete') },
                    ]} />
                  </div>
                )}
              </div>
            ))}
            <p className="m-0 text-[11.5px] text-slate sm:col-span-2">A spec you leave empty is not shown in this product&apos;s table. Specs are shared by all your products; use the menu on a spec to rename or delete it everywhere.</p>
          </div>
        )}
        {defs && (adding ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <input className={inp} ref={nameRef} value={newName} maxLength={60} placeholder="Spec name, e.g. Capacity"
                onChange={e => { setNewName(e.target.value); setAddError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void addSpec(); } if (e.key === 'Escape') { setAdding(false); setNewName(''); setAddError(''); } }} />
              <button type="button" onClick={() => void addSpec()} disabled={busy || !newName.trim()}
                className="px-3 py-2 text-[12px] font-semibold rounded-lg bg-brand-orange text-white border-none cursor-pointer disabled:opacity-50 shrink-0">
                {busy ? <Loader2 size={13} className="animate-spin inline" /> : 'Add'}
              </button>
              <button type="button" onClick={() => { setAdding(false); setNewName(''); setAddError(''); }}
                className="px-2 py-2 text-[12px] text-slate bg-transparent border-none cursor-pointer shrink-0">Cancel</button>
            </div>
            {addError && <p className="text-[12px] text-error m-0">{addError}</p>}
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)}
            className="self-start flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-lg border border-bone bg-white text-charcoal cursor-pointer hover:bg-cream">
            <Plus size={13} /> Add spec
          </button>
        ))}
        {productId && defs && defs.length > 0 && (
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => void save()} disabled={saving}
              className="px-3 py-1.5 text-[12px] font-semibold rounded-lg border border-bone bg-white text-charcoal cursor-pointer disabled:opacity-60">
              {saving ? <Loader2 size={13} className="animate-spin inline" /> : 'Save specifications'}
            </button>
            {saved && !saving && <span className="flex items-center gap-1 text-[12px] font-semibold text-success"><Check size={13} /> Saved</span>}
            {saveError && <span className="text-[12px] text-error">{saveError}</span>}
          </div>
        )}
      </div>
      {manage?.mode === 'rename' && (
        <Modal title="Rename spec" onClose={() => setManage(null)} width={420} mobileSheet={false}
          footer={<><Button variant="outline" onClick={() => setManage(null)}>Cancel</Button><Button onClick={() => void doRename()} loading={manageBusy}>Save</Button></>}>
          <div className="flex flex-col gap-2">
            <input className={inp} value={renameTo} maxLength={60} autoFocus aria-label="Spec name" onChange={e => { setRenameTo(e.target.value); setManageError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void doRename(); } }} />
            <p className="m-0 text-[12px] text-slate">The new name shows on every product. The values stay.</p>
            {manageError && <p role="alert" className="m-0 text-[12px] text-error">{manageError}</p>}
          </div>
        </Modal>
      )}
      {manage?.mode === 'delete' && (
        <Modal title={`Delete "${manage.def.name}"?`} onClose={() => setManage(null)} width={440} mobileSheet={false}
          footer={<><Button variant="outline" onClick={() => setManage(null)}>Cancel</Button><Button variant="danger" onClick={() => void doDelete()} loading={manageBusy}>Delete spec</Button></>}>
          <div className="flex flex-col gap-2 text-[13px] text-charcoal">
            <p className="m-0" data-testid="delete-usage">
              {manage.used === null ? 'Checking which products use it…'
                : manage.used < 0 ? 'This spec will be removed from all your products.'
                : manage.used === 0 ? 'No product has a value for it. It will be removed from the product form.'
                : `It will be removed from ${manage.used} product${manage.used === 1 ? '' : 's'}, and their values for it are deleted.`}
            </p>
            <p className="m-0 text-[12px] text-slate">This cannot be undone. To hide it on one product only, leave it empty there.</p>
            {manageError && <p role="alert" className="m-0 text-[12px] text-error">{manageError}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
