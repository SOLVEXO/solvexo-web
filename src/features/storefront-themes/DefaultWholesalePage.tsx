import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { errorMessage } from '@/api/errorMessage';
import { TokenStorage } from '@/api/services/auth';
import {
  apiApplyForWholesale, apiGetWholesaleStanding, apiQuickOrderResolve, type QuickOrderLine, type WholesaleStanding,
} from '@/api/services/b2bStorefront';
import { useCartContext } from '@/contexts/CartContext';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { parseQuickOrderText, termsText } from './core/checkout/b2bTerms';

const inputCls = 'w-full rounded-lg border border-current/30 bg-transparent px-3 py-2 text-sm';
const btnCls = 'rounded-lg border border-current/40 px-4 py-2 text-sm font-medium disabled:opacity-50';

/** Theme-neutral wholesale page (route key `wholesale`): apply for a company account, see its status, and place a quick order by SKU. */
export function DefaultWholesalePage() {
  const { store } = useStorefront();
  const signedIn = !!TokenStorage.getToken();
  const [standing, setStanding] = useState<WholesaleStanding | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiGetWholesaleStanding(store.storeId).then((s) => { setStanding(s); setError(null); }).catch((e: unknown) => setError(errorMessage(e, 'Could not load your wholesale account')));
  }, [store.storeId]);
  useEffect(() => { if (signedIn) load(); }, [signedIn, load]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <meta name="robots" content="noindex" />
      <h1 className="mb-2 text-2xl font-semibold">Wholesale</h1>
      <p className="mb-6 text-sm opacity-70">Buy in bulk at wholesale prices with your company account.</p>
      {error && (
        <p role="alert" className="mb-4 text-sm text-red-600">{error} <button type="button" className="underline" onClick={load}>Retry</button></p>
      )}
      {!signedIn && <p className="text-sm"><Link to="/login" className="underline">Sign in</Link> or <Link to="/register" className="underline">create an account</Link> to apply for wholesale.</p>}
      {signedIn && !standing && !error && <p aria-busy="true" className="text-sm opacity-70">Loading...</p>}
      {standing?.status === 'approved' && <Approved standing={standing} storeId={store.storeId} currency={store.baseCurrency ?? 'USD'} />}
      {standing?.status === 'pending' && <p role="status" className="rounded-xl border border-current/20 p-4 text-sm">Your application for <strong>{standing.companyName}</strong> is waiting for review. The store will contact you by email.</p>}
      {(standing?.status === 'none' || standing?.status === 'rejected') && (
        <>
          {standing.status === 'rejected' && (
            <p role="status" className="mb-4 rounded-xl border border-current/20 p-4 text-sm">Your application for <strong>{standing.companyName}</strong> was not approved{standing.decisionNote ? `: ${standing.decisionNote}` : '.'} You can apply again below.</p>
          )}
          <ApplyForm storeId={store.storeId} onDone={load} />
        </>
      )}
    </main>
  );
}

function ApplyForm({ storeId, onDone }: { storeId: string; onDone: () => void }) {
  const [f, setF] = useState({ companyName: '', taxId: '', phone: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.companyName.trim()) { setErr('Enter your company name'); return; }
    setBusy(true); setErr(null);
    try { await apiApplyForWholesale(storeId, { companyName: f.companyName.trim(), taxId: f.taxId.trim() || undefined, phone: f.phone.trim() || undefined, message: f.message.trim() || undefined }); onDone(); }
    catch (x) { setErr(errorMessage(x, 'Could not send your application')); } finally { setBusy(false); }
  }
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4" noValidate>
      <h2 className="text-lg font-semibold">Apply for a wholesale account</h2>
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      <label className="flex flex-col gap-1 text-sm">Company name<input className={inputCls} required maxLength={120} value={f.companyName} onChange={set('companyName')} /></label>
      <label className="flex flex-col gap-1 text-sm">Tax number (optional)<input className={inputCls} maxLength={60} value={f.taxId} onChange={set('taxId')} /></label>
      <label className="flex flex-col gap-1 text-sm">Phone (optional)<input className={inputCls} type="tel" maxLength={40} value={f.phone} onChange={set('phone')} /></label>
      <label className="flex flex-col gap-1 text-sm">Tell us about your business (optional)<textarea className={inputCls} rows={4} maxLength={1000} value={f.message} onChange={set('message')} /></label>
      <div><button type="submit" className={btnCls} disabled={busy}>{busy ? 'Sending...' : 'Send application'}</button></div>
    </form>
  );
}

