import { useState } from 'react';
import client from '@/api/client';
import { errorMessage } from '@/api/errorMessage';
import { useKeyedLoad } from '@/components/comman/dashboard/useKeyedLoad';
import { Button } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';

interface Overview {
  activeAccess: number; flaggedAccess: number; last30Days: { deliveries: number; deniedOrFailed: number }; storesWithDigitalDisabled: number;
}
const errText = (e: unknown) => errorMessage(e);
const input = 'h-9 w-full rounded-lg border border-bone bg-white px-3 text-[13px] text-carbon outline-none focus:ring-2 focus:ring-brand-orange/30';

/** Platform side of digital delivery: aggregate counters only (no customer data) and two safety actions. */
export function AdminDigital() {
  const toast = useToast();
  const res = useKeyedLoad<Overview>(() => client.get('/api/admin/digital/overview') as Promise<Overview>, 'admin-digital');
  const data = res.data;
  const error = res.error || null;
  const load = res.retry;
  const [storeId, setStoreId] = useState('');
  const [reason, setReason] = useState('');
  const [productId, setProductId] = useState('');
  const [busy, setBusy] = useState(false);


  async function run(fn: () => Promise<unknown>, done: string) {
    setBusy(true);
    try { await fn(); toast.success(done); load(); } catch (e) { toast.error(errText(e)); } finally { setBusy(false); }
  }
  const cards: [string, number][] = data ? [
    ['Active access records', data.activeAccess], ['Flagged for unusual activity', data.flaggedAccess],
    ['Deliveries (30 days)', data.last30Days.deliveries], ['Denied or failed (30 days)', data.last30Days.deniedOrFailed],
    ['Stores with digital delivery paused', data.storesWithDigitalDisabled],
  ] : [];

  return (
    <div className="flex flex-col gap-5 px-4 py-6 sm:px-7">
      <p className="m-0 max-w-2xl text-[13px] text-slate">Counters are platform-wide. This page never shows a store's customers, files or sales money.</p>
      {error && <p role="alert" className="m-0 text-[13px] text-error">{error} <button className="underline" onClick={load}>Retry</button></p>}
      {!data && !error && <p aria-busy="true" className="m-0 text-[13px] text-slate">Loading...</p>}
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 md:grid-cols-3">
        {cards.map(([k, v]) => <li key={k} className="surface-panel rounded-xl p-3"><p className="m-0 text-[11px] text-slate">{k}</p><p className="m-0 text-[22px] font-semibold text-carbon">{v}</p></li>)}
      </ul>

      <section className="surface-panel flex flex-col gap-3 rounded-xl p-4">
        <h3 className="m-0 text-[14px] font-semibold text-carbon">Pause or restore digital delivery for a store</h3>
        <label className="text-[12px] text-slate">Store ID<input className={input} value={storeId} onChange={(e) => setStoreId(e.target.value.trim())} /></label>
        <label className="text-[12px] text-slate">Reason (kept on the store)<input className={input} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
        <div className="flex gap-2">
          <Button variant="danger" size="sm" disabled={busy || !storeId} onClick={() => { if (window.confirm('Pause downloads, course media and license checks for this store?')) void run(() => client.post(`/api/admin/digital/stores/${storeId}/disable`, { disabled: true, reason }), 'Digital delivery paused'); }}>Pause delivery</Button>
          <Button variant="outline" size="sm" disabled={busy || !storeId} onClick={() => void run(() => client.post(`/api/admin/digital/stores/${storeId}/disable`, { disabled: false }), 'Digital delivery restored')}>Restore</Button>
        </div>
      </section>

      <section className="surface-panel flex flex-col gap-3 rounded-xl p-4">
        <h3 className="m-0 text-[14px] font-semibold text-carbon">Takedown a digital product (piracy / abuse)</h3>
        <p className="m-0 text-[12px] text-slate">Revokes every buyer's access to this product and archives it. This cannot be undone from here.</p>
        <label className="text-[12px] text-slate">Product ID<input className={input} value={productId} onChange={(e) => setProductId(e.target.value.trim())} /></label>
        <div><Button variant="danger" size="sm" disabled={busy || !productId} onClick={() => { if (window.confirm('Revoke all access and archive this product?')) void run(() => client.post(`/api/admin/digital/products/${productId}/takedown`), 'Product taken down'); }}>Take down product</Button></div>
      </section>
    </div>
  );
}
