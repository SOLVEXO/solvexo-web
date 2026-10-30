import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '@/api/errorMessage';
import { Link } from 'react-router-dom';
import { useRenewalInvoices } from './core/useRenewalInvoices';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { TokenStorage } from '@/api/services/auth';
import {
  apiChangePlan, apiJoinPlan, apiMembershipAction, apiMyMemberships, apiPublicPlans,
  type MySubscription, type PublicPlan,
} from '@/api/services/memberships';

const msg = errorMessage;
const LIVE = ['trialing', 'active', 'past_due', 'paused'];

/** "Payments due" for the neutral fallback page: inherits the page colours. */
function DefaultRenewalPayments({ storeId }: { storeId: string }) {
  const r = useRenewalInvoices(storeId);
  const [forms, setForms] = useState<Record<string, { file: File | null; reference: string; senderName: string }>>({});
  const form = (id: string) => forms[id] ?? { file: null, reference: '', senderName: '' };
  const patch = (id: string, p: Partial<{ file: File | null; reference: string; senderName: string }>) => setForms((f) => ({ ...f, [id]: { ...form(id), ...p } }));
  const open = r.invoices.filter((i) => i.status !== 'paid');
  const field = 'w-full rounded-lg border border-current/30 bg-transparent px-3 py-2 text-sm';
  const label = (s: string) => (s === 'submitted' ? 'Receipt sent' : s === 'overdue' ? 'Overdue' : 'Awaiting payment');
  if (r.loading) return <p aria-busy="true" className="text-sm opacity-70">Loading...</p>;
  if (r.loadFailed) return <p role="alert" className="text-sm text-red-600">We could not load your payments. <button className="underline" onClick={r.retry}>Try again</button></p>;
  if (open.length === 0) return null;
  return (
    <section className="mb-8"><h2 className="font-medium mb-3">Payments due</h2>
      <ul className="flex flex-col gap-3">
        {open.map((i) => {
          const f = form(i.id);
          const err = r.formError?.id === i.id ? r.formError.message : null;
          return (
            <li key={i.id} className="rounded-xl border border-current/20 p-4 text-sm flex flex-col gap-3">
              <p className="font-medium">{i.planName} <span className="opacity-60">· {label(i.status)}</span></p>
              <p className="opacity-70">Amount: {i.currency} {i.amount} · Due {new Date(i.dueAt).toLocaleDateString()}</p>
              {i.status === 'submitted' ? (
                <div className="flex flex-col gap-2"><p>Your receipt is being reviewed by the store.</p>{i.hasProof && <button className="rounded-lg border border-current/40 px-3 py-1.5 self-start" onClick={() => void r.openReceipt(i.id)}>View my receipt</button>}</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {i.rejectionReason && <p role="alert" className="text-red-600">The store could not confirm it: {i.rejectionReason}</p>}
                  <p className="opacity-70">Pay the store directly, then upload your receipt here. Your access continues after the store confirms.</p>
                  <div><p className="font-medium">How to pay</p>
                    {i.instructions.length === 0 ? <p className="opacity-70">The store has not added payment details yet. Please contact the store.</p> : <ul className="flex flex-col gap-2">{i.instructions.map((x, k) => <li key={k}><b>{x.label}</b><span className="block whitespace-pre-line opacity-70">{x.details}</span></li>)}</ul>}
                  </div>
                  <label>Transaction reference<input className={field} maxLength={100} value={f.reference} onChange={(e) => patch(i.id, { reference: e.target.value })} /></label>
                  <label>Name of sender (optional)<input className={field} maxLength={100} value={f.senderName} onChange={(e) => patch(i.id, { senderName: e.target.value })} /></label>
                  <label>Receipt (JPG, PNG, WebP or PDF, up to 10 MB)<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="block mt-1" onChange={(e) => patch(i.id, { file: e.target.files?.[0] ?? null })} /></label>
                  {err && <p role="alert" className="text-red-600">{err}</p>}
                  {r.sentId === i.id && !err && <p role="status">Receipt sent. The store will confirm your payment.</p>}
                  <button className="rounded-lg border border-current font-medium px-4 py-2 self-start disabled:opacity-50" disabled={r.busyId === i.id || i.submissionsLeft <= 0} onClick={() => void r.submit(i.id, f, { missing: 'Add a receipt or a transaction reference.', type: 'The receipt must be a JPG, PNG, WebP or PDF file.', size: 'The receipt is larger than 10 MB.' })}>Send receipt</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

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
    } catch (e) {
      setPlans([]);
      setError(msg(e, 'Could not load memberships'));
    }
  }, [storeId, signedIn]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- loads once per key; the state is only set after the request resolves
  useEffect(() => { void load(); }, [load]);

  async function run(fn: () => Promise<unknown>, done?: string) {
    setBusy(true); setError(null); setNote(null);
    try { await fn(); if (done) setNote(done); await load(); } catch (e) { setError(msg(e, 'Something went wrong')); } finally { setBusy(false); }
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

      {signedIn && <DefaultRenewalPayments storeId={storeId} />}
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
