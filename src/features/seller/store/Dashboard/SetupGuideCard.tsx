import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, ShoppingBag, Palette, CreditCard, Truck, Globe2,
  Check, ArrowRight, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiGetOnboardingProgress, apiGetStorePlatformPlan } from '@/api/services/platformPlans';
import { apiGetStripeConnectStatus } from '@/api/services/stripeConnect';
import { apiListStoreShippingZones } from '@/api/services/shipping';
import type { StoreData } from '@/api/services/store';

// ── Persistent "Setup Guide" card grid — Shopify's real Home page shows this
// exact shape for an incomplete/trial store (a task-card grid: "Select a
// plan", "Choose theme", "Activate payments", "Add name", "Set up domain",
// "Review rates" — each a real, backend-checkable state, not a cosmetic
// checkbox), confirmed against a live Shopify trial store screenshot this
// session. This card mirrors that BEHAVIOR (a real, dismissable-once-done
// task grid backed by genuine store state) with Solvexo's own actual
// features, not Shopify's copy or a pixel clone of its illustrations.
//
// One Shopify task was deliberately dropped rather than faked: "Name your
// store" — Shopify shows this because a new store starts on a Shopify-
// generated placeholder name; Solvexo's onboarding wizard (Step 1) already
// requires a real store name before a store can even be created, so there
// is never an incomplete-name state to check off here.
//
// Every task below is backed by REAL data already fetched elsewhere in this
// codebase — nothing here is a fake/cosmetic checkbox:
//  - `hasPlatformPaymentMethod` / `planStatus` — SellerPlatformSubscriptionsService.getOnboardingProgress / getStorePlatformPlan
//  - Stripe Connect `chargesEnabled` — StripeConnectService (whether the store can accept a real customer payment yet)
//  - `totalProducts` — the store's own catalog count (passed in, already fetched by StoreDashboard)
//  - `store.customDomainStatus` — StoreService's real DNS-verified custom-domain flow
//  - shipping zone count — ShippingZonesService, the store's own configured rates
// "Customize your storefront" has no cheap reliable completion signal in this
// codebase (no field tracks "has this seller meaningfully edited their
// theme"), so it stays the one item a seller marks done/undone themselves —
// an honest, reversible toggle, not a claim of automatic verification.
interface SetupTask {
  id: string;
  label: string;
  desc: string;
  cta: string;
  Icon: LucideIcon;
  path: string;
  done: boolean;
  /** Only the "customize" task is user-toggleable; the rest reflect real, read-only backend state and can't be checked off by clicking them. */
  manual: boolean;
}

