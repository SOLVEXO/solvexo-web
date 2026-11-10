import { useCallback, useEffect, useState } from 'react';
import { ListChecks, Plus } from 'lucide-react';
import { StorePageHeader, useStoreWorkspace, hasNavPermission } from '@/components/layouts/StoreLayout';
import { SkeletonBox, EmptyState, Badge, Input } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { TabBar, type Tab } from '@/components/comman/ui/TabBar';
import { EntityPickerModal } from '@/features/seller/store/Dashboard/OnlineStore/builder/EntityPickerModal';
import { useToast } from '@/contexts/ToastContext';
import { TokenStorage } from '@/api/services/auth';
import { apiListStoreShippingZones, type ShippingZone } from '@/api/services/shipping';
import type { BadgeColor } from '@/types';
import {
  FIELD_LABEL, OPS_BY_KIND, apiCreateCheckoutRule, apiDeleteCheckoutRule, apiListCheckoutRules, apiTestCheckoutRules, apiUpdateCheckoutRule,
  type CheckoutRuleRow, type RuleCondition, type RuleFieldInfo, type RuleTestResult, type RuleType,
} from '@/api/services/checkoutRules';
import CheckoutBrandingCard from './CheckoutBrandingCard';

const TABS: Tab[] = [{ id: 'rules', label: 'Rules' }, { id: 'test', label: 'Test a cart' }, { id: 'branding', label: 'Checkout branding' }];
const TYPE_LABEL: Record<RuleType, string> = { discount: 'Discount', payment: 'Payment methods', shipping: 'Delivery options', validation: 'Order limits' };
const TYPE_COLOR: Record<RuleType, BadgeColor> = { discount: 'green', payment: 'blue', shipping: 'orange', validation: 'red' };
const METHODS = [['stripe', 'Card'], ['cash_on_delivery', 'Cash on delivery'], ['manual_bank_transfer', 'Bank transfer'], ['b2b_terms', 'Wholesale terms'], ['manual', 'Your custom methods'], ['split', 'Pay digital now, rest on delivery']] as const;
type ActionShape = { kind?: 'percent' | 'fixed'; value?: number; appliesTo?: 'order' | 'products'; productIds?: string[]; exclusive?: boolean; label?: string; mode?: string; methods?: string[]; zoneIds?: string[]; zoneType?: string | null; newName?: string; message?: string };
const errText = (e: unknown, f: string) => (e instanceof Error && e.message ? e.message : f);

type CondRow = { field: string; op: string; value: string };
type Form = {
  name: string; type: RuleType; status: 'active' | 'draft'; priority: string; conditions: CondRow[];
  kind: 'percent' | 'fixed'; amount: string; appliesTo: 'order' | 'products'; productIds: string[]; exclusive: boolean; label: string;
  payMode: 'hide' | 'show_only'; methods: string[];
  shipMode: 'hide' | 'rename' | 'reorder'; zoneIds: string[]; zoneType: string; newName: string;
  message: string;
};
const EMPTY: Form = { name: '', type: 'validation', status: 'draft', priority: '100', conditions: [], kind: 'percent', amount: '10', appliesTo: 'order', productIds: [], exclusive: true, label: 'Discount', payMode: 'hide', methods: [], shipMode: 'hide', zoneIds: [], zoneType: '', newName: '', message: '' };

const toForm = (r: CheckoutRuleRow): Form => {
  const a = r.action as ActionShape;
  return {
    ...EMPTY, name: r.name, type: r.type, status: r.status, priority: String(r.priority),
    conditions: r.conditions.map((c) => ({ field: c.field, op: c.op, value: Array.isArray(c.value) ? c.value.join(', ') : String(c.value) })),
    kind: a.kind ?? 'percent', amount: String(a.value ?? 10), appliesTo: a.appliesTo ?? 'order', productIds: a.productIds ?? [], exclusive: a.exclusive !== false, label: a.label ?? 'Discount',
    payMode: a.mode === 'show_only' ? 'show_only' : 'hide', methods: r.type === 'payment' ? a.methods ?? [] : [],
    shipMode: r.type === 'shipping' ? ((a.mode as Form['shipMode'] | undefined) ?? 'hide') : 'hide', zoneIds: a.zoneIds ?? [], zoneType: a.zoneType ?? '', newName: a.newName ?? '', message: a.message ?? '',
  };
};

