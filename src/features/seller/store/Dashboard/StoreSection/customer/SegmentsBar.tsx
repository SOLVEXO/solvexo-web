import { EntityPickerField } from '@/features/seller/store/Dashboard/OnlineStore/builder/SchemaForm';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Download, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, Field, Input, Modal, Select } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';
import {
  apiCreateSegment, apiDeleteSegment, apiDuplicateSegment, apiExportSegment, apiListSegments, apiPreviewSegment, apiSegmentCount, apiUpdateSegment,
  type CustomerSegment, type SegmentCondition, type SegmentFieldKey, type SegmentFilter,
} from '@/api/services/customerSegments';

const msg = (e: unknown, f: string) => (e instanceof Error ? e.message : f);

type Kind = 'number' | 'date' | 'set' | 'text' | 'enum';
const NUM_OPS = ['gt', 'gte', 'lt', 'lte', 'eq', 'neq', 'between'];
const SET_OPS = ['has_any', 'has_all', 'has_none'];
const TEXT_OPS = ['equals', 'not_equals', 'in'];
const DATE_OPS = ['within_last_days', 'not_within_last_days', 'before', 'after', 'between', 'never'];
const FIELDS: Record<string, { kind: Kind; ops: string[]; enums?: string[] }> = {
  amount_spent: { kind: 'number', ops: NUM_OPS },
  order_count: { kind: 'number', ops: NUM_OPS },
  average_order_value: { kind: 'number', ops: NUM_OPS },
  store_credit_balance: { kind: 'number', ops: NUM_OPS },
  last_order_date: { kind: 'date', ops: DATE_OPS },
  first_order_date: { kind: 'date', ops: DATE_OPS },
  tags: { kind: 'set', ops: SET_OPS },
  country: { kind: 'text', ops: TEXT_OPS },
  city: { kind: 'text', ops: TEXT_OPS },
  loyalty_tier: { kind: 'text', ops: TEXT_OPS },
  product_purchased: { kind: 'set', ops: SET_OPS },
  marketing_status: { kind: 'enum', ops: TEXT_OPS, enums: ['subscribed', 'pending', 'unsubscribed', 'not_subscribed'] },
  account_status: { kind: 'enum', ops: TEXT_OPS, enums: ['account', 'guest', 'blocked'] },
};
const FIELD_KEYS = Object.keys(FIELDS) as SegmentFieldKey[];

/** Editable row: values live as strings so inputs stay controlled; converted on save/preview. */
interface Row { field: SegmentFieldKey; op: string; v1: string; v2: string }
const blankRow = (): Row => ({ field: 'amount_spent', op: 'gt', v1: '', v2: '' });

function rowToCondition(r: Row): SegmentCondition | null {
  const def = FIELDS[r.field];
  const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
  if (def.kind === 'number') {
    if (r.op === 'between') return r.v1 !== '' && r.v2 !== '' ? { field: r.field, op: r.op, value: [Number(r.v1), Number(r.v2)] } : null;
    return r.v1 !== '' ? { field: r.field, op: r.op, value: Number(r.v1) } : null;
  }
  if (def.kind === 'date') {
    if (r.op === 'never') return { field: r.field, op: r.op };
    if (r.op === 'within_last_days' || r.op === 'not_within_last_days') return r.v1 !== '' ? { field: r.field, op: r.op, value: Number(r.v1) } : null;
    if (r.op === 'between') return r.v1 && r.v2 ? { field: r.field, op: r.op, value: [r.v1, r.v2] } : null;
    return r.v1 ? { field: r.field, op: r.op, value: r.v1 } : null;
  }
  if (def.kind === 'set' || r.op === 'in') return list(r.v1).length ? { field: r.field, op: r.op, value: list(r.v1) } : null;
  return r.v1.trim() ? { field: r.field, op: r.op, value: r.v1.trim() } : null;
}

function filterToRows(f: SegmentFilter): Row[] {
  return f.conditions.map((c) => {
    const v = c.value;
    return { field: c.field, op: c.op, v1: Array.isArray(v) ? (FIELDS[c.field]?.kind === 'set' || c.op === 'in' ? v.join(', ') : String(v[0])) : v === undefined ? '' : String(v), v2: Array.isArray(v) && c.op === 'between' ? String(v[1]) : '' };
  });
}

