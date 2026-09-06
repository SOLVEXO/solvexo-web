import { useState, useEffect } from 'react';
import { Star, Check, AlertCircle } from 'lucide-react';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import {
  apiBrowseStorePlans, apiSubscribeToPlan, apiGetMySubscriptions, apiCancelMySubscription,
  apiPauseMySubscription, apiResumeMySubscription,
  type BuyerPlan, type Subscription, type BillingInterval,
} from '@/api/services/subscriptions';
import { StripeCardPayment, isStripeConfigured } from '@/features/buyer/components/StripeCardPayment';
import { currencySymbol, fmt2 } from '@/utils/currency';
import { AtelierButton } from '../components/AtelierButton';
import { atelierTheme as t } from '../theme.config';

/** Theme 01's own Subscriptions (seller membership plans) page — real,
 *  backend-wired (`apiBrowseStorePlans`/`apiSubscribeToPlan`/
 *  `apiGetMySubscriptions`). This is genuinely the FIRST real frontend
 *  consumer of the subscribe endpoint (confirmed by grep — the apex app
 *  never wired a "browse plans" page either, only pause/resume/cancel of an
 *  already-existing subscription). Stripe-driven billing starts
 *  `default_incomplete`, so a fresh subscribe can come back needing one more
 *  card-confirmation step — handled the same way Gift Cards' purchase flow
 *  already does. */
