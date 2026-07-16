import { useEffect, useState, useCallback } from 'react';
import { Check, Zap, Users, Package, Sparkles, type LucideIcon } from 'lucide-react';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { SkeletonBox } from '@/components/comman/ui';
import {
  apiBrowsePlatformPlans, apiGetStorePlatformPlan, apiGetStoreEntitlements, apiChangePlatformPlan,
  apiPurchaseAddon, apiListStoreAddons, apiCancelAddon, apiGetStoreInvoices,
  type PlatformPlan, type StorePlatformSubscription, type EntitlementsSummary, type AddonPurchase, type AddonType,
  type PlatformPlanInvoice,
} from '@/api/services/platformPlans';

const INVOICE_STATUS_STYLE: Record<string, string> = {
  paid: 'bg-[#E3F4EA] text-[#1E7A3C]',
  pending: 'bg-[#FDF2DA] text-[#946200]',
  failed: 'bg-[#FDECEA] text-[#C0392B]',
  refunded: 'bg-bone text-slate',
  partially_refunded: 'bg-bone text-slate',
};

const ADDON_LABELS: Record<AddonType, string> = {
  extra_ai_credits: 'Extra AI Credits (+500)',
  extra_staff_seat: 'Extra Staff Seat',
  priority_marketplace_placement: 'Priority Marketplace Placement',
  advanced_tax_compliance: 'Advanced Tax Compliance',
  sms_notifications: 'SMS Notifications',
};

function UsageBar({ label, used, max, Icon }: { label: string; used: number; max: number; Icon: LucideIcon }) {
  const unlimited = max === -1;
  const pct = unlimited ? 0 : Math.min(100, (used / Math.max(1, max)) * 100);
  const near = !unlimited && pct >= 85;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-[12.5px] text-graphite"><Icon size={13} className="text-slate" />{label}</span>
        <span className="text-[12px] font-semibold text-carbon">{used}{unlimited ? '' : ` / ${max}`}</span>
      </div>
      {!unlimited && (
        <div className="h-[6px] bg-cream rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: near ? '#C0392B' : '#D97757' }} />
        </div>
      )}
    </div>
  );
}