/** Turns the typed rows into the clean JSON the server validates (values by field kind). */
function buildRuleBody(f: Form, fields: RuleFieldInfo[]) {
  const kindOf = (field: string) => fields.find((x) => x.field === field)?.kind ?? 'string';
  const conditions: RuleCondition[] = f.conditions.map((c) => {
    const k = kindOf(c.field);
    const list = c.op === 'in' || c.op === 'not_in' || c.op === 'contains_any';
    const value = k === 'number' ? Number(c.value) : k === 'boolean' ? c.value === 'true' : list ? c.value.split(',').map((s) => s.trim()).filter(Boolean) : c.value.trim();
    return { field: c.field, op: c.op, value };
  });
  const action: Record<string, unknown> =
    f.type === 'discount' ? { kind: f.kind, value: Number(f.amount), appliesTo: f.appliesTo, productIds: f.appliesTo === 'products' ? f.productIds : [], exclusive: f.exclusive, label: f.label }
      : f.type === 'payment' ? { mode: f.payMode, methods: f.methods }
        : f.type === 'shipping' ? { mode: f.shipMode, zoneIds: f.zoneIds, zoneType: f.zoneType || null, newName: f.shipMode === 'rename' ? f.newName : undefined }
          : { message: f.message };
  return { name: f.name.trim(), type: f.type, status: f.status, priority: Number(f.priority), conditions, action };
}

const summary = (r: CheckoutRuleRow) => {
  const a = r.action as ActionShape;
  if (r.type === 'discount') return `${a.kind === 'percent' ? `${a.value}%` : a.value} off ${a.appliesTo === 'products' ? 'chosen products' : 'the order'}`;
  if (r.type === 'payment') return `${a.mode === 'hide' ? 'Hide' : 'Only show'}: ${(a.methods ?? []).join(', ')}`;
  if (r.type === 'shipping') return `${a.mode === 'hide' ? 'Hide' : a.mode === 'rename' ? `Rename to "${a.newName}"` : 'Move to top'} ${a.zoneType ? `(${a.zoneType})` : `${(a.zoneIds ?? []).length} option(s)`}`;
  return `Block checkout: "${a.message}"`;
};