function ValueInputs({ row, onChange, disabled, storeId }: { row: Row; onChange: (r: Row) => void; disabled: boolean; storeId: string }) {
  const { t } = useTranslation();
  const def = FIELDS[row.field];
  if (row.field === 'product_purchased') {
    return <EntityPickerField mode="products" multiple value={row.v1.split(',').map((x) => x.trim()).filter(Boolean)} storeId={storeId} label={t('segments.fields.product_purchased')} onPick={(ids: string[]) => onChange({ ...row, v1: ids.slice(0, 25).join(', ') })} />;
  }
  if (def.kind === 'date' && row.op === 'never') return null;
  const type = def.kind === 'number' || row.op === 'within_last_days' || row.op === 'not_within_last_days' ? 'number' : def.kind === 'date' ? 'date' : 'text';
  if (def.kind === 'enum' && row.op !== 'in') {
    return (
      <Select value={row.v1} onChange={(e) => onChange({ ...row, v1: e.target.value })} disabled={disabled} aria-label={t('segments.value')}>
        <option value="">—</option>
        {def.enums!.map((e) => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
      </Select>
    );
  }
  return (
    <div className="flex gap-2">
      <Input type={type} value={row.v1} onChange={(e) => onChange({ ...row, v1: e.target.value })} disabled={disabled} aria-label={t('segments.value')}
        placeholder={def.kind === 'set' || row.op === 'in' ? 'a, b, c' : ''} />
      {row.op === 'between' && <Input type={type} value={row.v2} onChange={(e) => onChange({ ...row, v2: e.target.value })} disabled={disabled} aria-label={t('segments.value')} />}
    </div>
  );
}

function SegmentBuilderModal({ storeId, segment, onClose, onSaved }: { storeId: string; segment: CustomerSegment | null; onClose: () => void; onSaved: (s: CustomerSegment) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState(segment?.name ?? '');
  const [combinator, setCombinator] = useState<'and' | 'or'>(segment?.filter.combinator ?? 'and');
  const [rows, setRows] = useState<Row[]>(segment ? filterToRows(segment.filter) : [blankRow()]);
  const [count, setCount] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const conditions = rows.map(rowToCondition).filter((c): c is SegmentCondition => !!c);
  const key = JSON.stringify([combinator, conditions]);
  const seq = useRef(0);

  // Debounced live count of the filter as it is being built.
  useEffect(() => {
    if (conditions.length === 0) return;
    const mine = ++seq.current;
    const timer = setTimeout(() => {
      setPreviewing(true);
      apiPreviewSegment(storeId, { combinator, conditions })
        .then((r) => { if (mine === seq.current) { setCount(r.data.count); setError(''); } })
        .catch((e) => { if (mine === seq.current) { setCount(null); setError(msg(e, '')); } })
        .finally(() => { if (mine === seq.current) setPreviewing(false); });
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, storeId]);

  const save = async () => {
    if (saving) return;
    setSaving(true); setError('');
    try {
      const filter: SegmentFilter = { combinator, conditions };
      const res = segment ? await apiUpdateSegment(storeId, segment.id, { name, filter }) : await apiCreateSegment(storeId, { name, filter });
      onSaved(res.data);
    } catch (e) { setError(msg(e, 'Could not save')); } finally { setSaving(false); }
  };

  const setRow = (i: number, r: Row) => setRows((rs) => rs.map((x, j) => (j === i ? r : x)));

  return (
    <Modal
      title={segment ? t('segments.edit') : t('segments.create')} width={640} mobileSheet onClose={() => { if (!saving) onClose(); }}
      footer={<><Button variant="outline" size="sm" onClick={onClose} disabled={saving}>{t('segments.cancel')}</Button><Button size="sm" onClick={() => void save()} loading={saving} disabled={!name.trim() || conditions.length === 0}>{t('segments.save')}</Button></>}
    >
      <div className="flex flex-col gap-3">
        <Field label={t('segments.name')} required><Input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} disabled={saving} /></Field>
        <div className="flex items-center gap-2 text-[12.5px] text-slate">
          {t('segments.match')}
          <Select value={combinator} onChange={(e) => setCombinator(e.target.value as 'and' | 'or')} disabled={saving} aria-label={t('segments.match')}>
            <option value="and">{t('segments.all')}</option><option value="or">{t('segments.any')}</option>
          </Select>
          {t('segments.conditions')}
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr_1.4fr_auto] gap-2 items-start">
            <Select value={r.field} onChange={(e) => { const f = e.target.value as SegmentFieldKey; setRow(i, { field: f, op: FIELDS[f].ops[0], v1: '', v2: '' }); }} disabled={saving} aria-label={t('segments.field')}>
              {FIELD_KEYS.map((f) => <option key={f} value={f}>{t(`segments.fields.${f}`)}</option>)}
            </Select>
            <Select value={r.op} onChange={(e) => setRow(i, { ...r, op: e.target.value, v1: '', v2: '' })} disabled={saving} aria-label={t('segments.operator')}>
              {FIELDS[r.field].ops.map((o) => <option key={o} value={o}>{t(`segments.ops.${o}`)}</option>)}
            </Select>
            <ValueInputs row={r} onChange={(nr) => setRow(i, nr)} disabled={saving} storeId={storeId} />
            <button type="button" className="text-slate hover:text-error p-2 cursor-pointer" aria-label={t('segments.remove')} disabled={rows.length === 1 || saving} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
          </div>
        ))}
        <div><Button variant="outline" size="sm" onClick={() => setRows((rs) => [...rs, blankRow()])} disabled={rows.length >= 10 || saving}><Plus size={13} /> {t('segments.addCondition')}</Button></div>
        <p className="text-[13px] font-semibold text-charcoal" role="status" aria-live="polite">
          {conditions.length === 0 ? t('segments.fillIn') : previewing ? '…' : count === null ? '' : t('segments.matching', { count })}
        </p>
        {error && <p className="text-[12.5px] text-error" role="alert">{error}</p>}
      </div>
    </Modal>
  );
}

