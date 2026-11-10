import { useCallback, useEffect, useState } from 'react';
import { Copy, Plus, RotateCw, Warehouse } from 'lucide-react';
import { useStoreWorkspace, hasNavPermission } from '@/components/layouts/StoreLayout';
import { SkeletonBox, EmptyState, Badge, Input } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import { TokenStorage } from '@/api/services/auth';
import type { BadgeColor } from '@/types';
import {
  apiCancelFulfillmentRequest, apiCreateFulfillmentService, apiDeleteFulfillmentService, apiListFulfillmentRequests,
  apiListFulfillmentServices, apiRetryFulfillmentRequest, apiRotateFulfillmentSecret, apiUpdateFulfillmentService,
  type FulfillmentProviderKind, type FulfillmentRequestRow, type FulfillmentRequestStatus, type FulfillmentServiceRow,
} from '@/api/services/fulfillmentServices';

const STATUS_COLOR: Record<FulfillmentRequestStatus, BadgeColor> = {
  pending: 'gray', sent: 'blue', accepted: 'blue', shipped: 'green', delivered: 'green', cancelled: 'gray', failed: 'red',
};
const STATUS_LABEL: Record<FulfillmentRequestStatus, string> = {
  pending: 'Waiting to send', sent: 'Sent', accepted: 'Accepted', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', failed: 'Failed',
};
const OPEN: FulfillmentRequestStatus[] = ['pending', 'sent', 'accepted'];
const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const errText = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

/** Third-party fulfilment services (3PL / warehouse): connect one, see the orders handed to it and what it reported back.
 *  The service gets a signed request per order and calls back (accepted / shipped with tracking / stock) with the same secret. */