export function AtelierSubscriptionsPage() {
  useStorefrontSeo({ title: 'Membership', noindex: true });
  const { store } = useStorefront();
  const [plans, setPlans] = useState<BuyerPlan[] | null>(null);
  const [mySub, setMySub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState<BillingInterval>('monthly');
  const [subscribingId, setSubscribingId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([apiBrowseStorePlans(store.storeId), apiGetMySubscriptions()])
      .then(([plansRes, subsRes]) => {
        setPlans(plansRes.data ?? []);
        const mine = subsRes.data.subscriptions.find(s => s.storeId === store.storeId && s.status !== 'canceled');
        setMySub(mine ?? null);
      })
      .catch(() => setError('Could not load membership plans right now.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [store.storeId]);

  const handleSubscribe = async (plan: BuyerPlan) => {
    setError('');
    setSubscribingId(plan._id);
    try {
      const res = await apiSubscribeToPlan(plan._id, interval);
      if (res.data.requiresAction && res.data.clientSecret) {
        setClientSecret(res.data.clientSecret);
      } else {
        load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe.');
    } finally {
      setSubscribingId(null);
    }
  };

  const handleCancel = async () => {
    if (!mySub) return;
    setActionBusy(true);
    try {
      await apiCancelMySubscription(mySub._id, true);
      load();
    } finally {
      setActionBusy(false);
    }
  };

  const handlePauseResume = async () => {
    if (!mySub) return;
    setActionBusy(true);
    try {
      if (mySub.status === 'paused') await apiResumeMySubscription(mySub._id);
      else await apiPauseMySubscription(mySub._id);
      load();
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <main className="mx-auto" style={{ maxWidth: '760px', padding: `48px ${t.layout.containerPadX}` }}>
      <h1 style={{ fontFamily: t.fonts.display, fontSize: '24px', fontWeight: 600, color: t.colors.ink, marginBottom: '8px' }}>Membership</h1>
      <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginBottom: '28px' }}>
        Join {store.name}'s membership for ongoing perks.
      </p>

      {loading ? (
        <div className="animate-pulse" style={{ height: '320px', background: t.colors.bgAlt }} />
      ) : clientSecret ? (
        isStripeConfigured() ? (
          <StripeCardPayment clientSecret={clientSecret} amount={0} currency="USD" onConfirmed={() => { setClientSecret(null); load(); }} />
        ) : (
          <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.danger }}>Payments aren't configured yet.</p>
        )
      ) : mySub ? (
        <section style={{ border: `1px solid ${t.colors.border}`, padding: '24px' }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p style={{ fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: t.colors.inkMuted }}>Your membership</p>
              <p style={{ fontFamily: t.fonts.display, fontSize: '18px', fontWeight: 600, color: t.colors.ink, marginTop: '4px', textTransform: 'capitalize' }}>{mySub.status}</p>
            </div>
            <span className="flex items-center gap-1.5" style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 600, color: t.colors.accent, border: `1px solid ${t.colors.accent}`, padding: '6px 14px' }}>
              <Star size={13} /> {currencySymbol('USD')}{fmt2(mySub.amountUSD)}/{mySub.billingInterval === 'yearly' ? 'yr' : 'mo'}
            </span>
          </div>
          <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted, marginTop: '14px' }}>
            {mySub.pendingCancellation
              ? `Cancels at the end of this period (${new Date(mySub.currentPeriodEnd).toLocaleDateString()}).`
              : `Next billing date: ${new Date(mySub.nextBillingDate).toLocaleDateString()}`}
          </p>
          <div className="flex items-center gap-3" style={{ marginTop: '18px' }}>
            {!mySub.pendingCancellation && (
              <button
                type="button" onClick={handlePauseResume} disabled={actionBusy}
                className="cursor-pointer bg-transparent disabled:opacity-50"
                style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 600, color: t.colors.ink, border: `1px solid ${t.colors.border}`, padding: '8px 16px' }}
              >
                {mySub.status === 'paused' ? 'Resume' : 'Pause'}
              </button>
            )}
            {!mySub.pendingCancellation && mySub.status !== 'canceled' && (
              <button
                type="button" onClick={handleCancel} disabled={actionBusy}
                className="cursor-pointer bg-transparent disabled:opacity-50"
                style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 600, color: t.colors.danger, border: `1px solid ${t.colors.danger}`, padding: '8px 16px' }}
              >
                Cancel
              </button>
            )}
          </div>
        </section>
      ) : !plans || plans.length === 0 ? (
        <div className="flex flex-col items-center text-center" style={{ padding: '64px 0', border: `1px solid ${t.colors.border}` }}>
          <Star size={28} style={{ color: t.colors.inkMuted, marginBottom: '14px' }} />
          <p style={{ fontFamily: t.fonts.display, fontSize: '16px', fontWeight: 600, color: t.colors.ink }}>No membership plans yet</p>
          <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '6px' }}>{store.name} hasn't set up a membership program.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1" style={{ marginBottom: '20px' }}>
            {(['monthly', 'yearly'] as const).map(iv => (
              <button
                key={iv} type="button" onClick={() => setInterval(iv)}
                className="cursor-pointer"
                style={{
                  fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 600, padding: '8px 16px',
                  border: `1px solid ${interval === iv ? t.colors.ink : t.colors.border}`,
                  background: interval === iv ? t.colors.ink : 'transparent',
                  color: interval === iv ? '#FFFFFF' : t.colors.ink,
                }}
              >
                {iv === 'monthly' ? 'Monthly' : 'Yearly'}
              </button>
            ))}
          </div>

          {error && (
            <p className="flex items-center gap-1.5" style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.danger, marginBottom: '14px' }}>
              <AlertCircle size={13} /> {error}
            </p>
          )}

          <div className="flex flex-col gap-4">
            {plans.map(plan => {
              const price = interval === 'yearly' ? (plan.displayYearlyPrice ?? plan.displayMonthlyPrice * 12) : plan.displayMonthlyPrice;
              const isSubscribing = subscribingId === plan._id;
              return (
                <div key={plan._id} style={{ border: `1px solid ${t.colors.border}`, padding: '22px' }}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p style={{ fontFamily: t.fonts.display, fontSize: '17px', fontWeight: 600, color: t.colors.ink }}>{plan.name}</p>
                      {plan.description && <p style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.inkMuted, marginTop: '4px' }}>{plan.description}</p>}
                    </div>
                    <p style={{ fontFamily: t.fonts.display, fontSize: '20px', fontWeight: 600, color: t.colors.ink }}>
                      {currencySymbol(plan.displayCurrency)}{fmt2(price)}<span style={{ fontSize: '12px', fontWeight: 400, color: t.colors.inkMuted }}>/{interval === 'yearly' ? 'yr' : 'mo'}</span>
                    </p>
                  </div>
                  {plan.features.length > 0 && (
                    <ul className="flex flex-col gap-1.5" style={{ marginTop: '14px' }}>
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2" style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.ink }}>
                          <Check size={13} style={{ color: t.colors.accent, flexShrink: 0 }} /> {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div style={{ marginTop: '18px' }}>
                    <AtelierButton onClick={() => handleSubscribe(plan)} loading={isSubscribing}>Join {plan.name}</AtelierButton>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
