import { useEffect, useMemo, useRef, useState } from 'react';
import { specKeyFrom } from './productSpecs';
import { specAppliesTo, moveBefore, moveStep, flattenCategories, categorySummary } from './specVisibility';
import { SpecCategoryPicker } from './SpecCategoryPicker';
import { suggestSpecs, type SpecSuggestion } from './specSuggestions';
import { useStoreCategoryTree } from '@/hooks/store/useStoreCategoryTree';
import { ArrowDown, ArrowUp, Check, GripVertical, Loader2, Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { ActionMenu, Button, Modal, Select } from '@/components/comman/ui';
import { can } from '@/hooks/auth/useCan';
import { ValueInput } from '@/features/seller/store/Dashboard/OnlineStore/customize/MetafieldsEditor';
import {
  apiCreateMetafieldDefinition, apiDeleteMetafieldDefinition, apiReorderMetafieldDefinitions, METAFIELD_TYPE_LABELS, apiGetMetafieldDefinitionUsage, apiGetMetafieldValues, apiListMetafieldDefinitions, apiSetMetafieldValues, apiUpdateMetafieldDefinition,
  type MetafieldDefinition, type MetafieldType,
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
/** The types a seller can pick for a new spec here (the full list stays in Settings → Custom Fields). */
const SPEC_TYPES: MetafieldType[] = ['single_line_text_field', 'multi_line_text_field', 'number_integer', 'number_decimal', 'dimension', 'weight', 'volume', 'boolean', 'date', 'url', 'color'];

export function ProductSpecsEditor({ storeId, productId, onValuesChange, categoryIds = [] }: {
  storeId: string;
  productId?: string;
  onValuesChange?: (values: Record<string, string>) => void;
  /** The product's category and sub-category (as chosen in the form): specs meant for other categories are tucked away. */
  categoryIds?: string[];
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
  const [manage, setManage] = useState<{ def: MetafieldDefinition; mode: 'rename' | 'delete' | 'categories'; used: number | null } | null>(null);
  const [pickedCats, setPickedCats] = useState<string[]>([]);
  const [newType, setNewType] = useState<MetafieldType>('single_line_text_field');
  const [onlyHere, setOnlyHere] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState('');
  const { tree } = useStoreCategoryTree(storeId);
  const catOptions = useMemo(() => flattenCategories(tree), [tree]);
  const here = categoryIds.filter(Boolean);
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

  /** Creates the shared field. The key may be taken by a field with a different name: retry once with a short suffix. */
  const createSpec = async (name: string, type: MetafieldType, cats: string[]) => {
    const base = specKeyFrom(name);
    const body = { ownerResource: 'product' as const, name: name.slice(0, 60), type, storefrontAccess: true, ...(cats.length ? { categoryIds: cats } : {}) };
    try {
      return (await apiCreateMetafieldDefinition(storeId, { ...body, key: base })).data;
    } catch {
      return (await apiCreateMetafieldDefinition(storeId, { ...body, key: `${base.slice(0, 34)}-${Math.random().toString(36).slice(2, 6)}` })).data;
    }
  };

  // Starter specs for this product's kind of category (Clothing: Size, Fabric ...), added with one click.
  const [suggestBusy, setSuggestBusy] = useState(false);
  const [suggestOff, setSuggestOff] = useState(false);
  const suggestion = useMemo(() => {
    if (suggestOff || !defs || !canManage) return null;
    const names = here.map(id => catOptions.find(o => o.id === id)?.name ?? '').filter(Boolean);
    return suggestSpecs(names, defs.map(d => d.name));
  }, [suggestOff, defs, canManage, here, catOptions]);
  const addSuggested = async (picks: SpecSuggestion[]) => {
    setSuggestBusy(true); setAddError('');
    try {
      const made: MetafieldDefinition[] = [];
      for (const p of picks) made.push(await createSpec(p.name, p.type, here.slice(-1)));
      setDefs(prev => [...(prev ?? []), ...made]);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Could not add the suggested specs.');
    } finally { setSuggestBusy(false); }
  };

  const addSpec = async () => {
    const name = newName.trim();
    if (!name) return;
    if ((defs ?? []).some(d => d.name.toLowerCase() === name.toLowerCase())) { setAddError('You already have a spec with this name.'); return; }
    setBusy(true); setAddError('');
    try {
      const created = await createSpec(name, newType, onlyHere && here.length ? here.slice(-1) : []);
      setDefs(prev => [...(prev ?? []), created]);
      setNewName(''); setAdding(false); setNewType('single_line_text_field'); setOnlyHere(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Could not add this spec.');
    } finally {
      setBusy(false);
    }
  };

  const openManage = (def: MetafieldDefinition, mode: 'rename' | 'delete' | 'categories') => {
    setManage({ def, mode, used: null }); setRenameTo(def.name); setManageError(''); setPickedCats(def.categoryIds ?? []);
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

  const doCategories = async () => {
    if (!manage) return;
    setManageBusy(true); setManageError('');
    try {
      await apiUpdateMetafieldDefinition(storeId, manage.def._id, { categoryIds: pickedCats });
      setDefs(prev => (prev ?? []).map(d => (d._id === manage.def._id ? { ...d, categoryIds: pickedCats } : d)));
      setManage(null);
    } catch (err) {
      setManageError(err instanceof Error ? err.message : 'Could not save the categories.');
    } finally { setManageBusy(false); }
  };

  const hasValue = (d: MetafieldDefinition) => !!values[valueKey(d)]?.trim();
  const shown = (d: MetafieldDefinition) => showAll || specAppliesTo(d, here, hasValue(d));
  const visibleDefs = (defs ?? []).filter(shown);
  // how many specs are for other categories (counted whether or not they are shown right now, so the toggle can hide them again)
  const hiddenCount = (defs ?? []).filter(d => !specAppliesTo(d, here, hasValue(d))).length;

  /** The new order: shown at once, saved in the background (a failed save puts the old order back). */
  const applyOrder = (next: MetafieldDefinition[]) => {
    const before = defs;
    if (!before || next === before) return;
    setDefs(next); setOrderError('');
    apiReorderMetafieldDefinitions(storeId, 'product', next.map(d => d._id)).catch(() => { setDefs(before); setOrderError('Could not save the new order.'); });
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
      // Only the specs this product shows: a spec meant for another category is neither sent nor checked as required.
      await apiSetMetafieldValues(storeId, 'product', productId, defs.filter(shown).map(d => ({ namespace: d.namespace, key: d.key, value: (values[valueKey(d)] ?? '').trim() })));
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
        {defs && defs.length > 0 && visibleDefs.length === 0 && <p className="text-[12px] text-slate m-0">None of your specs are for this product&apos;s category yet.</p>}
        {defs && visibleDefs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visibleDefs.map(d => (
              <div key={d._id} role="group" aria-label={d.name} style={{ opacity: dragId === d._id ? 0.5 : 1 }}
                onDragOver={e => { if (dragId && dragId !== d._id) e.preventDefault(); }}
                onDrop={e => { e.preventDefault(); if (dragId) applyOrder(moveBefore(defs ?? [], dragId, d._id)); setDragId(null); }}>
                <div className="mb-1 flex min-h-[28px] items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-[12px] font-medium text-charcoal">{canManage && (
                    <span draggable aria-label={`Drag to move ${d.name}`} title="Drag to change the order" className="mr-1 inline-block cursor-grab align-middle text-slate"
                      onDragStart={e => { setDragId(d._id); e.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => setDragId(null)}><GripVertical size={13} /></span>
                  )}{d.name}{d.required && <span className="text-brand-orange"> *</span>}
                    {(d.categoryIds ?? []).length > 0 && <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10.5px] font-normal text-slate" title="Only for these categories"><Tag size={10} />{categorySummary(d.categoryIds, catOptions) || 'Categories'}</span>}
                  </span>
                  {canManage && (
                    <ActionMenu ariaLabel={`Manage spec ${d.name}`} triggerClassName="w-7 h-7 shrink-0 rounded-[7px] border border-bone bg-white text-slate flex items-center justify-center cursor-pointer hover:bg-cream" items={[
                      { label: 'Move up', icon: <ArrowUp size={13} />, onClick: () => applyOrder(moveStep(defs ?? [], d._id, -1, shown)) },
                      { label: 'Move down', icon: <ArrowDown size={13} />, onClick: () => applyOrder(moveStep(defs ?? [], d._id, 1, shown)) },
                      { label: 'Choose categories…', icon: <Tag size={13} />, onClick: () => openManage(d, 'categories') },
                      { label: 'Rename', icon: <Pencil size={13} />, onClick: () => openManage(d, 'rename') },
                      { label: 'Delete', icon: <Trash2 size={13} />, danger: true, onClick: () => openManage(d, 'delete') },
                    ]} />
                  )}
                </div>
                <ValueInput entry={{ definitionId: d._id, namespace: d.namespace, key: d.key, name: d.name, type: d.type, required: d.required, value: values[valueKey(d)] ?? '' }} value={values[valueKey(d)] ?? ''} onChange={v => change(d, v)} />
              </div>
            ))}
            <p className="m-0 text-[11.5px] text-slate sm:col-span-2">A spec you leave empty is not shown in this product&apos;s table. Specs are shared by all your products; use the menu on a spec to move, rename, delete it or limit it to some categories.</p>
          </div>
        )}
        {orderError && <p role="alert" className="text-[12px] text-error m-0">{orderError}</p>}
        {defs && hiddenCount > 0 && (
          <button type="button" onClick={() => setShowAll(v => !v)} className="self-start bg-transparent border-none p-0 text-[12px] text-slate underline cursor-pointer">
            {showAll ? 'Hide the specs for other categories' : `Show ${hiddenCount} spec${hiddenCount === 1 ? '' : 's'} for other categories`}
          </button>
        )}
        {suggestion && !adding && (
          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-bone bg-cream/40 px-3 py-2.5" data-testid="spec-suggestions">
            <p className="m-0 text-[12px] text-charcoal">Suggested for {suggestion.label.toLowerCase()}: add the ones you need.</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {suggestion.specs.map(p => (
                <button key={p.name} type="button" disabled={suggestBusy} onClick={() => void addSuggested([p])}
                  className="inline-flex items-center gap-1 rounded-full border border-bone bg-white px-2.5 py-1 text-[12px] text-charcoal cursor-pointer hover:bg-cream disabled:opacity-50"><Plus size={11} />{p.name}</button>
              ))}
              <button type="button" disabled={suggestBusy} onClick={() => void addSuggested(suggestion.specs)}
                className="ml-1 border-none bg-transparent p-0 text-[12px] font-semibold text-brand-deep-orange underline cursor-pointer disabled:opacity-50">{suggestBusy ? 'Adding…' : 'Add all'}</button>
              <button type="button" onClick={() => setSuggestOff(true)} className="ml-auto border-none bg-transparent p-0 text-[12px] text-slate cursor-pointer">Not now</button>
            </div>
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
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 text-[12px] text-slate">Type
                <Select aria-label="Spec type" value={newType} onChange={e => setNewType(e.target.value as MetafieldType)}>
                  {SPEC_TYPES.map(t => <option key={t} value={t}>{METAFIELD_TYPE_LABELS[t]}</option>)}
                </Select>
              </label>
              {here.length > 0 && (
                <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-slate">
                  <input type="checkbox" checked={onlyHere} onChange={e => setOnlyHere(e.target.checked)} /> Only for products in this category
                </label>
              )}
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
      {manage?.mode === 'categories' && (
        <Modal title={`Categories for "${manage.def.name}"`} onClose={() => setManage(null)} width={460} mobileSheet={false}
          footer={<><Button variant="outline" onClick={() => setManage(null)}>Cancel</Button><Button onClick={() => void doCategories()} loading={manageBusy}>Save</Button></>}>
          <div className="flex flex-col gap-2">
            <SpecCategoryPicker storeId={storeId} selected={pickedCats} onChange={setPickedCats} />
            <p className="m-0 text-[12px] text-slate">A product that already has a value for this spec keeps showing it.</p>
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
