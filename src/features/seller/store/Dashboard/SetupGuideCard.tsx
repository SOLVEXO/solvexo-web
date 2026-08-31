import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ShoppingBag, Palette, CreditCard, Check, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiGetOnboardingProgress } from '@/api/services/platformPlans';
import { apiGetStripeConnectStatus } from '@/api/services/stripeConnect';

// ── Persistent "Setup Guide" checklist — replaces the old mandatory Payment
// step + separate Review step in the onboarding wizard (see OnboardingPage.tsx's
// STEPS comment). The seller now lands in a real, live store immediately after
// a 3-step wizard, and everything that used to be a one-time onboarding screen
// (paying for Solvexo, accepting real customer payments, customizing the
// storefront, adding a first product) is a task here instead — reachable any
// time, not just during the signup flow.
//
// Three of the four tasks are auto-detected from REAL backend state (never a
// fake/cosmetic checkbox): `hasPlatformPaymentMethod` (per-seller, the same
// signal the old onboarding Payment step used — see
// SellerPlatformSubscriptionsService.getOnboardingProgress), Stripe Connect's
// `chargesEnabled` (whether the store can actually accept a real customer
// payment yet), and the store's own product count (already fetched by
// StoreDashboard for its metrics, passed in as a prop so this card doesn't
// duplicate that request). "Customize your storefront" has no cheap reliable
// completion signal in this codebase (no field tracks "has this seller
// meaningfully edited their theme"), so it's the one item a seller marks
// done/undone themselves — an honest, reversible toggle, not a claim of
// automatic verification.
interface SetupTask {
  id: string;
  label: string;
  desc: string;
  Icon: LucideIcon;
  path: string;
  done: boolean;
  /** Only the "customize" task is user-toggleable; the rest reflect real,
   *  read-only backend state and can't be checked off by clicking them. */
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

export function SetupGuideCard({ storeId, totalProducts }: { storeId: string; totalProducts: number }) {
  const navigate = useNavigate();
  const [hasPlatformPaymentMethod, setHasPlatformPaymentMethod] = useState(false);
  const [chargesEnabled, setChargesEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [customized, toggleCustomized] = useCustomizeDone(storeId);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiGetOnboardingProgress().catch(() => null),
      apiGetStripeConnectStatus().catch(() => null),
    ]).then(([progressRes, connectRes]) => {
      if (cancelled) return;
      setHasPlatformPaymentMethod(!!progressRes?.data?.hasPlatformPaymentMethod);
      setChargesEnabled(!!connectRes?.data?.chargesEnabled);
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [storeId]);

  const tasks: SetupTask[] = [
    {
      id: 'get-paid', label: 'Set up how you get paid',
      desc: 'Connect Stripe so buyers can pay you directly at checkout.',
      Icon: Wallet, path: 'settings', done: chargesEnabled, manual: false,
    },
    {
      id: 'product', label: 'Add your first product',
      desc: 'List something for sale in your catalog.',
      Icon: ShoppingBag, path: 'products/add', done: totalProducts > 0, manual: false,
    },
    {
      id: 'customize', label: 'Customize your storefront',
      desc: 'Pick colors, sections, and a look that fits your brand.',
      Icon: Palette, path: 'online-store/themes', done: customized, manual: true,
    },
    {
      id: 'billing', label: 'Add a payment method',
      desc: 'Optional — add a card for your Solvexo subscription after the trial ends.',
      Icon: CreditCard, path: 'plan-billing', done: hasPlatformPaymentMethod, manual: false,
    },
  ];

  const doneCount = tasks.filter(t => t.done).length;

  // Nothing to show until the real signals have loaded (avoids a flash of
  // "0 done" before the actual state arrives), and nothing to show once
  // every task is genuinely done — the guide isn't meant to linger forever.
  if (!loaded || doneCount === tasks.length) return null;

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
        <div className="flex flex-col divide-y divide-[#f3f2ec]">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-[#f7f6f1]">
              <button
                type="button"
                onClick={task.manual ? toggleCustomized : undefined}
                disabled={!task.manual}
                title={task.manual ? (task.done ? 'Mark as not done' : 'Mark as done') : (task.done ? 'Done' : 'Not done yet')}
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border-0 transition-colors duration-150 ${task.manual ? 'cursor-pointer' : 'cursor-default'} ${task.done ? 'bg-success-bg text-success' : 'bg-brand-pale-orange text-brand-orange'}`}
              >
                {task.done ? <Check size={14} /> : <task.Icon size={14} />}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/store/${storeId}/${task.path}`)}
                className="flex-1 min-w-0 flex items-center gap-2 bg-transparent border-0 cursor-pointer text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-medium ${task.done ? 'text-slate line-through' : 'text-charcoal'}`}>{task.label}</p>
                  <p className="text-[11px] text-slate mt-[1px]">{task.desc}</p>
                </div>
                <ArrowRight size={14} className="text-slate shrink-0" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
