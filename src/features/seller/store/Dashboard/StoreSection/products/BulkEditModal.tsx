import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { Button, Modal, SkeletonBox } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';
import { apiGetMyProductById } from '@/api/services/product';
import {
  apiBulkEditProducts, BULK_EDIT_MAX_PRODUCTS,
  type BulkEditProductUpdate, type BulkEditVariantUpdate, type BulkProductStatus,
} from '@/api/services/productsBulk';

interface VariantRow { id: string; label: string; sku: string; price: string; compare: string; stock: string; unlimited: boolean; len: string; wid: string; hei: string; origin: string; hs: string; taxable: string }
interface ProductRow {
  id: string; name: string; status: string; tags: string; digital: boolean;
  variants: VariantRow[]; loadError?: string;
}

const numStr = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n));
const normStatus = (s: string) => (s === 'archived' ? 'inactive' : s);
const parseTags = (s: string) => {
  const seen = new Set<string>();
  return s.split(',').map(t => t.trim().slice(0, 40)).filter(t => {
    const k = t.toLowerCase();
    if (!t || seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 20);
};

const INPUT = 'w-full min-w-0 border border-bone rounded-md px-2 py-1 text-[12px] text-carbon bg-white outline-none focus:border-brand-orange disabled:bg-cream disabled:text-slate disabled:cursor-not-allowed';

interface Props {
  storeId:       string;
  productIds:    string[];
  currencyLabel: string;
  canEditPrice:  boolean;
  /** Selection was larger than the editor limit (select-all mode). */
  limited?:      boolean;
  onClose:       () => void;
  /** Something was saved — the list should refetch. */
  onSaved:       () => void;
}

export function BulkEditModal({ storeId, productIds, currencyLabel, canEditPrice, limited, onClose, onSaved }: Props) {
  const toast = useToast();
  const [rows, setRows]       = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState('');
  const [edits, setEdits]     = useState<Record<string, string>>({});
  const [saving, setSaving]   = useState(false);
  const [saveError, setSaveError] = useState('');
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const savedAny = useRef(false);

  // Load every selected product with its variants (bounded concurrency).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ids = productIds.slice(0, BULK_EDIT_MAX_PRODUCTS);
      const out: ProductRow[] = new Array(ids.length);
      let next = 0;
      const worker = async () => {
        while (next < ids.length) {
          const i = next++;
          try {
            const { data } = await apiGetMyProductById(ids[i]);
            const p = data.product;
            out[i] = {
              id: p._id, name: p.name, status: normStatus(p.status), tags: (p.tags ?? []).join(', '),
              digital: p.type === 'digital',
              variants: (data.variants ?? []).filter(v => !v.isDelete).map(v => ({
                id: v._id,
                label: v.options?.map(o => o.value).join(' / ') || 'Default',
                sku: v.sku ?? '', price: numStr(v.price), compare: numStr(v.compareAtPrice),
                stock: numStr(v.stock), unlimited: !!v.unlimitedStock,
                len: numStr(v.length), wid: numStr(v.width), hei: numStr(v.height),
                origin: v.countryOfOrigin ?? '', hs: v.hsCode ?? '', taxable: v.taxable === false ? 'no' : 'yes',
              })),
            };
          } catch (e) {
            out[i] = { id: ids[i], name: 'Unavailable product', status: 'draft', tags: '', digital: true, variants: [],
              loadError: e instanceof Error ? e.message : 'Failed to load product.' };
          }
        }
      };
      try {
        await Promise.all(Array.from({ length: Math.min(6, ids.length) }, worker));
        if (!cancelled) setRows(out);
      } catch (e) {
        if (!cancelled) setLoadFailed(e instanceof Error ? e.message : 'Failed to load products.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [productIds]);

  const original = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of rows) {
      m[`p:${p.id}:name`] = p.name; m[`p:${p.id}:status`] = p.status; m[`p:${p.id}:tags`] = p.tags;
      for (const v of p.variants) {
        m[`v:${v.id}:sku`] = v.sku; m[`v:${v.id}:price`] = v.price;
        m[`v:${v.id}:compare`] = v.compare; m[`v:${v.id}:stock`] = v.stock;
        m[`v:${v.id}:len`] = v.len; m[`v:${v.id}:wid`] = v.wid; m[`v:${v.id}:hei`] = v.hei;
        m[`v:${v.id}:origin`] = v.origin; m[`v:${v.id}:hs`] = v.hs; m[`v:${v.id}:taxable`] = v.taxable;
      }
    }
    return m;
  }, [rows]);

  const val = (key: string) => (key in edits ? edits[key] : original[key] ?? '');
  const setCell = (key: string, value: string) => {
    setEdits(prev => {
      const next = { ...prev };
      if (value === (original[key] ?? '')) delete next[key]; else next[key] = value;
      return next;
    });
  };

  // Cell-level validation (blocking) and compare-at warning (non-blocking).
  const cellError = (key: string): string | null => {
    if (!(key in edits)) return null;
    const v = edits[key].trim();
    if (key.endsWith(':name')) return v ? null : 'Title is required';
    if (key.endsWith(':price')) return v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0 ? null : 'Enter a price of 0 or more';
    if (key.endsWith(':compare')) return v === '' || (Number.isFinite(Number(v)) && Number(v) >= 0) ? null : 'Enter 0 or more';
    if (key.endsWith(':stock')) return v !== '' && /^\d+$/.test(v) ? null : 'Enter a whole number, 0 or more';
    if (/:(len|wid|hei)$/.test(key)) return v === '' || (Number.isFinite(Number(v)) && Number(v) >= 0) ? null : 'Enter 0 or more (cm)';
    if (key.endsWith(':origin')) return v === '' || /^[A-Za-z]{2}$/.test(v) ? null : 'Use a 2-letter country code';
    if (key.endsWith(':hs')) return v === '' || /^\d[\d.]{4,12}\d$/.test(v) ? null : 'HS code: 6 to 10 digits';
    return null;
  };
  const compareWarning = (vid: string): boolean => {
    const c = val(`v:${vid}:compare`).trim(), pr = val(`v:${vid}:price`).trim();
    return c !== '' && pr !== '' && Number(c) <= Number(pr);
  };

  const changeCount = Object.keys(edits).length;
  const invalidCount = Object.keys(edits).filter(k => cellError(k)).length;

  const buildUpdates = (): BulkEditProductUpdate[] => {
    const updates: BulkEditProductUpdate[] = [];
    for (const p of rows) {
      if (p.loadError) continue;
      const u: BulkEditProductUpdate = { productId: p.id };
      let touched = false;
      if (`p:${p.id}:name` in edits)   { u.name = edits[`p:${p.id}:name`].trim(); touched = true; }
      if (`p:${p.id}:status` in edits) { u.status = edits[`p:${p.id}:status`] as BulkProductStatus; touched = true; }
      if (`p:${p.id}:tags` in edits)   { u.tags = parseTags(edits[`p:${p.id}:tags`]); touched = true; }
      const vs: BulkEditVariantUpdate[] = [];
      for (const v of p.variants) {
        const vu: BulkEditVariantUpdate = { variantId: v.id };
        let vt = false;
        if (`v:${v.id}:sku` in edits)     { vu.sku = edits[`v:${v.id}:sku`].trim(); vt = true; }
        if (`v:${v.id}:price` in edits)   { vu.price = Number(edits[`v:${v.id}:price`]); vt = true; }
        if (`v:${v.id}:compare` in edits) { const c = edits[`v:${v.id}:compare`].trim(); vu.compareAtPrice = c === '' ? null : Number(c); vt = true; }
        if (`v:${v.id}:stock` in edits)   { vu.stock = Number(edits[`v:${v.id}:stock`]); vt = true; }
        for (const [f, field] of [['len', 'length'], ['wid', 'width'], ['hei', 'height']] as const) {
          if (`v:${v.id}:${f}` in edits) { const x = edits[`v:${v.id}:${f}`].trim(); vu[field] = x === '' ? null : Number(x); vt = true; }
        }
        if (`v:${v.id}:origin` in edits) { vu.countryOfOrigin = edits[`v:${v.id}:origin`].trim().toUpperCase(); vt = true; }
        if (`v:${v.id}:hs` in edits)     { vu.hsCode = edits[`v:${v.id}:hs`].trim(); vt = true; }
        if (`v:${v.id}:taxable` in edits) { vu.taxable = edits[`v:${v.id}:taxable`] !== 'no'; vt = true; }
        if (vt) vs.push(vu);
      }
      if (vs.length) { u.variants = vs; touched = true; }
      if (touched) updates.push(u);
    }
    return updates;
  };

  const handleSave = async () => {
    if (invalidCount > 0 || changeCount === 0) return;
    const updates = buildUpdates();
    setSaving(true); setSaveError(''); setRowErrors({});
    const okIds = new Set<string>();
    const errs: Record<string, string> = {};
    let requestFailed = false;
    try {
      for (let i = 0; i < updates.length; i += BULK_EDIT_MAX_PRODUCTS) {
        const chunk = updates.slice(i, i + BULK_EDIT_MAX_PRODUCTS);
        const res = await apiBulkEditProducts(storeId, chunk);
        for (const r of res.data.results) {
          if (r.ok) okIds.add(r.productId); else errs[r.productId] = r.error || 'Failed to save.';
        }
      }
    } catch (e) {
      requestFailed = true;
      setSaveError(e instanceof Error ? e.message : 'Failed to save changes.');
    }
    // Fold the saved products' edits into the base rows; keep failed edits in place.
    if (okIds.size > 0) {
      savedAny.current = true;
      setRows(prev => prev.map(p => {
        if (!okIds.has(p.id)) return p;
        const g = (k: string, d: string) => (k in edits ? edits[k] : d);
        return {
          ...p,
          name: g(`p:${p.id}:name`, p.name).trim(), status: g(`p:${p.id}:status`, p.status), tags: g(`p:${p.id}:tags`, p.tags),
          variants: p.variants.map(v => ({
            ...v,
            sku: g(`v:${v.id}:sku`, v.sku), price: g(`v:${v.id}:price`, v.price),
            compare: g(`v:${v.id}:compare`, v.compare), stock: g(`v:${v.id}:stock`, v.stock),
            len: g(`v:${v.id}:len`, v.len), wid: g(`v:${v.id}:wid`, v.wid), hei: g(`v:${v.id}:hei`, v.hei),
            origin: g(`v:${v.id}:origin`, v.origin), hs: g(`v:${v.id}:hs`, v.hs), taxable: g(`v:${v.id}:taxable`, v.taxable),
          })),
        };
      }));
      setEdits(prev => {
        const next = { ...prev };
        for (const p of rows) {
          if (!okIds.has(p.id)) continue;
          for (const k of Object.keys(next)) {
            if (k.startsWith(`p:${p.id}:`) || p.variants.some(v => k.startsWith(`v:${v.id}:`))) delete next[k];
          }
        }
        return next;
      });
      toast.success(`${okIds.size} product${okIds.size === 1 ? '' : 's'} updated`);
    }
    setRowErrors(errs);
    const failed = Object.keys(errs).length;
    if (failed > 0) setSaveError(`${failed} product${failed === 1 ? '' : 's'} could not be saved. Fix the highlighted rows and save again.`);
    setSaving(false);
    if (okIds.size > 0 && failed === 0 && !requestFailed) { onSaved(); onClose(); }
  };

  const requestClose = () => {
    if (saving) return;
    if (changeCount > 0) { setConfirmDiscard(true); return; }
    if (savedAny.current) onSaved();
    onClose();
  };
  const discard = () => { setConfirmDiscard(false); if (savedAny.current) onSaved(); onClose(); };

  const cls = (key: string) => `${INPUT}${key in edits ? ' bg-brand-pale-orange/40 border-brand-orange' : ''}${cellError(key) ? ' border-error' : ''}`;
  const TH = 'text-left text-[11px] font-semibold text-slate uppercase tracking-[0.05em] px-2 py-2 whitespace-nowrap';

  return (
    <>
      <Modal
        title="Edit products"
        width={1180}
        onClose={requestClose}
        footer={
          <>
            <span className="mr-auto text-[12px] text-slate" aria-live="polite">
              {changeCount} change{changeCount === 1 ? '' : 's'}{invalidCount > 0 ? ` · ${invalidCount} invalid` : ''}
            </span>
            <Button variant="ghost" onClick={requestClose} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={() => { void handleSave(); }} loading={saving} disabled={changeCount === 0 || invalidCount > 0}>
              Save
            </Button>
          </>
        }
      >
        {limited && (
          <p className="text-[12px] text-slate bg-cream border border-bone rounded-lg px-3 py-2 mb-3">
            Edit up to {BULK_EDIT_MAX_PRODUCTS} products at a time. Showing the first {BULK_EDIT_MAX_PRODUCTS} matching products.
          </p>
        )}
        {saveError && (
          <p className="flex items-center gap-1.5 text-[12px] text-error mb-3" role="alert">
            <AlertCircle size={13} className="shrink-0" /> {saveError}
          </p>
        )}
        {loadFailed ? (
          <p className="text-[13px] text-error" role="alert">{loadFailed}</p>
        ) : loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonBox key={i} height={32} rounded="6px" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]" style={{ minWidth: 1500 }}>
              <thead>
                <tr className="border-b border-bone bg-cream">
                  <th className={TH} style={{ width: '24%' }}>Title</th>
                  <th className={TH} style={{ width: 110 }}>Status</th>
                  <th className={TH} style={{ width: '16%' }}>Tags</th>
                  <th className={TH} style={{ width: '12%' }}>SKU</th>
                  <th className={TH} style={{ width: 90 }}>Price ({currencyLabel})</th>
                  <th className={TH} style={{ width: 100 }}>Compare-at ({currencyLabel})</th>
                  <th className={TH} style={{ width: 90 }}>Inventory</th>
                  <th className={TH} style={{ width: 70 }}>L (cm)</th>
                  <th className={TH} style={{ width: 70 }}>W (cm)</th>
                  <th className={TH} style={{ width: 70 }}>H (cm)</th>
                  <th className={TH} style={{ width: 70 }}>Origin</th>
                  <th className={TH} style={{ width: 100 }}>HS code</th>
                  <th className={TH} style={{ width: 60 }}>Taxable</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(p => {
                  const single = p.variants.length === 1;
                  const err = p.loadError || rowErrors[p.id];
                  const nameKey = `p:${p.id}:name`, statusKey = `p:${p.id}:status`, tagsKey = `p:${p.id}:tags`;
                  const renderVariantCells = (v: VariantRow) => {
                    const k = (f: string) => `v:${v.id}:${f}`;
                    return (
                      <>
                        <td className="px-2 py-1.5"><input className={cls(k('sku'))} value={val(k('sku'))} onChange={e => setCell(k('sku'), e.target.value)} aria-label="SKU" /></td>
                        <td className="px-2 py-1.5">
                          <input className={cls(k('price'))} inputMode="decimal" value={val(k('price'))} disabled={!canEditPrice}
                            onChange={e => setCell(k('price'), e.target.value)} aria-label="Price" title={cellError(k('price')) ?? undefined} />
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-1">
                            <input className={cls(k('compare'))} inputMode="decimal" value={val(k('compare'))} disabled={!canEditPrice}
                              onChange={e => setCell(k('compare'), e.target.value)} aria-label="Compare-at price" title={cellError(k('compare')) ?? undefined} />
                            {compareWarning(v.id) && <AlertTriangle size={13} className="text-warning shrink-0" aria-label="Compare-at should be higher than price" />}
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <input className={cls(k('stock'))} inputMode="numeric"
                            value={p.digital || v.unlimited ? '' : val(k('stock'))}
                            placeholder={p.digital ? 'N/A' : v.unlimited ? 'Unlimited' : ''}
                            disabled={p.digital || v.unlimited}
                            onChange={e => setCell(k('stock'), e.target.value)} aria-label="Inventory" title={cellError(k('stock')) ?? undefined} />
                        </td>
                        {(['len', 'wid', 'hei', 'origin', 'hs'] as const).map(f => (
                          <td key={f} className="px-2 py-1.5">
                            <input className={cls(k(f))} inputMode={f === 'origin' ? 'text' : 'decimal'} maxLength={f === 'origin' ? 2 : 14}
                              value={p.digital ? '' : val(k(f))} disabled={p.digital} placeholder={p.digital ? 'N/A' : ''}
                              onChange={e => setCell(k(f), e.target.value)} aria-label={f === 'hs' ? 'HS code' : f === 'origin' ? 'Country of origin' : 'Package dimension (cm)'} title={cellError(k(f)) ?? undefined} />
                          </td>
                        ))}
                        <td className="px-2 py-1.5 text-center">
                          <input type="checkbox" checked={val(k('taxable')) !== 'no'} onChange={e => setCell(k('taxable'), e.target.checked ? 'yes' : 'no')} aria-label="Charge tax on this product" />
                        </td>
                      </>
                    );
                  };
                  return (
                    <Fragment key={p.id}>
                      <tr className={`border-b border-[#f0eee6] ${err ? 'bg-error-bg' : ''}`}>
                        <td className="px-2 py-1.5">
                          <input className={cls(nameKey)} value={val(nameKey)} disabled={!!p.loadError}
                            onChange={e => setCell(nameKey, e.target.value)} aria-label="Title" title={cellError(nameKey) ?? undefined} />
                          {err && <p className="text-[11px] text-error mt-1" role="alert">{err}</p>}
                        </td>
                        <td className="px-2 py-1.5">
                          <select className={cls(statusKey)} value={val(statusKey)} disabled={!!p.loadError}
                            onChange={e => setCell(statusKey, e.target.value)} aria-label="Status">
                            <option value="active">Active</option>
                            <option value="draft">Draft</option>
                            <option value="inactive">Archived</option>
                            {p.status === 'scheduled' && <option value="scheduled" disabled>Scheduled</option>}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <input className={cls(tagsKey)} value={val(tagsKey)} disabled={!!p.loadError} placeholder="tag, tag"
                            onChange={e => setCell(tagsKey, e.target.value)} aria-label="Tags" />
                        </td>
                        {single ? renderVariantCells(p.variants[0]) : <td colSpan={10} className="px-2 py-1.5 text-slate">{p.loadError ? '' : `${p.variants.length} variants`}</td>}
                      </tr>
                      {!single && p.variants.map(v => (
                        <tr key={v.id} className="border-b border-[#f0eee6]">
                          <td className="pl-8 pr-2 py-1.5 text-slate">{v.label}</td>
                          <td /><td />
                          {renderVariantCells(v)}
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {confirmDiscard && (
        <Modal
          title="Discard changes?"
          onClose={() => setConfirmDiscard(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmDiscard(false)}>Keep editing</Button>
              <Button variant="danger" onClick={discard}>Discard changes</Button>
            </>
          }
        >
          <p className="text-[13px] text-slate">You have {changeCount} unsaved change{changeCount === 1 ? '' : 's'}. If you leave now they will be lost.</p>
        </Modal>
      )}
    </>
  );
}