export default function FulfillmentTab() {
  const { storeId } = useStoreWorkspace();
  const toast = useToast();
  const user = TokenStorage.getUser<{ role?: 'admin' | 'seller' | 'staff' | 'user'; permissions?: string[] }>();
  const canManage = hasNavPermission(user as never, ['fulfillment.manage']);
  const [services, setServices] = useState<FulfillmentServiceRow[]>([]);
  const [requests, setRequests] = useState<FulfillmentRequestRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<{ name: string; provider: FulfillmentProviderKind; endpointUrl: string; autoRoute: boolean }>({ name: '', provider: 'generic_http', endpointUrl: '', autoRoute: false });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [secret, setSecret] = useState<{ name: string; id: string; value: string } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<FulfillmentServiceRow | null>(null);
  const [busy, setBusy] = useState('');

  const load = useCallback(() => {
    if (!storeId) return;
    setLoading(true); setError('');
    Promise.all([apiListFulfillmentServices(storeId), apiListFulfillmentRequests(storeId, { page, limit: 15, status: status || undefined })])
      .then(([s, r]) => { setServices(s); setRequests(r.items); setTotal(r.total); })
      .catch((e: unknown) => setError(errText(e, 'Could not load fulfilment services.')))
      .finally(() => setLoading(false));
  }, [storeId, page, status]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setSaving(true); setFormError('');
    try {
      const s = await apiCreateFulfillmentService(storeId, { name: form.name.trim(), provider: form.provider, endpointUrl: form.provider === 'generic_http' ? form.endpointUrl.trim() : undefined, autoRoute: form.autoRoute });
      setAdding(false); setForm({ name: '', provider: 'generic_http', endpointUrl: '', autoRoute: false });
      setSecret({ name: s.name, id: s._id, value: s.secret });
      load();
    } catch (e: unknown) { setFormError(errText(e, 'Could not connect the service.')); } finally { setSaving(false); }
  };

  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    try { await fn(); toast.success(ok); load(); } catch (e: unknown) { toast.error(errText(e, 'That did not work.')); } finally { setBusy(''); }
  };
  const callbackUrl = (id: string) => `${(import.meta.env.VITE_API_URL as string | undefined) ?? ''}/api/fulfillment-callbacks/${id}`;
  const copy = (text: string) => { void navigator.clipboard?.writeText(text).then(() => toast.success('Copied')); };
  const nameOf = (id: string) => services.find((s) => s._id === id)?.name ?? 'Removed service';

  if (error) return <div className="px-4 md:px-7 pt-5 pb-10"><EmptyState icon={<Warehouse size={22} />} title="Could not load" description={error} action={{ label: 'Retry', onClick: load }} /></div>;

  return (
    <div className="px-4 lg:px-7 pt-5 pb-10 w-full flex flex-col gap-6">
      <section aria-labelledby="ff-services">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 id="ff-services" className="text-[15px] font-semibold text-charcoal m-0">Fulfilment services</h2>
            <p className="text-[12.5px] text-slate m-0">A warehouse or 3PL that packs and ships your orders. Each one gets its own stock location.</p>
          </div>
          {canManage && <Button size="sm" icon={<Plus size={14} />} onClick={() => { setFormError(''); setAdding(true); }}>Connect service</Button>}
        </div>
        {loading && !services.length ? <SkeletonBox className="h-24 w-full" /> : services.length === 0 ? (
          <EmptyState icon={<Warehouse size={22} />} title="No fulfilment service connected" description="Connect a warehouse or 3PL to send it your paid orders and receive tracking and stock back." />
        ) : (
          <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,380px),1fr))]">
            {services.map((s) => (
              <div key={s._id} className="rounded-2xl border border-border-soft p-4 flex flex-col gap-2 bg-white">
                <div className="flex items-center gap-2">
                  <Warehouse size={16} aria-hidden />
                  <span className="font-semibold text-[14px] text-charcoal truncate">{s.name}</span>
                  <Badge color={s.status === 'active' ? 'green' : 'gray'} size="sm">{s.status === 'active' ? 'Active' : 'Off'}</Badge>
                  {s.provider === 'mock' && <Badge color="yellow" size="sm">Test</Badge>}
                </div>
                <p className="text-[12px] text-slate m-0 break-all">{s.provider === 'mock' ? 'Test mode (nothing is sent anywhere)' : s.endpointUrl}</p>
                <p className="text-[12px] text-slate m-0">Secret {s.secretHint} · last reply {when(s.lastCallbackAt)}</p>
                <div className="flex items-center gap-1.5 text-[12px] text-slate">
                  <span className="truncate">Callback: {callbackUrl(s._id)}</span>
                  <button type="button" aria-label="Copy callback address" className="cursor-pointer" onClick={() => copy(callbackUrl(s._id))}><Copy size={13} /></button>
                </div>
                {canManage && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <label className="flex items-center gap-1.5 text-[12.5px] text-charcoal cursor-pointer">
                      <input type="checkbox" className="accent-brand-orange" checked={s.autoRoute} disabled={busy === `a${s._id}`}
                        onChange={(e) => void run(`a${s._id}`, () => apiUpdateFulfillmentService(storeId, s._id, { autoRoute: e.target.checked }), 'Saved')} /> Send paid orders automatically
                    </label>
                    <Button size="sm" variant="secondary" loading={busy === `s${s._id}`} onClick={() => void run(`s${s._id}`, () => apiUpdateFulfillmentService(storeId, s._id, { status: s.status === 'active' ? 'disabled' : 'active' }), 'Saved')}>{s.status === 'active' ? 'Switch off' : 'Switch on'}</Button>
                    <Button size="sm" variant="secondary" loading={busy === `r${s._id}`} onClick={() => void run(`r${s._id}`, async () => { const r = await apiRotateFulfillmentSecret(storeId, s._id); setSecret({ name: s.name, id: s._id, value: r.secret }); }, 'New secret created')}>New secret</Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirmRemove(s)}>Remove</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="ff-requests">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 id="ff-requests" className="text-[15px] font-semibold text-charcoal m-0">Requests</h2>
          <select aria-label="Filter by status" className="h-9 rounded-lg border border-border-soft px-2 text-[13px]" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {(Object.keys(STATUS_LABEL) as FulfillmentRequestStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
          </select>
        </div>
        {loading && !requests.length ? <SkeletonBox className="h-32 w-full" /> : requests.length === 0 ? (
          <EmptyState icon={<Warehouse size={22} />} title="No requests yet" description="Open an order and send it to a service, or switch on automatic sending." />
        ) : (
          <ul className="flex flex-col gap-2 list-none p-0 m-0">
            {requests.map((r) => (
              <li key={r._id} className="rounded-xl border border-border-soft bg-white p-3 flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[13.5px] text-charcoal">Order #{r.orderNumber}</span>
                  <Badge color={STATUS_COLOR[r.status]} size="sm">{STATUS_LABEL[r.status]}</Badge>
                  <span className="text-[12px] text-slate">{nameOf(r.serviceId)} · {when(r.createdAt)}</span>
                </div>
                <p className="text-[12.5px] text-slate m-0">{r.items.map((i) => `${i.quantity} × ${i.title || i.sku || 'item'}`).join(', ')}</p>
                {r.tracking?.trackingNumber && <p className="text-[12.5px] text-charcoal m-0">{r.tracking.carrier ?? 'Tracking'}: {r.tracking.trackingUrl ? <a className="underline" href={r.tracking.trackingUrl} target="_blank" rel="noreferrer">{r.tracking.trackingNumber}</a> : r.tracking.trackingNumber}</p>}
                {r.lastError && (r.status === 'failed' || r.status === 'pending') && <p role="alert" className="text-[12.5px] text-error m-0">{r.lastError}</p>}
                {canManage && (r.status === 'failed' || OPEN.includes(r.status)) && (
                  <div className="flex gap-2 pt-0.5">
                    {r.status === 'failed' && <Button size="sm" variant="secondary" icon={<RotateCw size={13} />} loading={busy === `t${r._id}`} onClick={() => void run(`t${r._id}`, () => apiRetryFulfillmentRequest(storeId, r._id), 'Sending again')}>Try again</Button>}
                    {OPEN.includes(r.status) && <Button size="sm" variant="outline" loading={busy === `c${r._id}`} onClick={() => void run(`c${r._id}`, () => apiCancelFulfillmentRequest(storeId, r._id), 'Request cancelled')}>Cancel request</Button>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {total > 15 && (
          <div className="flex items-center justify-end gap-2 pt-3">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="text-[12.5px] text-slate">Page {page} of {Math.max(1, Math.ceil(total / 15))}</span>
            <Button size="sm" variant="secondary" disabled={page * 15 >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </section>

      {adding && (
        <Modal title="Connect a fulfilment service" onClose={() => setAdding(false)} width={520} mobileSheet
          footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button><Button onClick={create} loading={saving} disabled={!form.name.trim() || (form.provider === 'generic_http' && !form.endpointUrl.trim())}>Connect</Button></div>}>
          <div className="flex flex-col gap-3">
            <Input label="Name" value={form.name} maxLength={80} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <label className="flex flex-col gap-1 text-[13px] text-charcoal">Type
              <select className="h-10 rounded-lg border border-border-soft px-2" value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value as FulfillmentProviderKind }))}>
                <option value="generic_http">Warehouse / 3PL (signed web request)</option>
                <option value="mock">Test mode (sends nothing)</option>
              </select>
            </label>
            {form.provider === 'generic_http' && <Input label="Their https address that receives orders" value={form.endpointUrl} maxLength={500} onChange={(e) => setForm((f) => ({ ...f, endpointUrl: e.target.value }))} />}
            <label className="flex items-center gap-2 text-[13px] text-charcoal cursor-pointer"><input type="checkbox" className="accent-brand-orange" checked={form.autoRoute} onChange={(e) => setForm((f) => ({ ...f, autoRoute: e.target.checked }))} /> Send paid orders to this service automatically</label>
            {formError && <p role="alert" className="text-[12.5px] text-error m-0">{formError}</p>}
          </div>
        </Modal>
      )}

      {secret && (
        <Modal title="Save this secret now" onClose={() => setSecret(null)} width={520} mobileSheet footer={<div className="flex justify-end"><Button onClick={() => setSecret(null)}>Done</Button></div>}>
          <div className="flex flex-col gap-3 text-[13px] text-charcoal">
            <p className="m-0">{secret.name} signs and verifies every message with this secret. It is shown only once.</p>
            <div className="flex items-center gap-2 rounded-lg border border-border-soft p-2 break-all font-mono text-[12.5px]"><span className="flex-1">{secret.value}</span><button type="button" aria-label="Copy secret" className="cursor-pointer" onClick={() => copy(secret.value)}><Copy size={14} /></button></div>
            <p className="m-0 text-slate">Callback address for the service: <span className="break-all">{callbackUrl(secret.id)}</span></p>
          </div>
        </Modal>
      )}

      {confirmRemove && (
        <Modal title={`Remove ${confirmRemove.name}?`} onClose={() => setConfirmRemove(null)} width={440} mobileSheet
          footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setConfirmRemove(null)}>Keep</Button><Button loading={busy === `d${confirmRemove._id}`} onClick={() => { const s = confirmRemove; setConfirmRemove(null); void run(`d${s._id}`, () => apiDeleteFulfillmentService(storeId, s._id), 'Service removed'); }}>Remove</Button></div>}>
          <p className="text-[13px] text-charcoal m-0">The service stops receiving orders. Past requests stay in the log. You cannot remove a service that still has open requests.</p>
        </Modal>
      )}
    </div>
  );
}
