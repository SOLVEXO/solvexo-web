import { useState } from 'react';
import client from '@/api/client';
import { errorMessage } from '@/api/errorMessage';
import { can } from '@/hooks/auth/useCan';
import { useToast } from '@/contexts/ToastContext';
import { Badge, Button, Card, Input, Select, StatusBadge, Table } from '@/components/comman/ui';
import { Modal } from '@/components/comman/ui/Modal';
import type { TableColumn } from '@/components/comman/ui/Table';
import { ErrorLine } from './ErrorLine';
import { PAGE_SIZE, PAYMENT_METHOD_OPTIONS, termsLabel, termsToValue, useApi, usePaged, valueToTerms, type PaymentTerms } from './wholesaleUtils';

export interface CatalogRow { _id: string; name: string; status: string }
interface Company {
  _id: string; name: string; status: string; taxId: string | null; taxExempt: boolean; catalogId: string | null; paymentTerms: PaymentTerms | null;
  allowedPaymentMethods: string[]; creditLimit: number | null; depositPercent: number; note: string | null;
}
interface Location { _id: string; name: string; catalogId: string | null; paymentTerms: PaymentTerms | null; creditLimit: number | null; shippingAddress?: { addressLine1?: string; city?: string } | null }
interface Buyer { _id: string; email: string; role: string; status: string; locationId: string }
interface Detail { company: Company; locations: Location[]; buyers: Buyer[] }

const BLANK = { name: '', taxId: '', taxExempt: false, catalogId: '', terms: '', creditLimit: '', depositPercent: '0', note: '', status: 'approved', methods: [] as string[] };

export function CompaniesTab({ storeId, catalogs }: { storeId: string; catalogs: CatalogRow[] }) {
  const base = `/api/b2b/${storeId}`;
  const canEdit = can('b2b.manage');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const list = usePaged<Company>(`${base}/companies`, { status, search });
  const [editing, setEditing] = useState<Company | 'new' | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const columns: TableColumn<Company>[] = [
    { key: 'name', header: 'Company', render: (c) => <button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-left font-semibold text-carbon underline-offset-2 hover:underline" onClick={() => setOpenId(c._id)}>{c.name}</button> },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} size="sm" /> },
    { key: 'terms', header: 'Payment terms', render: (c) => termsLabel(c.paymentTerms) },
    { key: 'credit', header: 'Credit limit', render: (c) => (c.creditLimit ? c.creditLimit.toLocaleString() : '—') },
    { key: 'a', header: 'Actions', align: 'right', render: (c) => (canEdit ? <Button size="xs" variant="outline" onClick={() => setEditing(c)}>Edit</Button> : null) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-64"><Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Company name" /></div>
        <div className="w-full sm:w-44">
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="suspended">Suspended</option><option value="rejected">Rejected</option>
          </Select>
        </div>
        {canEdit && <div className="sm:ml-auto"><Button size="sm" onClick={() => setEditing('new')}>Add company</Button></div>}
      </div>
      {list.error ? <ErrorLine message={errorMessage(list.error)} onRetry={list.reload} /> : (
        <Table columns={columns} data={list.rows} keyExtractor={(c) => c._id} loading={list.loading}
          pagination={{ page: list.page, total: list.total, perPage: PAGE_SIZE, onChange: list.setPage, label: 'companies' }}
          emptyState={{ title: 'No wholesale companies yet', description: 'Add a company, or approve a wholesale application, to start selling at wholesale prices.' }} />
      )}
      {editing && <CompanyModal base={base} catalogs={catalogs} company={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); list.reload(); }} />}
      {openId && <CompanyDetail base={base} id={openId} canEdit={canEdit} onClose={() => { setOpenId(null); list.reload(); }} />}
    </div>
  );
}

