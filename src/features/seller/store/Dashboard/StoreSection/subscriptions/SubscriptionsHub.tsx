import { useCallback, useEffect, useState } from 'react';
import { Plus, Repeat } from 'lucide-react';
import { StorePageHeader, useStoreWorkspace, hasNavPermission } from '@/components/layouts/StoreLayout';
import { SkeletonBox, EmptyState, Badge, Input } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { TabBar, type Tab } from '@/components/comman/ui/TabBar';
import { EntityPickerModal } from '@/features/seller/store/Dashboard/OnlineStore/builder/EntityPickerModal';
import { useToast } from '@/contexts/ToastContext';
import { TokenStorage } from '@/api/services/auth';
import { formatMoney } from '@/utils/currency';
import type { BadgeColor } from '@/types';
import {
  apiContractAction, apiCreatePlanGroup, apiListContracts, apiListPlanGroups, apiPlanReport, apiUpcomingRenewals, apiUpdatePlanGroup,
  type ContractRow, type ContractStatus, type PlanGroup, type PlanReport, type PlanUnit,
} from '@/api/services/sellingPlans';

const TABS: Tab[] = [{ id: 'subscriptions', label: 'Subscriptions' }, { id: 'upcoming', label: 'Upcoming' }, { id: 'plans', label: 'Plans' }];
const STATUS_COLOR: Record<ContractStatus, BadgeColor> = { active: 'green', paused: 'yellow', cancelled: 'gray', completed: 'blue' };
const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—');
const every = (t: { unit: PlanUnit; count: number }) => `Every ${t.count === 1 ? '' : `${t.count} `}${t.unit}${t.count === 1 ? '' : 's'}`;
const errText = (e: unknown, f: string) => (e instanceof Error && e.message ? e.message : f);

type OptRow = { unit: PlanUnit; count: string; discountPercent: string };
type Form = { name: string; options: OptRow[]; trialDays: string; maxCycles: string; shippingAmount: string; taxPercent: string; productIds: string[] };
const EMPTY: Form = { name: '', options: [{ unit: 'month', count: '1', discountPercent: '10' }], trialDays: '0', maxCycles: '', shippingAmount: '0', taxPercent: '0', productIds: [] };

/** Product subscriptions (selling plans): plans, customer subscriptions, what renews next. Each renewal is an unpaid order the
 *  customer pays like any other (transfer / COD): Solvexo never charges a card for you. */