export default function CheckoutRulesHub() {
  const { storeId, store } = useStoreWorkspace();
  const toast = useToast();
  const user = TokenStorage.getUser<{ role?: 'admin' | 'seller' | 'staff' | 'user'; permissions?: string[] }>();
  const canManage = hasNavPermission(user as never, ['checkout_rules.manage']);
  const [tab, setTab] = useState('rules');
  const [rules, setRules] = useState<CheckoutRuleRow[]>([]);
  const [fields, setFields] = useState<RuleFieldInfo[]>([]);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<CheckoutRuleRow | 'new' | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<CheckoutRuleRow | null>(null);
  const [busy, setBusy] = useState('');

  const load = useCallback(() => {
    if (!storeId) return;
    setLoading(true); setError('');
    Promise.all([apiListCheckoutRules(storeId), apiListStoreShippingZones(storeId).catch(() => ({ data: [] as ShippingZone[] }))])
      .then(([r, z]) => { setRules(r.rules); setFields(r.fields); setZones(z.data ?? []); })
      .catch((e: unknown) => setError(errText(e, 'Could not load checkout rules.')))
      .finally(() => setLoading(false));
  }, [storeId]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const open = (r: CheckoutRuleRow | 'new') => { setFormError(''); setEditing(r); setForm(r === 'new' ? EMPTY : toForm(r)); };
  const save = async () => {
    setSaving(true); setFormError('');
    try {
      const body = buildRuleBody(form, fields);
      if (editing === 'new') await apiCreateCheckoutRule(storeId, body); else if (editing) await apiUpdateCheckoutRule(storeId, editing._id, { ...body, type: undefined });
      setEditing(null); toast.success('Rule saved'); load();
    } catch (e: unknown) { setFormError(errText(e, 'Could not save the rule.')); } finally { setSaving(false); }
  };
  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    try { await fn(); toast.success(ok); load(); } catch (e: unknown) { toast.error(errText(e, 'That did not work.')); } finally { setBusy(''); }
  };
  const usableFields = fields.filter((f) => form.type !== 'discount' || !f.needsAddress);
  const setCond = (i: number, p: Partial<CondRow>) => setForm((f) => ({ ...f, conditions: f.conditions.map((c, k) => (k === i ? { ...c, ...p } : c)) }));
  const kindOf = (field: string) => fields.find((x) => x.field === field)?.kind ?? 'string';
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <>
      <StorePageHeader title="Checkout rules" subtitle="Your own rules for discounts, payment methods, delivery options and order limits. They run on the server at checkout."
        actions={canManage && tab === 'rules' ? <Button size="sm" icon={<Plus size={14} />} onClick={() => open('new')}>New rule</Button> : undefined} />
      <div className="px-4 lg:px-7 pt-5 pb-10 w-full flex flex-col gap-5">
        <TabBar tabs={TABS} active={tab} onChange={setTab} />
        {error ? <EmptyState icon={<ListChecks size={22} />} title="Could not load" description={error} action={{ label: 'Retry', onClick: load }} /> : tab === 'rules' ? (
          loading && !rules.length ? <SkeletonBox className="h-24 w-full" /> : rules.length === 0 ? (
            <EmptyState icon={<ListChecks size={22} />} title="No rules yet" description="Example: hide cash on delivery above a cart total, or block more than 5 of one item." />
          ) : (
            <ul className="flex flex-col gap-2 list-none p-0 m-0">
              {rules.map((r) => (
                <li key={r._id} className="rounded-xl border border-border-soft bg-white p-3 flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[13.5px] text-charcoal">{r.name}</span>
                    <Badge color={TYPE_COLOR[r.type]} size="sm">{TYPE_LABEL[r.type]}</Badge>
                    <Badge color={r.status === 'active' ? 'green' : 'gray'} size="sm">{r.status === 'active' ? 'Active' : 'Draft'}</Badge>
                    <span className="text-[12px] text-slate">priority {r.priority}</span>
                  </div>
                  <p className="text-[12.5px] text-slate m-0">{summary(r)}{r.conditions.length ? ` · when ${r.conditions.map((c) => `${FIELD_LABEL[c.field] ?? c.field} ${OPS_BY_KIND[kindOf(c.field)].find((o) => o.op === c.op)?.label ?? c.op} ${Array.isArray(c.value) ? c.value.join(', ') : String(c.value)}`).join(' and ')}` : ' · always'}</p>
                  {canManage && (
                    <div className="flex gap-2 pt-0.5">
                      <Button size="sm" variant="secondary" onClick={() => open(r)}>Edit</Button>
                      <Button size="sm" variant="secondary" loading={busy === r._id} onClick={() => void run(r._id, () => apiUpdateCheckoutRule(storeId, r._id, { status: r.status === 'active' ? 'draft' : 'active' }), 'Saved')}>{r.status === 'active' ? 'Turn off' : 'Turn on'}</Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmDelete(r)}>Delete</Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )
        ) : tab === 'test' ? <TestPanel storeId={storeId} /> : <CheckoutBrandingCard storeId={storeId} initial={(store as { checkoutBranding?: { logoUrl: string | null; accentColor: string | null; footerLinks: { label: string; url: string }[] } | null } | null)?.checkoutBranding ?? null} canManage={canManage} />}
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'New checkout rule' : 'Edit rule'} onClose={() => setEditing(null)} width={640} mobileSheet
          footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save} loading={saving} disabled={!form.name.trim()}>Save</Button></div>}>
          <div className="flex flex-col gap-3">
            <Input label="Rule name" value={form.name} maxLength={80} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-[13px] text-charcoal">What it does
                <select className="h-10 rounded-lg border border-border-soft px-2" value={form.type} disabled={editing !== 'new'} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as RuleType, conditions: [] }))}>
                  {(Object.keys(TYPE_LABEL) as RuleType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                </select>
              </label>
              <Input label="Priority (lower runs first)" type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} />
            </div>
            <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
              <legend className="text-[13px] font-medium text-charcoal mb-1">When (all must be true; leave empty for always)</legend>
              {form.conditions.map((c, i) => {
                const k = kindOf(c.field);
                return (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <select aria-label="Condition field" className="h-9 rounded-lg border border-border-soft px-2 text-[13px]" value={c.field} onChange={(e) => { const nk = kindOf(e.target.value); setCond(i, { field: e.target.value, op: OPS_BY_KIND[nk][0].op, value: nk === 'boolean' ? 'true' : '' }); }}>
                      {usableFields.map((x) => <option key={x.field} value={x.field}>{FIELD_LABEL[x.field] ?? x.field}</option>)}
                    </select>
                    <select aria-label="Condition operator" className="h-9 rounded-lg border border-border-soft px-2 text-[13px]" value={c.op} onChange={(e) => setCond(i, { op: e.target.value })}>
                      {OPS_BY_KIND[k].map((o) => <option key={o.op} value={o.op}>{o.label}</option>)}
                    </select>
                    {k === 'boolean'
                      ? <select aria-label="Condition value" className="h-9 rounded-lg border border-border-soft px-2 text-[13px]" value={c.value} onChange={(e) => setCond(i, { value: e.target.value })}><option value="true">yes</option><option value="false">no</option></select>
                      : <input aria-label="Condition value" className="h-9 min-w-0 flex-1 rounded-lg border border-border-soft px-2 text-[13px]" type={k === 'number' ? 'number' : 'text'} placeholder={c.op === 'in' || c.op === 'not_in' || c.op === 'contains_any' ? 'value, value, ...' : 'value'} value={c.value} onChange={(e) => setCond(i, { value: e.target.value })} />}
                    <Button size="sm" variant="outline" onClick={() => setForm((f) => ({ ...f, conditions: f.conditions.filter((_, x) => x !== i) }))}>Remove</Button>
                  </div>
                );
              })}
              {form.conditions.length < 8 && usableFields.length > 0 && <Button size="sm" variant="secondary" className="w-fit" onClick={() => setForm((f) => ({ ...f, conditions: [...f.conditions, { field: usableFields[0].field, op: OPS_BY_KIND[usableFields[0].kind][0].op, value: usableFields[0].kind === 'boolean' ? 'true' : '' }] }))}>Add condition</Button>}
            </fieldset>
            {form.type === 'discount' && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-3">
                  <select aria-label="Discount kind" className="h-10 rounded-lg border border-border-soft px-2" value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as 'percent' | 'fixed' }))}><option value="percent">Percent off</option><option value="fixed">Amount off</option></select>
                  <Input label="Value" type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
                  <Input label="Label shown to customers" value={form.label} maxLength={60} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
                </div>
                <label className="flex items-center gap-2 text-[13px] text-charcoal"><input type="checkbox" className="accent-brand-orange" checked={form.appliesTo === 'products'} onChange={(e) => setForm((f) => ({ ...f, appliesTo: e.target.checked ? 'products' : 'order' }))} /> Only on chosen products</label>
                {form.appliesTo === 'products' && <div className="flex items-center gap-3 text-[13px]"><Button size="sm" variant="secondary" onClick={() => setPicking(true)}>Choose products</Button><span>{form.productIds.length} selected</span></div>}
                <label className="flex items-center gap-2 text-[13px] text-charcoal"><input type="checkbox" className="accent-brand-orange" checked={form.exclusive} onChange={(e) => setForm((f) => ({ ...f, exclusive: e.target.checked }))} /> Stop after this discount (no other rule discount on top)</label>
              </div>
            )}
            {form.type === 'payment' && (
              <div className="flex flex-col gap-2">
                <select aria-label="Payment mode" className="h-10 w-fit rounded-lg border border-border-soft px-2" value={form.payMode} onChange={(e) => setForm((f) => ({ ...f, payMode: e.target.value as 'hide' | 'show_only' }))}><option value="hide">Hide these methods</option><option value="show_only">Show only these methods</option></select>
                <div className="flex flex-wrap gap-3">{METHODS.map(([k, l]) => <label key={k} className="flex items-center gap-1.5 text-[13px]"><input type="checkbox" className="accent-brand-orange" checked={form.methods.includes(k)} onChange={() => setForm((f) => ({ ...f, methods: toggle(f.methods, k) }))} /> {l}</label>)}</div>
                <p className="text-[12px] text-slate m-0">A seller gateway (for example safepay) can be typed by its key too: add it in the test tool list.</p>
              </div>
            )}
            {form.type === 'shipping' && (
              <div className="flex flex-col gap-2">
                <select aria-label="Delivery mode" className="h-10 w-fit rounded-lg border border-border-soft px-2" value={form.shipMode} onChange={(e) => setForm((f) => ({ ...f, shipMode: e.target.value as Form['shipMode'] }))}><option value="hide">Hide</option><option value="rename">Rename</option><option value="reorder">Move to top</option></select>
                {form.shipMode !== 'rename' && <select aria-label="Delivery type" className="h-10 w-fit rounded-lg border border-border-soft px-2" value={form.zoneType} onChange={(e) => setForm((f) => ({ ...f, zoneType: e.target.value }))}><option value="">Chosen options only</option><option value="shipping">All shipping</option><option value="local_delivery">All local delivery</option><option value="pickup">All pickup</option></select>}
                <div className="flex flex-wrap gap-3">{zones.map((z) => <label key={z._id} className="flex items-center gap-1.5 text-[13px]"><input type="checkbox" className="accent-brand-orange" checked={form.zoneIds.includes(z._id)} onChange={() => setForm((f) => ({ ...f, zoneIds: toggle(f.zoneIds, z._id) }))} /> {z.name || z.zoneType}</label>)}</div>
                {form.shipMode === 'rename' && <Input label="New name" value={form.newName} maxLength={60} onChange={(e) => setForm((f) => ({ ...f, newName: e.target.value }))} />}
              </div>
            )}
            {form.type === 'validation' && <Input label="Message the customer sees when this blocks checkout" value={form.message} maxLength={200} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />}
            <label className="flex items-center gap-2 text-[13px] text-charcoal"><input type="checkbox" className="accent-brand-orange" checked={form.status === 'active'} onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked ? 'active' : 'draft' }))} /> Active (customers are affected)</label>
            {formError && <p role="alert" className="text-[12.5px] text-error m-0">{formError}</p>}
          </div>
        </Modal>
      )}
      <EntityPickerModal open={picking} onClose={() => setPicking(false)} mode="products" storeId={storeId} multiple initialSelectedIds={form.productIds} onConfirm={(ids) => { setForm((f) => ({ ...f, productIds: ids })); setPicking(false); }} title="Products for this discount" />
      {confirmDelete && (
        <Modal title="Delete this rule?" onClose={() => setConfirmDelete(null)} width={420} mobileSheet
          footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setConfirmDelete(null)}>Keep</Button><Button onClick={() => { const r = confirmDelete; setConfirmDelete(null); void run(r._id, () => apiDeleteCheckoutRule(storeId, r._id), 'Rule deleted'); }}>Delete</Button></div>}>
          <p className="text-[13px] text-charcoal m-0">"{confirmDelete.name}" stops applying to new checkouts.</p>
        </Modal>
      )}
    </>
  );
}