function Approved({ standing, storeId, currency }: { standing: Extract<WholesaleStanding, { status: 'approved' }>; storeId: string; currency: string }) {
  const terms = termsText(standing.paymentTerms);
  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border border-current/20 p-4 text-sm">
        <p className="m-0 font-semibold">{standing.companyName} · {standing.locationName}</p>
        <p className="m-0 mt-1 opacity-70">
          {standing.hasCatalog ? 'Wholesale prices apply to your orders.' : 'Retail prices apply to your orders.'}
          {terms ? ` Payment terms: ${terms}.` : ''}{standing.taxExempt ? ' Your company is tax exempt.' : ''}
        </p>
      </section>
      <QuickOrder storeId={storeId} currency={currency} />
      <p className="text-sm"><Link to="/orders" className="underline">Your orders</Link> · reorder any past order from its page.</p>
    </div>
  );
}

function QuickOrder({ storeId, currency }: { storeId: string; currency: string }) {
  const { addToCart } = useCartContext();
  const [text, setText] = useState('');
  const [lines, setLines] = useState<QuickOrderLine[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const money = (n: number) => { try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n); } catch { return `${currency} ${n}`; } };
  const good = (lines ?? []).filter((l) => l.ok);

  async function check() {
    const rows = parseQuickOrderText(text);
    if (rows.length === 0) { setMsg('Enter at least one SKU and quantity.'); return; }
    setBusy(true); setMsg(null);
    try { setLines((await apiQuickOrderResolve(storeId, rows)).lines); } catch (e) { setMsg(errorMessage(e, 'Could not check your list')); } finally { setBusy(false); }
  }
  async function addAll() {
    setBusy(true); setMsg(null);
    let added = 0;
    for (const l of good) if (l.productId && l.variantId && await addToCart(l.productId, l.variantId, l.type ?? 'physical', l.quantity)) added += 1;
    setBusy(false);
    setMsg(added === good.length ? `${added} item(s) added to your cart.` : `${added} of ${good.length} item(s) added. Check your cart.`);
  }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200_000) { setMsg('That file is too large for a quick order (200 KB max).'); return; }
    void file.text().then((t) => { setText(t); setLines(null); });
    e.target.value = '';
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="quick-order-h">
      <h2 id="quick-order-h" className="text-lg font-semibold">Quick order</h2>
      <p className="m-0 text-sm opacity-70">One item per line: SKU and quantity, for example <code>AB-100, 12</code>. You can also upload a CSV file.</p>
      <label className="flex flex-col gap-1 text-sm">SKUs and quantities<textarea className={`${inputCls} font-mono`} rows={6} value={text} onChange={(e) => { setText(e.target.value); setLines(null); }} /></label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={btnCls} disabled={busy || !text.trim()} onClick={() => void check()}>{busy && !lines ? 'Checking...' : 'Check list'}</button>
        <label className="text-sm underline"><input type="file" accept=".csv,text/csv,text/plain" className="sr-only" onChange={onFile} />Upload CSV</label>
      </div>
      {msg && <p role="status" className="m-0 text-sm">{msg}</p>}
      {lines && (
        <>
          <table className="w-full text-left text-sm">
            <thead><tr className="opacity-70"><th className="py-1 pr-2">SKU</th><th className="py-1 pr-2">Product</th><th className="py-1 pr-2">Qty</th><th className="py-1">Price each</th></tr></thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={`${l.sku}-${i}`} className="border-t border-current/10 align-top">
                  <td className="py-1 pr-2 font-mono">{l.sku || '—'}</td>
                  <td className="py-1 pr-2">{l.name ?? '—'}{!l.ok && <div role="alert" className="text-xs text-red-600">{l.error}{l.suggested ? ` Try ${l.suggested}.` : ''}</div>}</td>
                  <td className="py-1 pr-2">{l.quantity}</td>
                  <td className="py-1">{l.ok && l.unitPrice != null ? money(l.unitPrice) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div><button type="button" className={btnCls} disabled={busy || good.length === 0} onClick={() => void addAll()}>{busy ? 'Adding...' : `Add ${good.length} item(s) to cart`}</button></div>
        </>
      )}
    </section>
  );
}
