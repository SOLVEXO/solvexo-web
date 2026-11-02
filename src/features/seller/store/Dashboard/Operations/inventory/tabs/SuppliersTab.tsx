import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus } from 'lucide-react';
import { useStoreWorkspace, hasNavPermission } from '@/components/layouts/StoreLayout';
import { SkeletonBox, EmptyState, Badge, Input, SearchInput } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { BulkImportButton } from '@/components/comman/bulk-import/BulkImportButton';
import { useToast } from '@/contexts/ToastContext';
import { TokenStorage } from '@/api/services/auth';
import { formatMoney } from '@/utils/currency';
import {
  apiListSuppliers, apiCreateSupplier, apiUpdateSupplier, apiGetSupplierDetail, type Supplier, type SupplierDetail,
} from '@/api/services/purchaseOrders';

type Form = { name: string; contactName: string; email: string; phone: string; address: string; city: string; country: string; leadTimeDays: string; paymentTerms: string; notes: string };
const EMPTY: Form = { name: '', contactName: '', email: '', phone: '', address: '', city: '', country: '', leadTimeDays: '', paymentTerms: '', notes: '' };
const TERMS = ['Cash on delivery', 'Advance payment', 'Net 7', 'Net 15', 'Net 30', 'Net 60'];
type Filter = 'all' | 'active' | 'archived';

const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—');
const optionText = (o: { value: string }[]) => (o.length ? ` — ${o.map(x => x.value).join(' / ')}` : '');

/** The people you buy stock from. Purchase orders and supplier returns pick from this list; archiving hides a supplier from
 *  those pickers without deleting its history. A supplier's own page shows what was bought from it. */