function CompanyModal({ base, catalogs, company, onClose, onSaved }: { base: string; catalogs: CatalogRow[]; company: Company | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [f, setF] = useState(company ? {
    name: company.name, taxId: company.taxId ?? '', taxExempt: company.taxExempt, catalogId: company.catalogId ?? '', terms: termsToValue(company.paymentTerms),
    creditLimit: company.creditLimit != null ? String(company.creditLimit) : '', depositPercent: String(company.depositPercent ?? 0), note: company.note ?? '', status: company.status,
    methods: company.allowedPaymentMethods ?? [],
  } : BLANK);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof BLANK) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const toggleMethod = (m: string) => setF({ ...f, methods: f.methods.includes(m) ? f.methods.filter((x) => x !== m) : [...f.methods, m] });

  async function save() {
    if (!f.name.trim()) { toast.error('Company name is required'); return; }
    setBusy(true);
    const body = {
      name: f.name.trim(), taxId: f.taxId.trim() || null, taxExempt: f.taxExempt, catalogId: f.catalogId || null, paymentTerms: valueToTerms(f.terms),
      creditLimit: f.creditLimit === '' ? null : Number(f.creditLimit), depositPercent: Number(f.depositPercent) || 0, note: f.note.trim() || null, status: f.status, allowedPaymentMethods: f.methods,
    };
    try {
      if (company) await client.patch(`${base}/companies/${company._id}`, body); else await client.post(`${base}/companies`, body);
      toast.success(company ? 'Company saved' : 'Company added');
      onSaved();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }

  return (
    <Modal title={company ? 'Edit company' : 'Add company'} onClose={onClose} width={560}
      footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={busy} onClick={() => void save()}>Save</Button></>}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><Input label="Company name" required maxLength={120} value={f.name} onChange={set('name')} /></div>
        <Input label="Tax number (NTN / VAT)" maxLength={60} value={f.taxId} onChange={set('taxId')} />
        <Select label="Status" value={f.status} onChange={set('status')}>
          <option value="approved">Approved</option><option value="pending">Pending</option><option value="suspended">Suspended</option><option value="rejected">Rejected</option>
        </Select>
        <Select label="Catalog (wholesale prices)" value={f.catalogId} onChange={set('catalogId')}>
          <option value="">None (retail prices)</option>
          {catalogs.map((c) => <option key={c._id} value={c._id}>{c.name}{c.status === 'draft' ? ' (draft)' : ''}</option>)}
        </Select>
        <Select label="Payment terms" value={f.terms} onChange={set('terms')}>
          <option value="">None (pays at checkout)</option><option value="due_on_order">Due on order</option>
          <option value="net:15">Net 15</option><option value="net:30">Net 30</option><option value="net:60">Net 60</option><option value="due_on_fulfilment">Due on fulfilment</option>
        </Select>
        <Input label="Credit limit (store currency, empty = none)" type="number" min={0} value={f.creditLimit} onChange={set('creditLimit')} />
        <Input label="Deposit required before shipping (%)" type="number" min={0} max={100} value={f.depositPercent} onChange={set('depositPercent')} />
        <label className="flex items-center gap-2 text-[13px] text-carbon sm:col-span-2"><input type="checkbox" checked={f.taxExempt} onChange={(e) => setF({ ...f, taxExempt: e.target.checked })} /> Tax exempt (no tax at checkout)</label>
        <fieldset className="m-0 flex flex-col gap-1 border-0 p-0 sm:col-span-2">
          <legend className="mb-1 text-[13px] font-semibold text-carbon">Allowed payment methods</legend>
          <p className="m-0 mb-1 text-xs text-slate">Leave all unticked to allow every method your store offers.</p>
          {PAYMENT_METHOD_OPTIONS.map((m) => (
            <label key={m.key} className="flex items-center gap-2 text-[13px] text-carbon"><input type="checkbox" checked={f.methods.includes(m.key)} onChange={() => toggleMethod(m.key)} /> {m.label}</label>
          ))}
        </fieldset>
        <div className="sm:col-span-2"><Input label="Internal note" maxLength={500} value={f.note} onChange={set('note')} /></div>
      </div>
    </Modal>
  );
}

