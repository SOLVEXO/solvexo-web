import { useState } from 'react';
import { Link } from 'react-router-dom';
import { errorMessage } from '@/api/errorMessage';
import { TokenStorage } from '@/api/services/auth';
import { apiMySubscriptions, apiSubscriptionAction, type ContractRow } from '@/api/services/sellingPlans';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { activeLocale } from './core/locale';
import { useLoad } from './core/pageHooks';
import { ts } from '@/utils/tStatic';

const btnCls = 'rounded-lg border border-current/40 px-3 py-1.5 text-sm font-medium disabled:opacity-50';

const every = (t: { unit: 'week' | 'month'; count: number }) =>
  t.unit === 'week' ? ts('sub.every_weeks', 'Every {{n}} week(s)', { n: t.count }) : ts('sub.every_months', 'Every {{n}} month(s)', { n: t.count });

/** Theme-neutral "My subscriptions" page (route key `subscriptions`): next delivery, skip, pause, resume, cancel. */
export function DefaultSubscriptionsPage() {
  const { store } = useStorefront();
  const signedIn = !!TokenStorage.getToken();
  const q = useLoad<ContractRow[]>(() => (signedIn ? apiMySubscriptions(store.storeId) : Promise.resolve([])), [store.storeId, signedIn]);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState('');
  const date = (iso: string) => new Date(iso).toLocaleDateString(activeLocale(), { dateStyle: 'medium' });

  const act = async (c: ContractRow, action: 'skip' | 'pause' | 'resume' | 'cancel') => {
    setBusy(c._id + action); setMessage(''); setConfirm('');
    try { await apiSubscriptionAction(store.storeId, c._id, action); q.retry(); }
    catch (e: unknown) { setMessage(errorMessage(e, ts('sub.error_action', 'That did not work'))); }
    finally { setBusy(''); }
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <meta name="robots" content="noindex" />
      <h1 className="mb-2 text-2xl font-semibold">{ts('sub.my_title', 'My subscriptions')}</h1>
      <p className="mb-6 text-sm opacity-70">{ts('sub.my_intro', 'Your deliveries. Each one is an order you pay like any other.')}</p>
      {!signedIn && <p className="text-sm"><Link to="/login" className="underline">{ts('sub.signin', 'Sign in')}</Link> {ts('sub.signin_see', 'to see your subscriptions.')}</p>}
      {message && <p role="alert" className="mb-4 text-sm text-red-600">{message}</p>}
      {signedIn && q.loading && <p aria-busy="true" className="text-sm opacity-70">{ts('common.loading', 'Loading...')}</p>}
      {signedIn && q.error && <p role="alert" className="text-sm text-red-600">{ts('sub.load_error', 'Could not load your subscriptions.')} <button type="button" className="underline" onClick={q.retry}>{ts('sub.retry', 'Try again')}</button></p>}
      {signedIn && !q.loading && !q.error && (q.data ?? []).length === 0 && <p className="text-sm opacity-70">{ts('sub.none', 'You have no subscriptions yet. Look for Subscribe & save on a product page.')}</p>}
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {(q.data ?? []).map((c) => (
          <li key={c._id} className="rounded-xl border border-current/20 p-4 text-sm">
            <p className="m-0 font-medium">{c.terms.name} <span className="font-normal opacity-70">· {every(c.terms)}</span></p>
            <p className="m-0 mt-1 opacity-80">
              {c.status === 'active' ? ts('sub.next', 'Next order: {{d}}', { d: date(c.nextBillingAt) })
                : c.status === 'paused' ? ts('sub.paused', 'Paused') : c.status === 'completed' ? ts('sub.completed', 'Completed') : ts('sub.cancelled', 'Cancelled')}
              {c.status === 'paused' && c.pausedReason ? ` · ${c.pausedReason}` : ''}
            </p>
            {c.lastOrderId && <Link to={`/orders/${c.lastOrderId}`} className="mt-1 inline-block underline">{ts('sub.last_order', 'View last order')}</Link>}
            {(c.status === 'active' || c.status === 'paused') && (
              <div className="mt-3 flex flex-wrap gap-2">
                {c.status === 'active' && <button type="button" className={btnCls} disabled={!!busy} onClick={() => void act(c, 'skip')}>{ts('sub.skip', 'Skip next')}</button>}
                {c.status === 'active' && <button type="button" className={btnCls} disabled={!!busy} onClick={() => void act(c, 'pause')}>{ts('sub.pause', 'Pause')}</button>}
                {c.status === 'paused' && <button type="button" className={btnCls} disabled={!!busy} onClick={() => void act(c, 'resume')}>{ts('sub.resume', 'Resume')}</button>}
                {confirm === c._id
                  ? <button type="button" className={btnCls} disabled={!!busy} onClick={() => void act(c, 'cancel')}>{ts('sub.confirm_cancel', 'Yes, cancel it')}</button>
                  : <button type="button" className={btnCls} disabled={!!busy} onClick={() => setConfirm(c._id)}>{ts('sub.cancel', 'Cancel subscription')}</button>}
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