export default function SubscriptionsHub() {
  const { storeId, store } = useStoreWorkspace();
  const toast = useToast();
  const currency = store?.baseCurrency ?? 'USD';
  const user = TokenStorage.getUser<{ role?: 'admin' | 'seller' | 'staff' | 'user'; permissions?: string[] }>();
  const canManage = hasNavPermission(user as never, ['product_subscriptions.manage']);
  const [tab, setTab] = useState('subscriptions');
  const [report, setReport] = useState<PlanReport | null>(null);
  const [plans, setPlans] = useState<PlanGroup[]>([]);
  const [rows, setRows] = useState<ContractRow[]>([]);
  const [upcoming, setUpcoming] = useState<ContractRow[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<PlanGroup | 'new' | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<ContractRow | null>(null);
  const [busy, setBusy] = useState('');

  const load = useCallback(() => {
    if (!storeId) return;
    setLoading(true); setError('');
    Promise.all([apiPlanReport(storeId), apiListPlanGroups(storeId), apiListContracts(storeId, { status: status || undefined, limit: 50 }), apiUpcomingRenewals(storeId, 14)])
      .then(([r, p, c, u]) => { setReport(r); setPlans(p); setRows(c.items); setUpcoming(u); })
      .catch((e: unknown) => setError(errText(e, 'Could not load subscriptions.')))
      .finally(() => setLoading(false));
  }, [storeId, status]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const openEdit = (g: PlanGroup | 'new') => {
    setFormError(''); setEditing(g);
    setForm(g === 'new' ? EMPTY : { name: g.name, options: g.options.map((o) => ({ unit: o.unit, count: String(o.count), discountPercent: String(o.discountPercent) })), trialDays: String(g.trialDays), maxCycles: g.maxCycles == null ? '' : String(g.maxCycles), shippingAmount: String(g.shippingAmount), taxPercent: String(g.taxPercent), productIds: g.productIds });
  };
  const save = async () => {
    setSaving(true); setFormError('');
    const body = {
      name: form.name.trim(), options: form.options.map((o) => ({ unit: o.unit, count: Number(o.count), discountPercent: Number(o.discountPercent || 0) })),
      trialDays: Number(form.trialDays || 0), maxCycles: form.maxCycles.trim() === '' ? null : Number(form.maxCycles), shippingAmount: Number(form.shippingAmount || 0), taxPercent: Number(form.taxPercent || 0), productIds: form.productIds,
    };
    try {
      if (editing === 'new') await apiCreatePlanGroup(storeId, body); else if (editing) await apiUpdatePlanGroup(storeId, editing._id, body);
      setEditing(null); toast.success('Plan saved'); load();
    } catch (e: unknown) { setFormError(errText(e, 'Could not save the plan.')); } finally { setSaving(false); }
  };
  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    try { await fn(); toast.success(ok); load(); } catch (e: unknown) { toast.error(errText(e, 'That did not work.')); } finally { setBusy(''); }
  };
  const setOpt = (i: number, patch: Partial<OptRow>) => setForm((f) => ({ ...f, options: f.options.map((o, k) => (k === i ? { ...o, ...patch } : o)) }));

  const contractList = (list: ContractRow[]) => (
    <ul className="flex flex-col gap-2 list-none p-0 m-0">
      {list.map((c) => (
        <li key={c._id} className="rounded-xl border border-border-soft bg-white p-3 flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[13.5px] text-charcoal">{c.customerName || 'Customer'}</span>
            <Badge color={STATUS_COLOR[c.status]} size="sm">{c.status[0].toUpperCase() + c.status.slice(1)}</Badge>
            <span className="text-[12px] text-slate">{c.terms.name} · {every(c.terms)} · {c.terms.discountPercent}% off</span>
          </div>
          <p className="text-[12.5px] text-slate m-0">{c.items.reduce((n, i) => n + i.quantity, 0)} item(s) · {c.cyclesDone} order(s) so far · next {c.status === 'active' ? when(c.nextBillingAt) : '—'}{c.pausedReason ? ` · ${c.pausedReason}` : ''}</p>
          {canManage && (c.status === 'active' || c.status === 'paused') && (
            <div className="flex gap-2 pt-0.5">
              {c.status === 'active' && <Button size="sm" variant="secondary" loading={busy === `p${c._id}`} onClick={() => void run(`p${c._id}`, () => apiContractAction(storeId, c._id, 'pause'), 'Paused')}>Pause</Button>}
              {c.status === 'paused' && <Button size="sm" variant="secondary" loading={busy === `r${c._id}`} onClick={() => void run(`r${c._id}`, () => apiContractAction(storeId, c._id, 'resume'), 'Resumed')}>Resume</Button>}
              <Button size="sm" variant="outline" onClick={() => setConfirmCancel(c)}>Cancel subscription</Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <StorePageHeader title="Subscriptions" subtitle="Let customers subscribe & save on products. Each renewal is an unpaid order they pay like any other."
        actions={canManage ? <Button size="sm" icon={<Plus size={14} />} onClick={() => openEdit('new')}>New plan</Button> : undefined} />
      <div className="px-4 lg:px-7 pt-5 pb-10 w-full flex flex-col gap-5">
        {error ? <EmptyState icon={<Repeat size={22} />} title="Could not load" description={error} action={{ label: 'Retry', onClick: load }} /> : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[['Active', report?.active], ['Paused', report?.paused], ['Cancelled (30 days)', report?.cancelledLast30Days], ['Monthly recurring (est.)', report ? formatMoney(report.monthlyRecurring, report.currency || currency) : undefined]].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-border-soft bg-white p-4">
                  <p className="text-[12px] text-slate m-0">{label}</p>
                  <p className="text-[22px] font-semibold text-charcoal m-0">{value === undefined ? <SkeletonBox className="h-6 w-16" /> : value}</p>
                </div>
              ))}
            </div>
            <TabBar tabs={TABS} active={tab} onChange={setTab} />
            {tab === 'subscriptions' && (
              <section aria-label="Subscriptions" className="flex flex-col gap-3">
                <select aria-label="Filter by status" className="h-9 w-fit rounded-lg border border-border-soft px-2 text-[13px]" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">All statuses</option><option value="active">Active</option><option value="paused">Paused</option><option value="cancelled">Cancelled</option><option value="completed">Completed</option>
                </select>
                {loading && !rows.length ? <SkeletonBox className="h-24 w-full" /> : rows.length === 0 ? <EmptyState icon={<Repeat size={22} />} title="No subscriptions yet" description="Create a plan and add products to it. Customers then see Subscribe & save on the product page." /> : contractList(rows)}
              </section>
            )}
            {tab === 'upcoming' && (
              <section aria-label="Upcoming renewals" className="flex flex-col gap-3">
                <p className="text-[12.5px] text-slate m-0">Orders that will be placed in the next 14 days.</p>
                {loading && !upcoming.length ? <SkeletonBox className="h-24 w-full" /> : upcoming.length === 0 ? <EmptyState icon={<Repeat size={22} />} title="Nothing due soon" description="No active subscription renews in the next 14 days." /> : contractList(upcoming)}
              </section>
            )}
            {tab === 'plans' && (
              <section aria-label="Plans">
                {loading && !plans.length ? <SkeletonBox className="h-24 w-full" /> : plans.length === 0 ? <EmptyState icon={<Repeat size={22} />} title="No plans yet" description="A plan sets the delivery frequencies, the discount and the products it applies to." /> : (
                  <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,360px),1fr))]">
                    {plans.map((g) => (
                      <div key={g._id} className="rounded-2xl border border-border-soft bg-white p-4 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2"><span className="font-semibold text-[14px] text-charcoal truncate">{g.name}</span><Badge color={g.status === 'active' ? 'green' : 'gray'} size="sm">{g.status === 'active' ? 'Active' : 'Archived'}</Badge></div>
                        <p className="text-[12.5px] text-slate m-0">{g.options.map((o) => `${every(o)} (${o.discountPercent}% off)`).join(' · ')}</p>
                        <p className="text-[12px] text-slate m-0">{g.productIds.length} product(s){g.trialDays ? ` · first order after ${g.trialDays} days` : ''}{g.maxCycles ? ` · ${g.maxCycles} orders` : ''}</p>
                        {canManage && <div className="flex gap-2 pt-1"><Button size="sm" variant="secondary" onClick={() => openEdit(g)}>Edit</Button><Button size="sm" variant="outline" loading={busy === `a${g._id}`} onClick={() => void run(`a${g._id}`, () => apiUpdatePlanGroup(storeId, g._id, { status: g.status === 'active' ? 'archived' : 'active' }), 'Saved')}>{g.status === 'active' ? 'Archive' : 'Restore'}</Button></div>}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'New subscription plan' : 'Edit plan'} onClose={() => setEditing(null)} width={600} mobileSheet
          footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save} loading={saving} disabled={!form.name.trim()}>Save</Button></div>}>
          <div className="flex flex-col gap-3">
            <Input label="Plan name" value={form.name} maxLength={80} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
              <legend className="text-[13px] font-medium text-charcoal mb-1">Delivery frequencies</legend>
              {form.options.map((o, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2">
                  <label className="flex flex-col gap-1 text-[12px] text-slate">Every
                    <input aria-label="Interval count" type="number" min={1} max={12} className="h-9 w-20 rounded-lg border border-border-soft px-2 text-[13px]" value={o.count} onChange={(e) => setOpt(i, { count: e.target.value })} />
                  </label>
                  <select aria-label="Interval unit" className="h-9 rounded-lg border border-border-soft px-2 text-[13px]" value={o.unit} onChange={(e) => setOpt(i, { unit: e.target.value as PlanUnit })}><option value="week">week(s)</option><option value="month">month(s)</option></select>
                  <label className="flex flex-col gap-1 text-[12px] text-slate">Discount %
                    <input aria-label="Discount percent" type="number" min={0} max={90} className="h-9 w-24 rounded-lg border border-border-soft px-2 text-[13px]" value={o.discountPercent} onChange={(e) => setOpt(i, { discountPercent: e.target.value })} />
                  </label>
                  {form.options.length > 1 && <Button size="sm" variant="outline" onClick={() => setForm((f) => ({ ...f, options: f.options.filter((_, k) => k !== i) }))}>Remove</Button>}
                </div>
              ))}
              {form.options.length < 6 && <Button size="sm" variant="secondary" className="w-fit" onClick={() => setForm((f) => ({ ...f, options: [...f.options, { unit: 'month', count: '2', discountPercent: '5' }] }))}>Add frequency</Button>}
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Days before the first order" type="number" value={form.trialDays} onChange={(e) => setForm((f) => ({ ...f, trialDays: e.target.value }))} />
              <Input label="Stop after (orders, optional)" type="number" value={form.maxCycles} onChange={(e) => setForm((f) => ({ ...f, maxCycles: e.target.value }))} />
              <Input label="Shipping per order" type="number" value={form.shippingAmount} onChange={(e) => setForm((f) => ({ ...f, shippingAmount: e.target.value }))} />
              <Input label="Tax % added to each order" type="number" value={form.taxPercent} onChange={(e) => setForm((f) => ({ ...f, taxPercent: e.target.value }))} />
            </div>
            <div className="flex items-center gap-3 text-[13px] text-charcoal"><Button size="sm" variant="secondary" onClick={() => setPicking(true)}>Choose products</Button><span>{form.productIds.length} selected</span></div>
            {formError && <p role="alert" className="text-[12.5px] text-error m-0">{formError}</p>}
          </div>
        </Modal>
      )}
      <EntityPickerModal open={picking} onClose={() => setPicking(false)} mode="products" storeId={storeId} multiple initialSelectedIds={form.productIds} onConfirm={(ids) => { setForm((f) => ({ ...f, productIds: ids })); setPicking(false); }} title="Products on this plan" />
      {confirmCancel && (
        <Modal title="Cancel this subscription?" onClose={() => setConfirmCancel(null)} width={440} mobileSheet
          footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setConfirmCancel(null)}>Keep</Button><Button onClick={() => { const c = confirmCancel; setConfirmCancel(null); void run(`c${c._id}`, () => apiContractAction(storeId, c._id, 'cancel'), 'Subscription cancelled'); }}>Cancel subscription</Button></div>}>
          <p className="text-[13px] text-charcoal m-0">{confirmCancel.customerName || 'The customer'} will not get any more orders. Orders already placed stay as they are.</p>
        </Modal>
      )}
    </>
  );
}