export default function SuppliersTab() {
  const { storeId, store } = useStoreWorkspace();
  const navigate = useNavigate();
  const toast = useToast();
  const currency = store?.baseCurrency ?? 'USD';
  const user = TokenStorage.getUser<{ role?: 'admin' | 'seller' | 'staff' | 'user'; permissions?: string[] }>();
  const canManage = hasNavPermission(user as never, ['purchase_orders.manage']);
  const [rows, setRows] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<Supplier | 'new' | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Supplier | null>(null);
  const [detail, setDetail] = useState<SupplierDetail | null>(null);
  const [detailError, setDetailError] = useState('');

  const load = useCallback(() => {
    apiListSuppliers(storeId)
      .then(res => { setRows(res.data); setError(''); })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load suppliers.'))
      .finally(() => setLoading(false));
  }, [storeId]);
  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({ all: rows.length, active: rows.filter(r => r.status === 'active').length, archived: rows.filter(r => r.status === 'archived').length }), [rows]);
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => (filter === 'all' || r.status === filter)
      && (!q || [r.name, r.contactName, r.email, r.phone, r.city, r.country].some(v => v?.toLowerCase().includes(q))));
  }, [rows, search, filter]);

  const openForm = (s: Supplier | 'new') => {
    setFormError('');
    setForm(s === 'new' ? EMPTY : {
      name: s.name, contactName: s.contactName ?? '', email: s.email ?? '', phone: s.phone ?? '', address: s.address ?? '',
      city: s.city ?? '', country: s.country ?? '', leadTimeDays: s.leadTimeDays != null ? String(s.leadTimeDays) : '', paymentTerms: s.paymentTerms ?? '', notes: s.notes ?? '',
    });
    setEditing(s);
  };
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const openDetail = (s: Supplier) => {
    setViewing(s); setDetail(null); setDetailError('');
    apiGetSupplierDetail(storeId, s._id).then(res => setDetail(res.data)).catch((err: unknown) => setDetailError(err instanceof Error ? err.message : 'Could not load this supplier.'));
  };

  const save = async () => {
    if (!form.name.trim()) return;
    const lead = form.leadTimeDays.trim();
    if (lead && (!/^\d+$/.test(lead) || Number(lead) > 365)) { setFormError('Lead time must be a whole number of days, 0 to 365.'); return; }
    setSaving(true); setFormError('');
    const text = {
      name: form.name.trim(), contactName: form.contactName.trim(), email: form.email.trim(), phone: form.phone.trim(),
      address: form.address.trim(), city: form.city.trim(), country: form.country.trim(), paymentTerms: form.paymentTerms.trim(), notes: form.notes.trim(),
    };
    try {
      if (editing === 'new') {
        // empty optional fields are left out so the server does not validate a blank email
        const clean = Object.fromEntries(Object.entries(text).filter(([k, v]) => k === 'name' || v !== '')) as { name: string };
        await apiCreateSupplier(storeId, { ...clean, ...(lead ? { leadTimeDays: Number(lead) } : {}) });
      } else if (editing) {
        await apiUpdateSupplier(storeId, editing._id, { ...text, ...(lead ? { leadTimeDays: Number(lead) } : {}) });
      }
      toast.success('Supplier saved');
      setEditing(null); setLoading(true); load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not save the supplier.');
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async (s: Supplier) => {
    setBusyId(s._id);
    try {
      await apiUpdateSupplier(storeId, s._id, { status: s.status === 'active' ? 'archived' : 'active' });
      setLoading(true); load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not update the supplier.');
    } finally {
      setBusyId(null);
    }
  };

  const chip = (f: Filter, label: string) => (
    <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f}
      className={`px-3 py-1.5 rounded-full border text-[12px] pointer-coarse:text-[13px] font-medium cursor-pointer ${filter === f ? 'border-brand-orange bg-brand-pale-orange text-brand-orange' : 'border-bone bg-white text-slate hover:bg-mist'}`}>
      {label} ({counts[f]})
    </button>
  );

  return (
    <div className="px-4 lg:px-7 pt-4 pb-8 flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="text-[12px] pointer-coarse:text-[13px] text-slate max-w-[520px]">The suppliers you buy stock from. Pick them on purchase orders and supplier returns. Open one to see what you bought from it.</p>
        {canManage && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <BulkImportButton
              entityLabel="suppliers"
              basePath={`/api/purchase-orders/${storeId}/suppliers`}
              onImported={() => { setLoading(true); load(); }}
              notes={['A supplier whose name already exists is skipped, never overwritten.']}
            />
            <Button size="sm" icon={<Plus size={13} />} onClick={() => openForm('new')}>Add supplier</Button>
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">{chip('all', 'All')}{chip('active', 'Active')}{chip('archived', 'Archived')}</div>
          <div className="sm:w-[280px]"><SearchInput value={search} onChange={setSearch} placeholder="Search name, contact, email, city…" aria-label="Search suppliers" /></div>
        </div>
      )}

      {error ? (
        <div role="alert" className="rounded-xl border border-bone p-4 flex items-center justify-between gap-3">
          <p className="text-[12.5px] text-error">{error}</p>
          <Button size="sm" variant="secondary" onClick={() => { setLoading(true); load(); }}>Retry</Button>
        </div>
      ) : loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} height={64} rounded="10px" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={<Building2 size={28} className="text-brand-orange opacity-55" />} title="No suppliers yet" description="Add the businesses you buy stock from, then pick them on purchase orders." />
      ) : shown.length === 0 ? (
        <EmptyState icon={<Building2 size={28} className="text-brand-orange opacity-55" />} title="No suppliers match" description="Try a different search or filter." />
      ) : (
        <div className="bg-white rounded-xl border border-bone divide-y divide-bone overflow-hidden">
          {shown.map(s => {
            const st = s.stats;
            return (
              <div key={s._id} className="px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 sm:py-3">
                <button type="button" onClick={() => openDetail(s)} className="min-w-0 flex-1 text-left bg-transparent border-0 p-0 cursor-pointer">
                  <p className="text-[13px] pointer-coarse:text-[15px] font-semibold text-charcoal sm:truncate">{s.name}</p>
                  <p className="text-[11px] pointer-coarse:text-[13px] text-slate sm:truncate">{[s.contactName, s.email, s.phone, [s.city, s.country].filter(Boolean).join(', ')].filter(Boolean).join(' · ') || 'No contact details'}</p>
                </button>
                <div className="text-[11px] pointer-coarse:text-[13px] text-slate sm:text-right sm:w-[190px]">
                  {st && st.poCount > 0
                    ? <><p className="m-0 text-charcoal font-medium">{st.poCount} order{st.poCount === 1 ? '' : 's'}{st.openPoCount > 0 ? ` · ${st.openPoCount} open` : ''}</p><p className="m-0">{formatMoney(st.spent, currency)} · last {when(st.lastOrderAt)}</p></>
                    : <p className="m-0">No purchase orders yet</p>}
                </div>
                <div className="flex items-center gap-2 justify-between sm:justify-end">
                  <Badge color={s.status === 'active' ? 'green' : 'gray'} size="sm">{s.status === 'active' ? 'Active' : 'Archived'}</Badge>
                  {canManage && (
                    <span className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openForm(s)}>Edit</Button>
                      <Button size="sm" variant="secondary" loading={busyId === s._id} onClick={() => void toggleArchive(s)}>{s.status === 'active' ? 'Archive' : 'Restore'}</Button>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add supplier' : 'Edit supplier'} onClose={() => setEditing(null)} width={560} mobileSheet
          footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save} loading={saving} disabled={!form.name.trim()}>Save</Button></div>}
        >
          <div className="flex flex-col gap-3">
            <Input label="Company name" value={form.name} maxLength={120} onChange={set('name')} />
            <Input label="Contact person (optional)" value={form.contactName} maxLength={120} onChange={set('contactName')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Email (optional)" type="email" value={form.email} onChange={set('email')} />
              <Input label="Phone (optional)" value={form.phone} onChange={set('phone')} />
            </div>
            <Input label="Address (optional)" value={form.address} onChange={set('address')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="City (optional)" value={form.city} maxLength={80} onChange={set('city')} />
              <Input label="Country (optional)" value={form.country} maxLength={80} onChange={set('country')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Lead time in days (optional)" inputMode="numeric" value={form.leadTimeDays} onChange={set('leadTimeDays')} />
              <div>
                <Input label="Payment terms (optional)" list="supplier-terms" value={form.paymentTerms} maxLength={60} onChange={set('paymentTerms')} />
                <datalist id="supplier-terms">{TERMS.map(t => <option key={t} value={t} />)}</datalist>
              </div>
            </div>
            <Input label="Notes (optional)" value={form.notes} onChange={set('notes')} />
            {formError && <p role="alert" className="text-[12px] text-error">{formError}</p>}
          </div>
        </Modal>
      )}

      {viewing && (
        <Modal title={viewing.name} onClose={() => setViewing(null)} width={680} mobileSheet
          footer={<div className="flex justify-end gap-2">
            {canManage && <Button variant="secondary" onClick={() => { const s = viewing; setViewing(null); openForm(s); }}>Edit</Button>}
            <Button onClick={() => navigate(`/store/${storeId}/purchase-orders/new`)}>New purchase order</Button>
          </div>}
        >
          {detailError ? (
            <p role="alert" className="text-[12.5px] text-error">{detailError}</p>
          ) : !detail ? (
            <div className="flex flex-col gap-2"><SkeletonBox height={56} rounded="10px" /><SkeletonBox height={120} rounded="10px" /></div>
          ) : (
            <SupplierDetailBody detail={detail} currency={currency} onOpenPo={id => navigate(`/store/${storeId}/purchase-orders/${id}`)} />
          )}
        </Modal>
      )}
    </div>
  );
}

function SupplierDetailBody({ detail, currency, onOpenPo }: { detail: SupplierDetail; currency: string; onOpenPo: (id: string) => void }) {
  const s = detail.supplier;
  const facts: [string, string | null | undefined][] = [
    ['Contact', s.contactName], ['Email', s.email], ['Phone', s.phone], ['Address', [s.address, s.city, s.country].filter(Boolean).join(', ') || null],
    ['Lead time', s.leadTimeDays != null ? `${s.leadTimeDays} day${s.leadTimeDays === 1 ? '' : 's'}` : null], ['Payment terms', s.paymentTerms], ['Notes', s.notes],
  ];
  const head = 'text-[11px] uppercase tracking-wide text-slate font-semibold mb-1.5';
  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 m-0">
        {facts.filter(([, v]) => v).map(([k, v]) => (
          <div key={k}><dt className="text-[11px] text-slate">{k}</dt><dd className="m-0 text-[13px] text-charcoal break-words">{v}</dd></div>
        ))}
        {facts.every(([, v]) => !v) && <p className="m-0 text-[12.5px] text-slate">No contact details saved yet.</p>}
      </dl>

      <section>
        <p className={head}>Recent purchase orders</p>
        {detail.recentPurchaseOrders.length === 0 ? <p className="m-0 text-[12.5px] text-slate">No purchase orders yet.</p> : (
          <ul className="m-0 p-0 list-none border border-bone rounded-lg divide-y divide-bone">
            {detail.recentPurchaseOrders.map(po => (
              <li key={po._id}>
                <button type="button" onClick={() => onOpenPo(po._id)} className="w-full flex items-center justify-between gap-3 px-3 py-2 bg-transparent border-0 cursor-pointer text-left hover:bg-mist">
                  <span className="text-[13px] font-medium text-charcoal">{po.poNumber}</span>
                  <span className="text-[12px] text-slate">{when(po.createdAt)} · {po.status.replace(/_/g, ' ')} · {formatMoney(po.total, po.currency || currency)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className={head}>Products bought from this supplier</p>
        {detail.products.length === 0 ? <p className="m-0 text-[12.5px] text-slate">Nothing ordered yet.</p> : (
          <div className="border border-bone rounded-lg overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead><tr className="text-left text-slate"><th className="px-3 py-2 font-medium">Product</th><th className="px-3 py-2 font-medium">SKU</th><th className="px-3 py-2 font-medium text-right">Last cost</th><th className="px-3 py-2 font-medium text-right">Qty ordered</th></tr></thead>
              <tbody>
                {detail.products.map(p => (
                  <tr key={p.variantId} className="border-t border-bone">
                    <td className="px-3 py-2 text-charcoal">{p.name}{optionText(p.options)}</td>
                    <td className="px-3 py-2 text-slate">{p.sku ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(p.lastUnitCost, currency)}</td>
                    <td className="px-3 py-2 text-right">{p.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <p className={head}>Recent returns to this supplier</p>
        {detail.recentReturns.length === 0 ? <p className="m-0 text-[12.5px] text-slate">No returns.</p> : (
          <ul className="m-0 p-0 list-none border border-bone rounded-lg divide-y divide-bone">
            {detail.recentReturns.map(r => (
              <li key={r._id} className="px-3 py-2 flex items-center justify-between text-[12.5px]"><span className="text-charcoal">{when(r.createdAt)}</span><span className="text-slate">{r.total != null ? formatMoney(r.total, currency) : ''}{r.status ? ` · ${r.status}` : ''}</span></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
