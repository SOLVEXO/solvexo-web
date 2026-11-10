import { useState } from 'react';
import { Link } from 'react-router-dom';
import { errorMessage } from '@/api/errorMessage';
import { apiPublicPlansFor, apiSubscribe, type StorefrontPlan, type SubscribeAddress } from '@/api/services/sellingPlans';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { ts } from '@/utils/tStatic';
import { useLoad } from '../pageHooks';

export interface SubscribeBoxTokens { ink: string; inkMuted: string; border: string; accent: string; radius?: number }

const EMPTY: SubscribeAddress = { recipientName: '', addressLine1: '', city: '', zipCode: '', phoneNumber: '' };

/** "Subscribe & save" on a product page. Headless logic, theme colours passed in. Renders nothing when the product has no plan.
 *  Renewals are unpaid orders the customer pays like any other, so no card details are collected here. */
export function SubscribeBox({ productId, variantId, quantity, format, tokens }: { productId: string; variantId: string | undefined; quantity: number; format: (amount: number) => string; tokens: SubscribeBoxTokens }) {
  const { store } = useStorefront();
  const { requireAuth } = useAuthGate();
  const q = useLoad<StorefrontPlan[]>(() => apiPublicPlansFor(store.storeId, productId, variantId), [store.storeId, productId, variantId]);
  const [mode, setMode] = useState<'once' | 'subscribe'>('once');
  const [groupId, setGroupId] = useState('');
  const [optionId, setOptionId] = useState('');
  const [address, setAddress] = useState<SubscribeAddress>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ orderNumber?: string } | null>(null);

  const plans = q.data ?? [];
  if (!variantId || plans.length === 0) return null;
  const plan = plans.find((p) => p.groupId === groupId) ?? plans[0];
  const option = plan.options.find((o) => o.optionId === optionId) ?? plan.options[0];
  const radius = tokens.radius ?? 12;
  const field = { border: `1px solid ${tokens.border}`, borderRadius: Math.min(radius, 10), background: 'transparent', color: tokens.ink } as const;
  const set = (k: keyof SubscribeAddress) => (e: React.ChangeEvent<HTMLInputElement>) => setAddress((a) => ({ ...a, [k]: e.target.value }));
  const ready = address.recipientName.trim() && address.addressLine1.trim() && address.city.trim() && address.phoneNumber.trim();

  const submit = () => {
    requireAuth(() => {
      setBusy(true); setError('');
      apiSubscribe(store.storeId, { groupId: plan.groupId, optionId: option.optionId, variantId, quantity, address })
        .then((r) => setDone({ orderNumber: r.firstOrder?.orderNumber }))
        .catch((e: unknown) => setError(errorMessage(e, ts('sub.error', 'Could not start the subscription'))))
        .finally(() => setBusy(false));
    }, ts('sub.signin_reason', 'subscribe'));
  };

  if (done) {
    return (
      <div role="status" className="mt-4 p-4 text-sm" style={{ border: `1px solid ${tokens.border}`, borderRadius: radius, color: tokens.ink }}>
        <p className="m-0 font-medium">{ts('sub.started', 'You are subscribed.')}</p>
        {done.orderNumber && <p className="m-0 mt-1" style={{ color: tokens.inkMuted }}>{ts('sub.first_order', 'Your first order is #{{n}}. Pay it as shown on the order.', { n: done.orderNumber })}</p>}
        <Link to="/subscriptions" className="mt-2 inline-block underline">{ts('sub.manage', 'Manage subscriptions')}</Link>
      </div>
    );
  }

  return (
    <fieldset className="mt-4 p-3 text-sm" style={{ border: `1px solid ${tokens.border}`, borderRadius: radius, color: tokens.ink }}>
      <legend className="px-1 font-medium">{ts('sub.title', 'Purchase options')}</legend>
      <label className="flex cursor-pointer items-center gap-2 py-1">
        <input type="radio" name="purchase-mode" checked={mode === 'once'} onChange={() => setMode('once')} style={{ accentColor: tokens.accent }} /> {ts('sub.one_time', 'One-time purchase')}
      </label>
      <label className="flex cursor-pointer items-center gap-2 py-1">
        <input type="radio" name="purchase-mode" checked={mode === 'subscribe'} onChange={() => setMode('subscribe')} style={{ accentColor: tokens.accent }} /> {ts('sub.subscribe_save', 'Subscribe & save')}
      </label>
      {mode === 'subscribe' && (
        <div className="mt-2 flex flex-col gap-2">
          {plans.length > 1 && (
            <select aria-label={ts('sub.plan', 'Plan')} className="h-10 px-2" style={field} value={plan.groupId} onChange={(e) => { setGroupId(e.target.value); setOptionId(''); }}>
              {plans.map((p) => <option key={p.groupId} value={p.groupId}>{p.name}</option>)}
            </select>
          )}
          <select aria-label={ts('sub.frequency', 'Delivery every')} className="h-10 px-2" style={field} value={option.optionId} onChange={(e) => setOptionId(e.target.value)}>
            {plan.options.map((o) => <option key={o.optionId} value={o.optionId}>{o.label}{o.unitPrice != null ? ` · ${format(o.unitPrice)}` : ''}{o.discountPercent ? ` (${ts('sub.save', 'save {{p}}%', { p: o.discountPercent })})` : ''}</option>)}
          </select>
          {plan.trialDays > 0 && <p className="m-0" style={{ color: tokens.inkMuted }}>{ts('sub.trial', 'Your first order is placed in {{d}} days.', { d: plan.trialDays })}</p>}
          <p className="m-0 text-xs" style={{ color: tokens.inkMuted }}>{ts('sub.pay_note', 'Each delivery is an order you pay like any other (bank transfer or on delivery). Skip, pause or cancel any time from your account.')}</p>
          <input aria-label={ts('sub.name', 'Full name')} placeholder={ts('sub.name', 'Full name')} className="h-10 px-2" style={field} value={address.recipientName} onChange={set('recipientName')} maxLength={120} />
          <input aria-label={ts('sub.phone', 'Phone')} placeholder={ts('sub.phone', 'Phone')} className="h-10 px-2" style={field} value={address.phoneNumber} onChange={set('phoneNumber')} maxLength={40} />
          <input aria-label={ts('sub.address', 'Address')} placeholder={ts('sub.address', 'Address')} className="h-10 px-2" style={field} value={address.addressLine1} onChange={set('addressLine1')} maxLength={200} />
          <div className="flex gap-2">
            <input aria-label={ts('sub.city', 'City')} placeholder={ts('sub.city', 'City')} className="h-10 min-w-0 flex-1 px-2" style={field} value={address.city} onChange={set('city')} maxLength={80} />
            <input aria-label={ts('sub.zip', 'Postal code')} placeholder={ts('sub.zip', 'Postal code')} className="h-10 w-32 px-2" style={field} value={address.zipCode ?? ''} onChange={set('zipCode')} maxLength={20} />
          </div>
          {error && <p role="alert" className="m-0 text-xs" style={{ color: '#b42318' }}>{error}</p>}
          <button type="button" onClick={submit} disabled={busy || !ready} className="h-11 px-4 font-medium disabled:opacity-50" style={{ background: tokens.accent, color: '#fff', borderRadius: radius }}>
            {busy ? ts('sub.working', 'Please wait...') : ts('sub.button', 'Subscribe')}
          </button>
        </div>
      )}
    </fieldset>
  );
}