export default function StorePlanBilling() {
  const { storeId } = useStoreWorkspace();
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [current, setCurrent] = useState<StorePlatformSubscription | null>(null);
  const [entitlements, setEntitlements] = useState<EntitlementsSummary | null>(null);
  const [addons, setAddons] = useState<AddonPurchase[]>([]);
  const [invoices, setInvoices] = useState<PlatformPlanInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [changingId, setChangingId] = useState<string | null>(null);
  const [interval, setInterval_] = useState<'monthly' | 'yearly'>('monthly');
  const [addonModal, setAddonModal] = useState(false);
  const [confirmingPlan, setConfirmingPlan] = useState<PlatformPlan | null>(null);
  const [cancelingAddon, setCancelingAddon] = useState<AddonPurchase | null>(null);
  const [actionError, setActionError] = useState('');
  const [addonBusy, setAddonBusy] = useState(false);

  const load = useCallback(() => {
    if (!storeId) return;
    setLoading(true); setError('');
    Promise.all([apiBrowsePlatformPlans(), apiGetStorePlatformPlan(storeId), apiGetStoreEntitlements(storeId), apiListStoreAddons(storeId), apiGetStoreInvoices(storeId)])
      .then(([plansRes, curRes, entRes, addonRes, invRes]) => {
        setPlans(plansRes.data); setCurrent(curRes.data); setEntitlements(entRes.data); setAddons(addonRes.data); setInvoices(invRes.data.invoices);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load plan & billing.'))
      .finally(() => setLoading(false));
  }, [storeId]);
  useEffect(load, [load]);

  async function submitChangePlan() {
    if (!confirmingPlan) return;
    setChangingId(confirmingPlan._id);
    setActionError('');
    try {
      await apiChangePlatformPlan(storeId, confirmingPlan._id, interval);
      setConfirmingPlan(null);
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to change plan.');
    } finally {
      setChangingId(null);
    }
  }

  async function handlePurchaseAddon(type: AddonType) {
    setAddonBusy(true);
    setActionError('');
    try {
      await apiPurchaseAddon(storeId, type, 1);
      setAddonModal(false);
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to purchase add-on.');
    } finally {
      setAddonBusy(false);
    }
  }

  async function submitCancelAddon() {
    if (!cancelingAddon) return;
    setAddonBusy(true);
    setActionError('');
    try {
      await apiCancelAddon(storeId, cancelingAddon._id);
      setCancelingAddon(null);
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel add-on.');
    } finally {
      setAddonBusy(false);
    }
  }

  if (loading && !current) {
    return (
      <div className="px-7 pt-5 pb-8 flex flex-col gap-5">
        <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-4 flex flex-col gap-4">
          <SkeletonBox width={180} height={16} rounded="4px" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SkeletonBox height={34} rounded="6px" />
            <SkeletonBox height={34} rounded="6px" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBox key={i} height={220} rounded="10px" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <StorePageHeader title="Plan & Billing" subtitle="Your store's Solvexo subscription, usage limits, and add-ons." />

      <div className="px-7 pt-5 pb-8 flex flex-col gap-5">
        {error && <p className="text-[13px] text-error">{error}</p>}
        {actionError && (
          <div className="flex items-center justify-between gap-3 text-[13px] text-error bg-error-bg border border-[#FECACA] rounded-lg px-3 py-2">
            <span>{actionError}</span>
            <button onClick={() => setActionError('')} className="text-[11px] font-semibold text-error bg-transparent border-none cursor-pointer shrink-0">Dismiss</button>
          </div>
        )}

        {entitlements && (
          <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] font-bold text-carbon">Current Plan — {entitlements.currentPlanName}</p>
              {current?.status && <span className="text-[11px] font-semibold px-2 py-[3px] rounded-full bg-[#E3F4EA] text-[#1E7A3C] capitalize">{current.status}</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UsageBar label="Products" used={entitlements.maxProducts.used} max={entitlements.maxProducts.limit} Icon={Package} />
              <UsageBar label="Staff Accounts" used={entitlements.maxStaffAccounts.used} max={entitlements.maxStaffAccounts.limit} Icon={Users} />
              <UsageBar
                label="AI Credits (balance)"
                used={entitlements.aiCredits.monthlyAllowance === -1 ? entitlements.aiCredits.balance : Math.max(0, entitlements.aiCredits.monthlyAllowance - entitlements.aiCredits.balance)}
                max={entitlements.aiCredits.monthlyAllowance}
                Icon={Sparkles}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-[15px] font-bold text-carbon">Available Plans</p>
          <div className="inline-flex bg-white rounded-full p-1 border border-bone">
            {(['monthly', 'yearly'] as const).map(iv => (
              <button key={iv} onClick={() => setInterval_(iv)}
                className="px-3.5 py-[6px] rounded-full text-[11.5px] font-semibold cursor-pointer border-none capitalize"
                style={{ background: interval === iv ? '#141413' : 'transparent', color: interval === iv ? '#fff' : '#8C8A82' }}>
                {iv}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => {
            const isCurrent = current?.platformPlanId === plan._id;
            const price = interval === 'yearly' && plan.yearlyPriceUSD != null ? plan.yearlyPriceUSD : plan.monthlyPriceUSD;
            return (
              <div key={plan._id} className="bg-white border rounded-[10px] px-5 py-4 flex flex-col" style={{ borderColor: isCurrent ? '#D97757' : '#E8E6DC', borderWidth: isCurrent ? 2 : 1 }}>
                <div className="flex items-start justify-between mb-1">
                  <p className="text-[15px] font-bold text-carbon">{plan.name}</p>
                  {plan.badge && <span className="text-[10px] font-bold px-2 py-[2px] rounded-full bg-[#FBECE4] text-[#B95A3A]">{plan.badge}</span>}
                </div>
                <p className="text-[20px] font-bold text-brand-orange mb-2">
                  {plan.isFree ? 'Free' : plan.isCustomPricing ? 'Custom' : `$${price}/${interval === 'yearly' ? 'yr' : 'mo'}`}
                </p>
                <ul className="flex flex-col gap-1.5 mb-4 p-0 list-none flex-1">
                  {plan.featureBullets.map(f => (
                    <li key={f} className="flex items-start gap-1.5 text-[12px] text-graphite"><Check size={12} className="text-brand-orange mt-[2px] shrink-0" />{f}</li>
                  ))}
                </ul>
                <Button size="sm" variant={isCurrent ? 'outline' : 'primary'} disabled={isCurrent} loading={changingId === plan._id} onClick={() => { setConfirmingPlan(plan); setActionError(''); }}>
                  {isCurrent ? 'Current Plan' : 'Switch to this plan'}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-[14px] border-b border-bone">
            <p className="text-[13px] font-bold text-carbon">Add-ons</p>
            <Button size="sm" icon={<Zap size={13} />} onClick={() => setAddonModal(true)}>Add Add-on</Button>
          </div>
          {addons.length === 0 ? (
            <p className="px-5 py-6 text-center text-[13px] text-slate">No active add-ons.</p>
          ) : (
            <div className="flex flex-col">
              {addons.map(a => (
                <div key={a._id} className="flex items-center justify-between px-5 py-3 border-b border-[#F0EEE6] last:border-b-0">
                  <div>
                    <p className="text-[13px] font-medium text-carbon">{ADDON_LABELS[a.addonType]}</p>
                    <p className="text-[11px] text-slate">Qty {a.quantity} · ${a.amountUSD.toFixed(2)}/mo</p>
                  </div>
                  <button onClick={() => { setCancelingAddon(a); setActionError(''); }} className="px-2.5 py-1 bg-white border border-bone rounded-[6px] text-[11px] text-error cursor-pointer">Cancel</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-[14px] border-b border-bone">
            <p className="text-[13px] font-bold text-carbon">Invoice History</p>
          </div>
          {invoices.length === 0 ? (
            <p className="px-5 py-6 text-center text-[13px] text-slate">No invoices yet.</p>
          ) : (
            <div className="flex flex-col">
              {invoices.map(inv => (
                <div key={inv._id} className="flex items-center justify-between px-5 py-3 border-b border-[#F0EEE6] last:border-b-0">
                  <div>
                    <p className="text-[13px] font-medium text-carbon">{inv.invoiceNumber}</p>
                    <p className="text-[11px] text-slate">{new Date(inv.createdAt).toLocaleDateString()} · ${inv.amountUSD.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[11px] font-semibold px-2 py-[3px] rounded-full capitalize ${INVOICE_STATUS_STYLE[inv.status] ?? 'bg-bone text-slate'}`}>
                      {inv.status.replace('_', ' ')}
                    </span>
                    {(inv.hostedInvoiceUrl || inv.invoicePdfUrl) && (
                      <a href={inv.invoicePdfUrl ?? inv.hostedInvoiceUrl ?? '#'} target="_blank" rel="noreferrer"
                        className="text-[11px] font-semibold text-brand-orange hover:underline">
                        Download
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {addonModal && (
        <Modal title="Add an Add-on" width={420} onClose={() => setAddonModal(false)}>
          <div className="flex flex-col gap-2">
            {(Object.keys(ADDON_LABELS) as AddonType[]).map(type => (
              <button key={type} disabled={addonBusy} onClick={() => handlePurchaseAddon(type)}
                className="text-left px-3.5 py-3 rounded-lg bg-cream border border-bone cursor-pointer hover:border-brand-orange/40 disabled:opacity-50 disabled:cursor-wait">
                <span className="text-[13px] font-medium text-charcoal">{ADDON_LABELS[type]}</span>
              </button>
            ))}
          </div>
          {actionError && <p className="text-[12px] text-error mt-3">{actionError}</p>}
        </Modal>
      )}

      {confirmingPlan && (
        <Modal title="Switch Plan" width={420} onClose={() => setConfirmingPlan(null)}
          footer={<>
            <Button variant="outline" onClick={() => setConfirmingPlan(null)} disabled={changingId === confirmingPlan._id}>Cancel</Button>
            <Button onClick={submitChangePlan} loading={changingId === confirmingPlan._id}>Switch Plan</Button>
          </>}
        >
          <p className="text-[13px] text-charcoal">
            Switch to <strong>{confirmingPlan.name}</strong>
            {!confirmingPlan.isFree && !confirmingPlan.isCustomPricing && (
              <> — ${interval === 'yearly' && confirmingPlan.yearlyPriceUSD != null ? confirmingPlan.yearlyPriceUSD : confirmingPlan.monthlyPriceUSD}/{interval === 'yearly' ? 'yr' : 'mo'}</>
            )}?
          </p>
          {actionError && <p className="text-[12px] text-error mt-2">{actionError}</p>}
        </Modal>
      )}

      {cancelingAddon && (
        <Modal title="Cancel Add-on" width={420} onClose={() => setCancelingAddon(null)}
          footer={<>
            <Button variant="outline" onClick={() => setCancelingAddon(null)} disabled={addonBusy}>Back</Button>
            <Button variant="danger" onClick={submitCancelAddon} loading={addonBusy}>Cancel Add-on</Button>
          </>}
        >
          <p className="text-[13px] text-charcoal">
            Cancel <strong>{ADDON_LABELS[cancelingAddon.addonType]}</strong>? This takes effect immediately.
          </p>
          {actionError && <p className="text-[12px] text-error mt-2">{actionError}</p>}
        </Modal>
      )}
    </>
  );
}
