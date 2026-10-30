import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { TokenStorage } from '@/api/services/auth';
import {
  apiChangePlan, apiJoinPlan, apiMembershipAction, apiMyMemberships, apiPublicPlans,
  type MySubscription, type PublicPlan,
} from '@/api/services/memberships';

const msg = (e: any, d: string) => e?.response?.data?.message ?? e?.message ?? d;
const LIVE = ['trialing', 'active', 'past_due', 'paused'];

/** Theme-neutral memberships page (route key `memberships`): plans, own memberships, cancel / pause / resume / upgrade. */
export function DefaultMembershipsPage() {
  const { store } = useStorefront();
  const storeId = store.storeId;
  const signedIn = !!TokenStorage.getToken();
  const [plans, setPlans] = useState<PublicPlan[] | null>(null);
  const [subs, setSubs] = useState<MySubscription[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setPlans(await apiPublicPlans(storeId));
      if (signedIn) setSubs(await apiMyMemberships(storeId));
    } catch (e: any) {
      setPlans([]);
      setError(msg(e, 'Could not load memberships'));
    }
  }, [storeId, signedIn]);
  useEffect(() => { void load(); }, [load]);

  async function run(fn: () => Promise<unknown>, done?: string) {
    setBusy(true); setError(null); setNote(null);
    try { await fn(); if (done) setNote(done); await load(); } catch (e: any) { setError(msg(e, 'Something went wrong')); } finally { setBusy(false); }
  }

  const planOf = (id: string) => plans?.find((p) => p._id === id);
  const price = (p: PublicPlan) => (p.type === 'free' ? 'Free' : `${p.currency} ${p.amount}${p.type === 'recurring' ? ` / ${p.intervalCount > 1 ? p.intervalCount + ' ' : ''}${p.interval}` : ' one-time'}`);
  const btn = 'rounded-lg border border-current/40 px-3 py-1.5 text-sm disabled:opacity-50';

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <meta name="robots" content="noindex" />
      <h1 className="text-2xl font-semibold mb-6">Memberships</h1>
      {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
      {note && <p role="status" className="mb-4 text-sm">{note}</p>}
      {plans === null && <p aria-busy="true" className="text-sm opacity-70">Loading...</p>}

      {subs.length > 0 && (
        <section className="mb-8">
          <h2 className="font-medium mb-3">Your memberships</h2>
          <ul className="flex flex-col gap-3">
            {subs.map((s) => {
              const p = planOf(s.planId);
              const upgrades = (plans ?? []).filter((x) => p && x.type === 'recurring' && x._id !== s.planId);
              return (
                <li key={s._id} className="rounded-xl border border-current/20 p-4 text-sm">
                  <p className="font-medium">{p?.name ?? 'Plan'} <span className="opacity-60 capitalize">· {s.status.replace('_', ' ')}</span></p>
                  {s.awaitingFirstPayment && <p className="opacity-70">Waiting for the store to confirm your payment.</p>}
                  {s.currentPeriodEnd && <p className="opacity-70">{s.cancelAtPeriodEnd ? 'Ends' : 'Renews'} on {new Date(s.currentPeriodEnd).toLocaleDateString()}</p>}
                  {s.amountDue > 0 && <p className="opacity-70">Upgrade amount due: {p?.currency} {s.amountDue}</p>}
                  {LIVE.includes(s.status) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {s.status === 'active' && <button className={btn} disabled={busy} onClick={() => void run(() => apiMembershipAction(storeId, s._id, 'pause'))}>Pause</button>}
                      {s.status === 'paused' && <button className={btn} disabled={busy} onClick={() => void run(() => apiMembershipAction(storeId, s._id, 'resume'))}>Resume</button>}
                      {!s.cancelAtPeriodEnd && <button className={btn} disabled={busy} onClick={() => void run(() => apiMembershipAction(storeId, s._id, 'cancel'), 'Cancellation saved. Access continues until the end of the period.')}>Cancel</button>}
                      {s.status === 'active' && upgrades.map((u) => (
                        <button key={u._id} className={btn} disabled={busy} onClick={() => void run(async () => { const r = await apiChangePlan(storeId, s._id, u._id); setNote(r.effective === 'now' ? `Switched. Amount due now: ${r.amountDue}` : 'Your plan will change at the end of this period.'); })}>
                          Switch to {u.name}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {plans && plans.length > 0 && (
        <section>
          <h2 className="font-medium mb-3">Available plans</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {plans.map((p) => {
              const has = subs.some((s) => s.planId === p._id && LIVE.includes(s.status));
              return (
                <li key={p._id} className="rounded-xl border border-current/20 p-4 text-sm flex flex-col gap-2">
                  <p className="font-medium">{p.name}</p>
                  <p>{price(p)}{p.trialDays > 0 ? ` · ${p.trialDays}-day trial` : ''}</p>
                  {p.description && <p className="opacity-70">{p.description}</p>}
                  {p.benefits.length > 0 && <ul className="list-disc ps-5">{p.benefits.map((b) => <li key={b}>{b}</li>)}</ul>}
                  {signedIn
                    ? <button className={`${btn} mt-auto`} disabled={busy || has} onClick={() => void run(() => apiJoinPlan(storeId, p._id), p.type === 'free' ? 'You are in.' : 'Request sent. The store will confirm your payment.')}>{has ? 'Joined' : 'Join'}</button>
                    : <Link to="/login" className={`${btn} mt-auto text-center`}>Sign in to join</Link>}
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {plans?.length === 0 && !error && <p className="text-sm opacity-70">This store has no membership plans yet.</p>}
    </main>
  );
}
