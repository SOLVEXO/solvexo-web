import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Archive, TrendingUp, Users, DollarSign, Eye } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Modal } from '@/components/comman/ui/Modal';
import { Button } from '@/components/comman/ui/Button';
import { Input, Textarea } from '@/components/comman/ui/Input';
import { SkeletonBox } from '@/components/comman/ui';
import {
  apiAdminListPlatformPlans, apiAdminCreatePlatformPlan, apiAdminUpdatePlatformPlan, apiAdminArchivePlatformPlan,
  apiAdminGetPlatformPlanRevenue, apiAdminGetPlatformPlanSubscribers, apiAdminListAddonPurchases,
  apiAdminRefundPlatformInvoice,
  type PlatformPlan, type PlatformPlanLimits, type StorePlatformSubscription, type AddonPurchase,
} from '@/api/services/platformPlans';

const ADDON_LABELS: Record<string, string> = {
  extra_ai_credits: 'Extra AI Credits', extra_staff_seat: 'Extra Staff Seat',
  priority_marketplace_placement: 'Priority Marketplace Placement',
  advanced_tax_compliance: 'Advanced Tax Compliance', sms_notifications: 'SMS Notifications',
};

const DEFAULT_LIMITS: PlatformPlanLimits = {
  maxProducts: 25, maxStaffAccounts: 1, maxPosLocations: 1, aiCreditsPerMonth: 0, transactionFeeRate: 0.05,
  customDomainAllowed: false, whiteLabelAllowed: false, loyaltyProgramAllowed: false, subscriptionProductsAllowed: false,
  advancedAnalyticsAllowed: false, abandonedCartRecoveryAllowed: false, emailCampaignsAllowed: false,
  apiWebhooksAllowed: false, dedicatedAccountManager: false, prioritySupport: false, marketplaceFeaturedBadge: false,
};

const BOOL_FLAGS: { key: keyof PlatformPlanLimits; label: string }[] = [
  { key: 'customDomainAllowed', label: 'Custom domain' },
  { key: 'whiteLabelAllowed', label: 'White label' },
  { key: 'loyaltyProgramAllowed', label: 'Loyalty program' },
  { key: 'subscriptionProductsAllowed', label: 'Store subscriptions' },
  { key: 'advancedAnalyticsAllowed', label: 'Advanced analytics' },
  { key: 'abandonedCartRecoveryAllowed', label: 'Abandoned cart recovery' },
  { key: 'emailCampaignsAllowed', label: 'Email campaigns' },
  { key: 'apiWebhooksAllowed', label: 'API & webhooks' },
  { key: 'dedicatedAccountManager', label: 'Dedicated account manager' },
  { key: 'prioritySupport', label: 'Priority support' },
  { key: 'marketplaceFeaturedBadge', label: 'Marketplace featured badge' },
];