function useCustomizeDone(storeId: string): [boolean, () => void] {
  const key = `solvexo:setup-guide:${storeId}:customized`;
  const [done, setDone] = useState(() => {
    try { return localStorage.getItem(key) === '1'; } catch { return false; }
  });
  const toggle = () => {
    setDone(prev => {
      const next = !prev;
      try { localStorage.setItem(key, next ? '1' : '0'); } catch { /* per-viewer convenience only */ }
      return next;
    });
  };
  return [done, toggle];
}

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export function SetupGuideCard({ storeId, totalProducts, store }: { storeId: string; totalProducts: number; store: StoreData | null }) {
  const navigate = useNavigate();
  const [hasPlatformPaymentMethod, setHasPlatformPaymentMethod] = useState(false);
  const [chargesEnabled, setChargesEnabled] = useState(false);
  const [shippingZoneCount, setShippingZoneCount] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [customized, toggleCustomized] = useCustomizeDone(storeId);
  // This THIS store's own subscription is actually 'locked' (no free trial —
  // the seller already used their one-per-account trial on an earlier
  // store; see SellerPlatformSubscriptionsService.ensureDefaultSubscription)
  // — previously this card always said "Optional... after the trial ends"
  // regardless, which is actively false for a locked store: it's already
  // not selling, and payment isn't optional, it's the way to unlock it.
  const [storeLocked, setStoreLocked] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiGetOnboardingProgress().catch(() => null),
      apiGetStripeConnectStatus().catch(() => null),
      apiGetStorePlatformPlan(storeId).catch(() => null),
      apiListStoreShippingZones(storeId, 'shipping').catch(() => null),
    ]).then(([progressRes, connectRes, planRes, shippingRes]) => {
      if (cancelled) return;
      setHasPlatformPaymentMethod(!!progressRes?.data?.hasPlatformPaymentMethod);
      setChargesEnabled(!!connectRes?.data?.chargesEnabled);
      setStoreLocked(planRes?.data?.status === 'locked');
      setTrialDaysLeft(planRes?.data?.status === 'trialing' ? daysUntil(planRes.data.trialEndsAt) : null);
      setShippingZoneCount(shippingRes?.data?.length ?? 0);
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [storeId]);

  const domainDone = store?.customDomainStatus === 'verified';

  const billingLabel = storeLocked
    ? 'Unlock this store'
    : trialDaysLeft !== null
      ? `Your trial ends in ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'}`
      : 'Add a payment method';
  const billingDesc = storeLocked
    ? 'This store is locked (no free trial left on your account) — choose or pay for a plan to resume selling.'
    : trialDaysLeft !== null
      ? 'Choose a plan before your trial ends so your store keeps selling without interruption.'
      : 'Optional — add a card for your Solvexo subscription after the trial ends.';

  const tasks: SetupTask[] = [
    {
      id: 'billing', label: billingLabel, desc: billingDesc, cta: storeLocked ? 'Unlock store' : 'Select a plan',
      Icon: CreditCard, path: 'plan-billing', done: hasPlatformPaymentMethod, manual: false,
    },
    {
      id: 'customize', label: 'Choose your store design',
      desc: 'Pick a theme that fits your brand, then customize colors and sections.',
      cta: 'Choose theme', Icon: Palette, path: 'online-store/themes', done: customized, manual: true,
    },
    {
      id: 'get-paid', label: 'Set up payments',
      desc: 'Connect Stripe so buyers can pay you directly at checkout.',
      cta: 'Activate payments', Icon: Wallet, path: 'integrations', done: chargesEnabled, manual: false,
    },
    {
      id: 'product', label: 'Add your first product',
      desc: 'List something for sale in your catalog.',
      cta: 'Add product', Icon: ShoppingBag, path: 'products/add', done: totalProducts > 0, manual: false,
    },
    {
      id: 'domain', label: 'Get a custom domain',
      desc: "Give your store a branded URL that's easy to find, trust, and remember.",
      cta: 'Set up domain', Icon: Globe2, path: 'settings', done: domainDone, manual: false,
    },
    {
      id: 'shipping', label: 'Review shipping rates',
      desc: 'Set up the zones and rates you actually ship to.',
      cta: 'Review rates', Icon: Truck, path: 'shipping', done: (shippingZoneCount ?? 0) > 0, manual: false,
    },
  ];

  const doneCount = tasks.filter(t => t.done).length;

  // Nothing to show until the real signals have loaded (avoids a flash of
  // "0 done" before the actual state arrives), and nothing to show once
  // every task is genuinely done — the guide isn't meant to linger forever.
  if (!loaded || shippingZoneCount === null || doneCount === tasks.length) return null;

  return (
    <div className="dash-section-enter bg-white border border-bone rounded-2xl overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-[#f3f2ec] bg-transparent border-0 cursor-pointer text-left"
      >
        <div>
          <p className="text-sm font-bold text-charcoal">Setup Guide</p>
          <p className="text-[11px] text-slate mt-[2px]">{doneCount} of {tasks.length} done — finish setting up your store</p>
        </div>
        {collapsed ? <ChevronDown size={16} className="text-slate shrink-0" /> : <ChevronUp size={16} className="text-slate shrink-0" />}
      </button>

      {!collapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
          {tasks.map(task => (
            <div
              key={task.id}
              className={`flex flex-col gap-3 rounded-[14px] border p-4 transition-colors duration-150 ${task.done ? 'border-[#eae8de] bg-[#fafaf6]' : 'border-bone bg-white hover:border-brand-orange/30'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${task.done ? 'bg-success-bg text-success' : 'bg-brand-pale-orange text-brand-orange'}`}>
                  {task.done ? <Check size={16} /> : <task.Icon size={16} />}
                </div>
                {task.manual && (
                  <button
                    type="button"
                    onClick={toggleCustomized}
                    className="text-[10px] font-medium text-slate hover:text-brand-orange bg-transparent border-0 cursor-pointer underline-offset-2 hover:underline"
                  >
                    {task.done ? 'Mark as not done' : 'Mark as done'}
                  </button>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-semibold leading-[1.3] ${task.done ? 'text-slate line-through' : 'text-charcoal'}`}>{task.label}</p>
                <p className="text-[11.5px] text-slate mt-1 leading-[1.4]">{task.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/store/${storeId}/${task.path}`)}
                className="self-start flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-[11.5px] font-semibold bg-cream border border-bone text-charcoal cursor-pointer transition-colors duration-150 hover:border-brand-orange/40 hover:bg-brand-pale-orange"
              >
                {task.done ? 'View' : task.cta}
                <ArrowRight size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