function CompanyDetail({ base, id, canEdit, onClose }: { base: string; id: string; canEdit: boolean; onClose: () => void }) {
  const toast = useToast();
  const { data, error, loading, reload } = useApi<Detail>(`${base}/companies/${id}`);
  const [locName, setLocName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState<Record<string, string>>({});
  const [buyerRole, setBuyerRole] = useState<Record<string, string>>({});

  async function run(fn: () => Promise<unknown>, ok: string) {
    try { await fn(); toast.success(ok); reload(); } catch (e) { toast.error(errorMessage(e)); }
  }

  return (
    <Modal title={data?.company.name ?? 'Company'} onClose={onClose} width={720}>
      {error ? <ErrorLine message={errorMessage(error)} onRetry={reload} /> : loading || !data ? <p className="m-0 text-[13px] text-slate">Loading…</p> : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-carbon">
            <StatusBadge status={data.company.status} size="sm" />
            <Badge color="gray" size="sm">{termsLabel(data.company.paymentTerms)}</Badge>
            {data.company.taxExempt && <Badge color="green" size="sm">Tax exempt</Badge>}
          </div>
          {data.locations.map((l) => {
            const buyers = data.buyers.filter((b) => b.locationId === l._id);
            return (
              <Card key={l._id} padding="md">
                <div className="mb-2 flex items-center gap-2">
                  <strong className="text-[14px] text-carbon">{l.name}</strong>
                  {l.shippingAddress?.city && <span className="text-xs text-slate">{[l.shippingAddress.addressLine1, l.shippingAddress.city].filter(Boolean).join(', ')}</span>}
                  {canEdit && data.locations.length > 1 && buyers.length === 0 && (
                    <Button size="xs" variant="outline" className="ml-auto" onClick={() => void run(() => client.delete(`${base}/locations/${l._id}`), 'Location removed')}>Remove</Button>
                  )}
                </div>
                {buyers.length === 0 ? <p className="m-0 text-xs text-slate">No buyers yet.</p> : (
                  <ul className="m-0 flex list-none flex-col gap-1 p-0">
                    {buyers.map((b) => (
                      <li key={b._id} className="flex flex-wrap items-center gap-2 text-[13px] text-carbon">
                        <span className="min-w-0 flex-1 truncate">{b.email}</span>
                        <Badge color={b.role === 'location_admin' ? 'blue' : 'gray'} size="sm">{b.role === 'location_admin' ? 'Location admin' : 'Ordering only'}</Badge>
                        {b.status === 'disabled' && <Badge color="red" size="sm">Disabled</Badge>}
                        {canEdit && (
                          <>
                            <Button size="xs" variant="outline" onClick={() => void run(() => client.patch(`${base}/buyers/${b._id}`, { status: b.status === 'active' ? 'disabled' : 'active' }), 'Buyer updated')}>{b.status === 'active' ? 'Disable' : 'Enable'}</Button>
                            <Button size="xs" variant="outline" onClick={() => void run(() => client.delete(`${base}/buyers/${b._id}`), 'Buyer removed')}>Remove</Button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {canEdit && (
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <div className="min-w-[200px] flex-1"><Input label="Add buyer by customer email" type="email" value={buyerEmail[l._id] ?? ''} onChange={(e) => setBuyerEmail({ ...buyerEmail, [l._id]: e.target.value })} /></div>
                    <div className="w-40">
                      <Select label="Role" value={buyerRole[l._id] ?? 'ordering'} onChange={(e) => setBuyerRole({ ...buyerRole, [l._id]: e.target.value })}>
                        <option value="ordering">Ordering only</option><option value="location_admin">Location admin</option>
                      </Select>
                    </div>
                    <Button size="sm" disabled={!(buyerEmail[l._id] ?? '').trim()} onClick={() => void run(async () => { await client.post(`${base}/locations/${l._id}/buyers`, { email: buyerEmail[l._id], role: buyerRole[l._id] ?? 'ordering' }); setBuyerEmail({ ...buyerEmail, [l._id]: '' }); }, 'Buyer added')}>Add buyer</Button>
                  </div>
                )}
              </Card>
            );
          })}
          {canEdit && (
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[200px] flex-1"><Input label="New location name" maxLength={120} value={locName} onChange={(e) => setLocName(e.target.value)} /></div>
              <Button size="sm" variant="outline" disabled={!locName.trim()} onClick={() => void run(async () => { await client.post(`${base}/companies/${id}/locations`, { name: locName.trim() }); setLocName(''); }, 'Location added')}>Add location</Button>
            </div>
          )}
          <p className="m-0 text-xs text-slate">A buyer must already have a customer account on your store. Each customer belongs to one company location.</p>
        </div>
      )}
    </Modal>
  );
}