/** Customers page: saved segments as chips + builder, count, edit/duplicate/export/delete. `onSelect(null)` = all customers. */
export function SegmentsBar({ storeId, activeId, canEdit, canExport, onSelect }: { storeId: string; activeId: string | null; canEdit: boolean; canExport: boolean; onSelect: (id: string | null) => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [segments, setSegments] = useState<CustomerSegment[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [builder, setBuilder] = useState<null | { segment: CustomerSegment | null }>(null);
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => apiListSegments(storeId).then((r) => { setSegments(r.data.segments); setLoadError(''); }).catch((e) => { setLoadError(msg(e, 'Could not load segments')); setSegments([]); }), [storeId]);
  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    apiSegmentCount(storeId, activeId).then((r) => { if (!cancelled) setCount(r.data.count); }).catch(() => { if (!cancelled) setCount(null); });
    return () => { cancelled = true; };
  }, [storeId, activeId]);

  const active = segments?.find((s) => s.id === activeId) ?? null;
  const run = async (fn: () => Promise<void>) => { if (busy) return; setBusy(true); try { await fn(); } catch (e) { toast.error(msg(e, 'Failed')); } finally { setBusy(false); } };

  return (
    <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-bone">
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label={t('segments.title')}>
        <button type="button" role="tab" aria-selected={!activeId} onClick={() => onSelect(null)} className={`text-[12.5px] px-3 py-1.5 rounded-full border cursor-pointer ${!activeId ? 'bg-brand-pale-orange border-brand-orange text-brand-deep-orange' : 'border-bone text-slate'}`}>{t('segments.all_customers')}</button>
        {segments === null && !loadError && <span className="text-[12px] text-slate">…</span>}
        {segments?.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={s.id === activeId} onClick={() => onSelect(s.id)} className={`text-[12.5px] px-3 py-1.5 rounded-full border cursor-pointer ${s.id === activeId ? 'bg-brand-pale-orange border-brand-orange text-brand-deep-orange' : 'border-bone text-slate'}`}>{s.name}</button>
        ))}
        {canEdit && <Button size="sm" variant="outline" onClick={() => setBuilder({ segment: null })}><Plus size={13} /> {t('segments.create')}</Button>}
      </div>
      {loadError && <p className="text-[12px] text-error mt-2" role="alert">{loadError} <button type="button" className="underline cursor-pointer" onClick={() => void reload()}>Retry</button></p>}
      {segments && segments.length === 0 && !loadError && <p className="text-[12px] text-slate mt-2">{t('segments.empty')}</p>}
      {active && (
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-[12.5px] text-charcoal font-semibold">{count === null ? '…' : t('segments.members', { count })}</span>
          {canEdit && <Button size="sm" variant="outline" onClick={() => setBuilder({ segment: active })} disabled={busy}><Pencil size={13} /> {t('segments.edit')}</Button>}
          {canEdit && <Button size="sm" variant="outline" onClick={() => void run(async () => { const r = await apiDuplicateSegment(storeId, active.id); await reload(); onSelect(r.data.id); })} disabled={busy}><Copy size={13} /> {t('segments.duplicate')}</Button>}
          {canExport && <Button size="sm" variant="outline" onClick={() => void run(() => apiExportSegment(storeId, active.id, `segment-${active.name}.csv`))} disabled={busy}><Download size={13} /> {t('segments.export')}</Button>}
          {canEdit && <Button size="sm" variant="outline" onClick={() => void run(async () => { if (!window.confirm(t('segments.confirmDelete'))) return; await apiDeleteSegment(storeId, active.id); onSelect(null); await reload(); })} disabled={busy}><Trash2 size={13} /> {t('segments.delete')}</Button>}
        </div>
      )}
      {builder && <SegmentBuilderModal storeId={storeId} segment={builder.segment} onClose={() => setBuilder(null)} onSaved={(s) => { setBuilder(null); toast.success(t('segments.saved')); void reload(); onSelect(s.id); }} />}
    </div>
  );
}