/** "What would happen for this cart?" (draft rules count too, so a rule can be checked before it goes live). */
function TestPanel({ storeId }: { storeId: string }) {
  const [qty, setQty] = useState('1');
  const [total, setTotal] = useState('100');
  const [country, setCountry] = useState('');
  const [tags, setTags] = useState('');
  const [b2b, setB2b] = useState(false);
  const [drafts, setDrafts] = useState(true);
  const [res, setRes] = useState<RuleTestResult | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true); setErr('');
    try {
      setRes(await apiTestCheckoutRules(storeId, { includeDrafts: drafts, sample: { lines: [{ productId: '', quantity: Number(qty) || 1, total: Number(total) || 0 }], country: country || null, customerTags: tags.split(',').map((s) => s.trim()).filter(Boolean), isB2B: b2b } }));
    } catch (e: unknown) { setErr(errText(e, 'Could not run the test.')); } finally { setBusy(false); }
  };
  return (
    <section aria-label="Test a cart" className="flex flex-col gap-3 max-w-[640px]">
      <p className="text-[12.5px] text-slate m-0">Type a sample cart and see which rules fire. Nothing is saved or charged.</p>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Items (one product line)" type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
        <Input label="Cart total" type="number" value={total} onChange={(e) => setTotal(e.target.value)} />
        <Input label="Delivery country (optional)" value={country} onChange={(e) => setCountry(e.target.value)} />
        <Input label="Customer tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" className="accent-brand-orange" checked={b2b} onChange={(e) => setB2b(e.target.checked)} /> Wholesale customer</label>
      <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" className="accent-brand-orange" checked={drafts} onChange={(e) => setDrafts(e.target.checked)} /> Include draft rules</label>
      <Button className="w-fit" onClick={run} loading={busy}>Run test</Button>
      {err && <p role="alert" className="text-[12.5px] text-error m-0">{err}</p>}
      {res && (
        <div role="status" className="rounded-xl border border-border-soft bg-white p-3 text-[13px] text-charcoal flex flex-col gap-1">
          <p className="m-0"><strong>Discount:</strong> {res.discount.total > 0 ? `${res.discount.total} (${res.discount.applied.map((a) => a.label).join(', ')})` : 'none'}</p>
          <p className="m-0"><strong>Blocked:</strong> {res.blocks.length ? res.blocks.map((b) => b.message).join(' / ') : 'no'}</p>
          <p className="m-0"><strong>Payment methods left:</strong> {res.paymentMethods.length ? res.paymentMethods.join(', ') : 'none (customers could not pay!)'}</p>
          <p className="m-0"><strong>Delivery options left:</strong> {res.shippingZones.length ? res.shippingZones.map((z) => z.name).join(', ') : 'none'}</p>
        </div>
      )}
    </section>
  );
}