function PlanFormModal({ plan, onClose, onSaved }: { plan: PlatformPlan | 'new'; onClose: () => void; onSaved: () => void }) {
  const isEdit = plan !== 'new';
  const p = isEdit ? plan : null;
  const [name, setName] = useState(p?.name ?? '');
  const [description, setDescription] = useState(p?.description ?? '');
  const [badge, setBadge] = useState(p?.badge ?? '');
  const [isFree, setIsFree] = useState(p?.isFree ?? false);
  const [monthlyPrice, setMonthlyPrice] = useState(p?.monthlyPriceUSD != null ? String(p.monthlyPriceUSD) : '');
  const [yearlyPrice, setYearlyPrice] = useState(p?.yearlyPriceUSD != null ? String(p.yearlyPriceUSD) : '');
  const [trialDays, setTrialDays] = useState(p ? String((p as any).trialDays ?? 0) : '0');
  const [featuresText, setFeaturesText] = useState(p?.featureBullets.join('\n') ?? '');
  const [limits, setLimits] = useState<PlatformPlanLimits>(p?.limits ?? DEFAULT_LIMITS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setLimit = <K extends keyof PlatformPlanLimits>(k: K, v: PlatformPlanLimits[K]) => setLimits(prev => ({ ...prev, [k]: v }));

  async function submit() {
    if (!name.trim()) { setError('Plan name is required.'); return; }
    setError(''); setSaving(true);
    try {
      const payload = {
        name: name.trim(), description: description.trim() || undefined, badge: badge.trim() || undefined,
        isFree, monthlyPriceUSD: monthlyPrice ? Number(monthlyPrice) : undefined,
        yearlyPriceUSD: yearlyPrice ? Number(yearlyPrice) : undefined,
        trialDays: Number(trialDays) || 0,
        featureBullets: featuresText.split('\n').map(f => f.trim()).filter(Boolean),
        limits,
      };
      if (isEdit) await apiAdminUpdatePlatformPlan(p!._id, payload);
      else await apiAdminCreatePlatformPlan(payload);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plan.');
    } finally { setSaving(false); }
  }

  return (
    <Modal title={isEdit ? 'Edit Platform Plan' : 'Create Platform Plan'} width={640} onClose={onClose}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={saving}>{isEdit ? 'Save Changes' : 'Create Plan'}</Button></>}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Plan Name" value={name} onChange={e => setName(e.target.value)} />
          <Input label="Badge (optional)" placeholder="Popular" value={badge} onChange={e => setBadge(e.target.value)} />
        </div>
        <Textarea label="Description" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
        <div className="grid grid-cols-3 gap-3">
          <Input label="Monthly $" type="number" min={0} value={monthlyPrice} onChange={e => setMonthlyPrice(e.target.value)} disabled={isFree} />
          <Input label="Yearly $ (optional)" type="number" min={0} value={yearlyPrice} onChange={e => setYearlyPrice(e.target.value)} disabled={isFree} />
          <Input label="Trial Days" type="number" min={0} value={trialDays} onChange={e => setTrialDays(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-[12.5px] text-charcoal">
          <input type="checkbox" checked={isFree} onChange={e => setIsFree(e.target.checked)} /> Free plan (no charge)
        </label>
        <Textarea label="Feature bullets (one per line)" rows={3} value={featuresText} onChange={e => setFeaturesText(e.target.value)} />

        <div>
          <p className="text-[12px] font-semibold text-charcoal mb-2">Limits</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            <Input label="Max products (-1=∞)" type="number" value={limits.maxProducts ?? ''} onChange={e => setLimit('maxProducts', Number(e.target.value))} />
            <Input label="Max staff (-1=∞)" type="number" value={limits.maxStaffAccounts ?? ''} onChange={e => setLimit('maxStaffAccounts', Number(e.target.value))} />
            <Input label="Max POS locations" type="number" value={limits.maxPosLocations ?? ''} onChange={e => setLimit('maxPosLocations', Number(e.target.value))} />
            <Input label="AI credits/mo" type="number" value={limits.aiCreditsPerMonth ?? ''} onChange={e => setLimit('aiCreditsPerMonth', Number(e.target.value))} />
            <Input label="Txn fee (0-1)" type="number" step="0.01" min={0} max={1} value={limits.transactionFeeRate ?? ''} onChange={e => setLimit('transactionFeeRate', Number(e.target.value))} />
            <Input label="SLA uptime %" type="number" value={limits.slaUptimePercent ?? ''} onChange={e => setLimit('slaUptimePercent', Number(e.target.value))} />
          </div>
          <div className="flex flex-wrap gap-2">
            {BOOL_FLAGS.map(f => {
              const active = !!limits[f.key];
              return (
                <button key={f.key} type="button" onClick={() => setLimit(f.key, !active as any)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer"
                  style={{ background: active ? '#D97757' : '#fff', color: active ? '#fff' : '#5A5852', borderColor: active ? '#D97757' : '#E8E6DC' }}>
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
        {error && <p className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

// ── Subscribers modal ────────────────────────────────────────────────────────
function SubscribersModal({ plan, onClose }: { plan: PlatformPlan; onClose: () => void }) {
  const [subs, setSubs] = useState<StorePlatformSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiAdminGetPlatformPlanSubscribers(plan._id, { limit: 50 }).then(res => setSubs(res.data.subscribers)).finally(() => setLoading(false));
  }, [plan._id]);

  async function refund() {
    const invoiceId = window.prompt('Invoice ID to refund:');
    if (!invoiceId) return;
    const amountStr = window.prompt('Amount to refund (leave blank for full remaining amount):');
    try {
      await apiAdminRefundPlatformInvoice(invoiceId, amountStr ? parseFloat(amountStr) : undefined);
      alert('Refund processed.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Refund failed.');
    }
  }

  return (
    <Modal title={`Subscribers — ${plan.name}`} width={560} onClose={onClose}>
      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} height={40} rounded="6px" />)}</div>
      ) : subs.length === 0 ? (
        <p className="text-[13px] text-slate">No subscribers on this plan.</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
          {subs.map(s => (
            <div key={s._id} className="flex items-center justify-between text-[12.5px] bg-cream rounded-lg px-3 py-2.5">
              <div>
                <p className="font-semibold text-charcoal">Store {s.storeId.slice(-6).toUpperCase()}</p>
                <p className="text-[11px] text-slate">{s.billingInterval} — ${s.amountUSD.toFixed(2)} — {s.status}</p>
              </div>
              <button onClick={refund} className="px-2.5 py-1 bg-white border border-bone rounded-[6px] text-[11px] text-[#C13030] cursor-pointer">Refund…</button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ── Add-on purchases panel ────────────────────────────────────────────────────
function AddonsPanel() {
  const [addons, setAddons] = useState<AddonPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiAdminListAddonPurchases({ limit: 50 }).then(res => setAddons(res.data.addons)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="px-5 py-4 flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} height={36} rounded="6px" />)}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {['STORE', 'ADD-ON', 'QTY', 'AMOUNT', 'STATUS', 'DATE'].map(h => (
              <th key={h} className="text-left px-4 py-[10px] text-[11px] font-semibold text-slate uppercase tracking-[0.05em] border-b border-bone bg-cream whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {addons.length === 0 ? (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-[13px] text-slate">No add-on purchases yet.</td></tr>
          ) : addons.map(a => (
            <tr key={a._id} className="border-b border-[#F0EEE6]">
              <td className="px-4 py-3 text-[13px] text-charcoal">{a.storeId.slice(-6).toUpperCase()}</td>
              <td className="px-4 py-3 text-[13px] text-graphite">{ADDON_LABELS[a.addonType] ?? a.addonType}</td>
              <td className="px-4 py-3 text-[13px] text-graphite">{a.quantity}</td>
              <td className="px-4 py-3 text-[13px] font-semibold text-[#2D8A4E]">${a.amountUSD.toFixed(2)}</td>
              <td className="px-4 py-3 text-[12px] text-slate capitalize">{a.status}</td>
              <td className="px-4 py-3 text-[12px] text-slate whitespace-nowrap">{new Date(a.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminPlatformPlans() {
  usePageTitle('Platform Plans');
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [revenue, setRevenue] = useState<{ mrr: number; arr: number; activeSubscribers: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<PlatformPlan | 'new' | null>(null);
  const [viewingSubscribersFor, setViewingSubscribersFor] = useState<PlatformPlan | null>(null);
  const [showAddons, setShowAddons] = useState(false);

  const load = useCallback(() => {
    setLoading(true); setError('');
    Promise.all([apiAdminListPlatformPlans(true), apiAdminGetPlatformPlanRevenue()])
      .then(([plansRes, revRes]) => { setPlans(plansRes.data); setRevenue(revRes.data); })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load platform plans.'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  async function handleArchive(plan: PlatformPlan) {
    if (!window.confirm(`Archive "${plan.name}"?`)) return;
    try { await apiAdminArchivePlatformPlan(plan._id); load(); }
    catch (err) {
      if (err instanceof Error && window.confirm(`${err.message}\n\nArchive anyway?`)) { await apiAdminArchivePlatformPlan(plan._id, true); load(); }
    }
  }

  const metrics = revenue ? [
    { label: 'Platform MRR', value: `$${revenue.mrr.toFixed(2)}`, Icon: TrendingUp },
    { label: 'Platform ARR', value: `$${revenue.arr.toFixed(2)}`, Icon: DollarSign },
    { label: 'Active Sellers', value: String(revenue.activeSubscribers), Icon: Users },
  ] : [];

  return (
    <div>
      <div className="bg-white border-b border-bone px-7 py-[14px] sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-charcoal leading-[1.3]">Platform Plans</h1>
          <p className="text-[12px] text-slate mt-[2px]">Seller-to-Solvexo billing tiers, limits, and add-ons.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowAddons(s => !s)}>{showAddons ? 'Hide Add-ons' : 'View Add-on Purchases'}</Button>
          <Button icon={<Plus size={14} />} onClick={() => setEditing('new')}>Create Plan</Button>
        </div>
      </div>

      <div className="px-7 pt-5 pb-8 flex flex-col gap-5">
        {error && <p className="text-[13px] text-error">{error}</p>}

        {showAddons && (
          <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 py-[14px] border-b border-bone">
              <p className="text-[14px] font-bold text-charcoal">Add-on Purchases</p>
            </div>
            <AddonsPanel />
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {(loading && !revenue) ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-white border border-bone rounded-[10px] h-[84px] animate-pulse" />)
            : metrics.map(m => (
              <div key={m.label} className="bg-white border border-bone rounded-[10px] px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">{m.label}</p>
                <p className="text-[24px] font-bold text-carbon">{m.value}</p>
              </div>
            ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-4 flex flex-col gap-3">
                <SkeletonBox width="60%" height={16} rounded="4px" />
                <SkeletonBox width="40%" height={20} rounded="4px" />
                <div className="flex flex-col gap-1.5">
                  <SkeletonBox width="90%" height={11} rounded="4px" />
                  <SkeletonBox width="80%" height={11} rounded="4px" />
                  <SkeletonBox width="70%" height={11} rounded="4px" />
                </div>
                <SkeletonBox width="100%" height={34} rounded="8px" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map(plan => (
              <div key={plan._id} className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-4 flex flex-col">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-[15px] font-bold text-carbon">{plan.name}</p>
                  {plan.badge && <span className="text-[10px] font-bold px-2 py-[2px] rounded-full bg-[#FBECE4] text-[#B95A3A]">{plan.badge}</span>}
                </div>
                <p className="text-[18px] font-bold text-brand-orange mb-2">
                  {plan.isFree ? 'Free' : plan.isCustomPricing ? 'Custom' : `$${plan.monthlyPriceUSD}/mo`}
                </p>
                <ul className="flex flex-col gap-1 mb-3 p-0 list-none">
                  {plan.featureBullets.slice(0, 4).map(f => <li key={f} className="text-[12px] text-graphite">• {f}</li>)}
                </ul>
                <div className="flex items-center justify-between py-2 border-t border-[#F0EEE6] mb-3 mt-auto text-[11px] text-slate">
                  <span>{plan.subscriberCount ?? 0} sellers</span>
                  <span className="font-semibold text-[#2D8A4E]">${(plan.mrrUSD ?? 0).toFixed(2)}/mo</span>
                  <span className="capitalize">{plan.status}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(plan)} className="flex-1 flex items-center justify-center gap-1 py-2 bg-white border border-bone rounded-lg text-xs font-medium text-graphite cursor-pointer"><Pencil size={12} /> Edit</button>
                  <button onClick={() => setViewingSubscribersFor(plan)} className="flex-1 flex items-center justify-center gap-1 py-2 bg-white border border-bone rounded-lg text-xs font-medium text-graphite cursor-pointer"><Eye size={12} /> Subscribers</button>
                  {plan.status !== 'archived' && <button onClick={() => handleArchive(plan)} className="flex-1 flex items-center justify-center gap-1 py-2 bg-white border border-bone rounded-lg text-xs font-medium text-graphite cursor-pointer"><Archive size={12} /> Archive</button>}
                </div>
              </div>
            ))}
            {plans.length === 0 && <div className="col-span-full text-center py-10 text-[13px] text-slate">No platform plans yet.</div>}
          </div>
        )}
      </div>

      {editing && <PlanFormModal plan={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {viewingSubscribersFor && <SubscribersModal plan={viewingSubscribersFor} onClose={() => setViewingSubscribersFor(null)} />}
    </div>
  );
}
