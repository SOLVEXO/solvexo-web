import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ShoppingBag, DollarSign, Package, Download, Tag as TagIcon, Archive, ArchiveRestore } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import {
  apiGetStoreCustomers, apiUpdateStoreCustomer, apiUpdateStoreCustomerMeta,
  apiExportStoreCustomers, apiBulkTagCustomers, apiBulkArchiveCustomers,
  type StoreCustomer, type StoreCustomerSegment, type StoreCustomerView, type GetStoreCustomersParams,
} from '@/api/services/store';
import { apiGetSellerOrders, type SellerOrder } from '@/api/services/product';
import { MetricCard } from '@/components/comman/ui/MetricCard';
import { Table, type TableColumn } from '@/components/comman/ui/Table';
import { Badge, StatusBadge } from '@/components/comman/ui/Badge';
import { SearchInput } from '@/components/comman/ui/SearchInput';
import { FilterDropdown } from '@/components/comman/ui/FilterDropdown';
import { TabBar } from '@/components/comman/ui/TabBar';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { formatMoneyCompact, currencySymbol, fmt2 } from '@/utils/currency';

const PER_PAGE = 20;

function initialsOf(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

const SEGMENT_META: Record<StoreCustomerSegment, { label: string; color: 'green' | 'blue' | 'orange' | 'red' }> = {
  new:       { label: 'New',       color: 'blue' },
  returning: { label: 'Returning', color: 'green' },
  vip:       { label: 'VIP',       color: 'orange' },
  at_risk:   { label: 'At Risk',   color: 'red' },
};

const SEGMENT_OPTIONS = Object.entries(SEGMENT_META).map(([value, m]) => ({ value, label: m.label }));

export default function StoreCustomerList() {
  const navigate = useNavigate();
  const { storeId, store } = useStoreWorkspace();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [segment, setSegment] = useState('');
  // Click-to-sort table headers (Shopify convention) rather than a separate sort dropdown.
  const [sortBy, setSortBy] = useState<NonNullable<GetStoreCustomersParams['sortBy']>>('lastOrderAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [view, setView] = useState<StoreCustomerView>('active');
  const [page, setPage] = useState(1);

  const [customers, setCustomers] = useState<StoreCustomer[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ totalOrders: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedKeys, setSelectedKeys] = useState<Set<string | number>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [bulkTagOpen, setBulkTagOpen] = useState(false);
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);

  const [sel, setSel] = useState<StoreCustomer | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);

  const [customerOrders, setCustomerOrders] = useState<SellerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  // Debounce search input 300ms before it hits the server — every other
  // filter below applies immediately since changing a dropdown/date is
  // already a deliberate, infrequent action.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Any filter change resets to page 1 and clears the current selection —
  // a selection made against one filtered set shouldn't silently apply to
  // whatever rows a new filter brings in.
  useEffect(() => {
    setPage(1);
    setSelectedKeys(new Set());
  }, [debouncedSearch, segment, sortBy, sortDir, dateFrom, dateTo, view]);

  function handleSortChange(key: string) {
    if (key === sortBy) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key as NonNullable<GetStoreCustomersParams['sortBy']>); setSortDir('desc'); }
  }

  const filterParams: GetStoreCustomersParams = {
    search: debouncedSearch || undefined,
    segment: (segment || undefined) as StoreCustomerSegment | undefined,
    sortBy, sortDir,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    view,
  };

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    setError('');
    apiGetStoreCustomers(storeId, { ...filterParams, page, limit: PER_PAGE })
      .then(res => {
        setCustomers(res.data.customers ?? []);
        setTotal(res.data.pagination.total);
        setSummary(res.data.summary);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load customers.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, page, debouncedSearch, segment, sortBy, sortDir, dateFrom, dateTo, view]);

  function refetch() {
    if (!storeId) return;
    apiGetStoreCustomers(storeId, { ...filterParams, page, limit: PER_PAGE }).then(res => {
      setCustomers(res.data.customers ?? []);
      setTotal(res.data.pagination.total);
      setSummary(res.data.summary);
    });
  }

  // The customer detail panel's own order-history list — reuses the same
  // seller-orders endpoint the Orders page uses, just scoped to this one
  // buyer via `userId`, instead of a separate customer-order endpoint.
  useEffect(() => {
    if (!sel || !storeId) { setCustomerOrders([]); return; }
    setOrdersLoading(true);
    setOrdersError('');
    apiGetSellerOrders(storeId, 1, 10, sel._id)
      .then(res => setCustomerOrders(res.data.orders ?? []))
      .catch(err => setOrdersError(err instanceof Error ? err.message : 'Failed to load orders.'))
      .finally(() => setOrdersLoading(false));
  }, [sel, storeId]);

  function select(c: StoreCustomer) {
    setSel(c);
    setForm({ name: c.name, phone: c.phone ?? '', email: c.email });
    setNotes(c.notes ?? '');
    setTags(c.tags ?? []);
    setMarketingOptIn(c.marketingOptIn ?? false);
    setTagInput('');
  }

  async function saveMeta(nextTags: string[], nextNotes: string, nextMarketingOptIn: boolean) {
    if (!sel) return;
    setSavingMeta(true);
    try {
      const res = await apiUpdateStoreCustomerMeta(storeId, sel._id, { tags: nextTags, notes: nextNotes, marketingOptIn: nextMarketingOptIn });
      setCustomers(prev => prev.map(c => c._id === sel._id ? { ...c, ...res.data } : c));
      setSel(prev => prev ? { ...prev, ...res.data } : prev);
    } finally {
      setSavingMeta(false);
    }
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) { setTagInput(''); return; }
    const next = [...tags, t];
    setTags(next);
    setTagInput('');
    saveMeta(next, notes, marketingOptIn);
  }

  function removeTag(t: string) {
    const next = tags.filter(x => x !== t);
    setTags(next);
    saveMeta(next, notes, marketingOptIn);
  }

  function toggleMarketingOptIn() {
    const next = !marketingOptIn;
    setMarketingOptIn(next);
    saveMeta(tags, notes, next);
  }

  async function saveEdit() {
    if (!sel) return;
    setSaving(true);
    try {
      const res = await apiUpdateStoreCustomer(storeId, sel._id, form);
      setCustomers(prev => prev.map(c => c._id === sel._id ? { ...c, ...res.data } : c));
      setSel(prev => prev ? { ...prev, ...res.data } : prev);
    } finally {
      setSaving(false);
    }
  }

  async function handleExport(ids?: string[]) {
    setExporting(true);
    try {
      const blob = await apiExportStoreCustomers(storeId, { ...filterParams, ids });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers-${storeId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function handleBulkArchive(ids: string[], archived: boolean) {
    setBulkSaving(true);
    try {
      await apiBulkArchiveCustomers(storeId, { customerIds: ids, archived });
      setSelectedKeys(new Set());
      refetch();
    } finally {
      setBulkSaving(false);
    }
  }

  async function handleBulkTag() {
    const addTags = bulkTagInput.split(',').map(t => t.trim()).filter(Boolean);
    if (!addTags.length) return;
    setBulkSaving(true);
    try {
      await apiBulkTagCustomers(storeId, { customerIds: Array.from(selectedKeys) as string[], addTags });
      setBulkTagOpen(false);
      setBulkTagInput('');
      setSelectedKeys(new Set());
      refetch();
    } finally {
      setBulkSaving(false);
    }
  }

  const columns: TableColumn<StoreCustomer>[] = [
    {
      key: 'name', header: 'Customer', sortable: true,
      render: c => (
        <div className="flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 bg-[#f0eee6] text-[#5a5852]">{initialsOf(c.name)}</div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-charcoal leading-[1.3] truncate">{c.name}</p>
            <p className="text-[11px] text-slate truncate">{c.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: c => <span className="text-slate">{c.phone || '—'}</span> },
    {
      key: 'segment', header: 'Segment',
      render: c => <Badge color={SEGMENT_META[c.segment].color}>{SEGMENT_META[c.segment].label}</Badge>,
    },
    {
      key: 'orderCount', header: 'Orders', align: 'center', sortable: true,
      render: c => <Badge color={c.orderCount > 1 ? 'green' : 'orange'}>{c.orderCount}</Badge>,
    },
    {
      key: 'totalSpent', header: 'Total Spent', align: 'right', sortable: true,
      render: c => <span className="font-semibold text-charcoal">{formatMoneyCompact(c.totalSpent, store?.baseCurrency)}</span>,
    },
    { key: 'lastOrderAt', header: 'Last Order', sortable: true, render: c => <span className="text-slate">{fmtDate(c.lastOrderAt)}</span> },
    { key: 'createdAt', header: 'Member Since', sortable: true, render: c => <span className="text-slate">{fmtDate(c.createdAt)}</span> },
    {
      key: 'actions', header: '', align: 'right',
      render: c => (
        <button onClick={e => { e.stopPropagation(); select(c); }} className="text-xs font-medium text-brand-orange bg-transparent border-none cursor-pointer">Edit</button>
      ),
    },
  ];

  return (
    <>
      <StorePageHeader
        title="Customers"
        subtitle="Manage buyer relationships and followers for this store."
      />

      <div className="px-4 md:px-7 pt-5 pb-8 flex flex-col gap-5">

        <div className="flex flex-wrap gap-3">
          <MetricCard label="Total Customers" value={total.toLocaleString()} icon={<Users size={16} />} loading={loading && page === 1 && customers.length === 0} />
          <MetricCard label="Total Orders"     value={summary.totalOrders.toLocaleString()} icon={<ShoppingBag size={16} />} loading={loading && page === 1 && customers.length === 0} />
          <MetricCard label="Total Revenue"    value={formatMoneyCompact(summary.totalRevenue, store?.baseCurrency)} icon={<DollarSign size={16} />} loading={loading && page === 1 && customers.length === 0} />
        </div>

        <div className={`grid grid-cols-1 gap-4 items-start ${sel ? 'lg:grid-cols-[1fr_300px]' : ''}`}>
          <div className="bg-white border border-bone rounded-[10px] min-w-0 overflow-hidden">
            <TabBar
              tabs={[{ id: 'active', label: 'Active' }, { id: 'archived', label: 'Archived' }]}
              active={view}
              onChange={id => setView(id as StoreCustomerView)}
            />

            <div className="px-5 py-3.5 border-b border-bone flex flex-wrap items-center gap-2.5">
              <SearchInput value={search} onChange={setSearch} placeholder="Search customers…" className="max-w-[220px]" />
              <FilterDropdown placeholder="All Segments" options={SEGMENT_OPTIONS} value={segment} onChange={setSegment} />
              <div className="flex items-center gap-1.5 text-[12px] text-slate">
                <span>Last order</span>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="px-2 py-[6px] text-[12px] border border-bone rounded-lg outline-none text-charcoal bg-white" />
                <span>–</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="px-2 py-[6px] text-[12px] border border-bone rounded-lg outline-none text-charcoal bg-white" />
              </div>
              <Button size="xs" variant="outline" icon={<Download size={12} />} loading={exporting} onClick={() => handleExport()} className="ml-auto">
                Export
              </Button>
            </div>

            {error ? (
              <p className="p-4 text-xs text-error">{error}</p>
            ) : (
              <Table
                columns={columns}
                data={customers}
                keyExtractor={c => c._id}
                onRowClick={select}
                loading={loading}
                sort={{ key: sortBy, direction: sortDir }}
                onSortChange={handleSortChange}
                selectable
                selectedKeys={selectedKeys}
                onSelectionChange={setSelectedKeys}
                bulkActions={keys => (
                  <>
                    <Button size="xs" variant="outline" icon={<TagIcon size={12} />} disabled={bulkSaving} onClick={() => setBulkTagOpen(true)}>
                      Add Tag
                    </Button>
                    {view === 'archived' ? (
                      <Button size="xs" variant="outline" icon={<ArchiveRestore size={12} />} loading={bulkSaving} onClick={() => handleBulkArchive(Array.from(keys) as string[], false)}>
                        Restore
                      </Button>
                    ) : (
                      <Button size="xs" variant="outline" icon={<Archive size={12} />} loading={bulkSaving} onClick={() => handleBulkArchive(Array.from(keys) as string[], true)}>
                        Archive
                      </Button>
                    )}
                    <Button size="xs" variant="outline" icon={<Download size={12} />} loading={exporting} onClick={() => handleExport(Array.from(keys) as string[])}>
                      Export
                    </Button>
                  </>
                )}
                pagination={{ page, total, perPage: PER_PAGE, onChange: setPage, label: 'customers' }}
                emptyState={{
                  icon: <Users size={28} className="text-brand-orange opacity-55" />,
                  title: view === 'archived' ? 'No archived customers' : 'No customers found for this store yet',
                  description: view === 'archived'
                    ? 'Customers you archive will show up here.'
                    : 'Customers who place an order from this store will show up here.',
                }}
              />
            )}
          </div>

          {/* Edit panel */}
          {sel && (
            <div className="w-full lg:w-[300px] shrink-0">
              <div className="bg-white border border-bone rounded-[10px] px-[18px] py-5 lg:sticky lg:top-[70px]">
                <div className="flex flex-col items-center text-center pb-4 border-b border-[#f0eee6] mb-3.5">
                  <div className="w-[52px] h-[52px] rounded-full text-base font-bold flex items-center justify-center mb-2.5 bg-[#f0eee6] text-[#5a5852]">
                    {initialsOf(sel.name)}
                  </div>
                  <p className="text-[15px] font-bold text-carbon mb-[3px]">{sel.name}</p>
                  <p className="text-xs text-slate">Customer since {fmtDate(sel.createdAt)}</p>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#f0eee6] w-full justify-center">
                    <div className="text-center">
                      <p className="text-[15px] font-bold text-carbon">{sel.orderCount}</p>
                      <p className="text-[10px] text-slate uppercase tracking-[0.05em]">Orders</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[15px] font-bold text-carbon">{formatMoneyCompact(sel.totalSpent, store?.baseCurrency)}</p>
                      <p className="text-[10px] text-slate uppercase tracking-[0.05em]">Spent</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mb-4">
                  <div>
                    <label className="text-xs font-medium text-graphite mb-[5px] block">Name</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-graphite mb-[5px] block">Phone</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-graphite mb-[5px] block">Email</label>
                    <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border" />
                    <p className="text-[11px] text-slate mt-1">Changing email un-verifies the account until they confirm the new one.</p>
                  </div>
                </div>

                <button onClick={saveEdit} disabled={saving} className="w-full py-2 bg-brand-orange border-none rounded-lg text-xs font-semibold text-white cursor-pointer disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>

                <div className="mt-4 pt-4 border-t border-[#f0eee6] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleBulkArchive([sel._id], !sel.isArchived)}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate hover:text-charcoal bg-transparent border-none cursor-pointer p-0"
                  >
                    {sel.isArchived ? <><ArchiveRestore size={13} /> Restore customer</> : <><Archive size={13} /> Archive customer</>}
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-[#f0eee6]">
                  <label className="text-xs font-medium text-graphite mb-[7px] block">Order History</label>
                  {ordersLoading ? (
                    <div className="flex flex-col gap-1.5">
                      {[0, 1, 2].map(i => <div key={i} className="h-9 rounded-lg bg-cream animate-pulse" />)}
                    </div>
                  ) : ordersError ? (
                    <p className="text-[11px] text-error">{ordersError}</p>
                  ) : customerOrders.length === 0 ? (
                    <p className="text-[11.5px] text-slate">No orders yet.</p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {customerOrders.map(o => (
                        <button
                          key={o.orderId}
                          onClick={() => navigate(`/store/${storeId}/orders/detail/${o.orderId}`)}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-cream hover:bg-bone border-0 cursor-pointer text-left transition-colors"
                        >
                          <Package size={13} className="text-slate shrink-0" />
                          <span className="flex-1 min-w-0">
                            <span className="block text-[12px] font-semibold text-charcoal truncate">{o.orderNumber}</span>
                            <span className="block text-[10.5px] text-slate">{fmtDate(o.date)}</span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block text-[12px] font-bold text-charcoal">{currencySymbol(o.currency)}{fmt2(o.amount)}</span>
                            <StatusBadge status={o.status} size="sm" />
                          </span>
                        </button>
                      ))}
                      {sel.orderCount > customerOrders.length && (
                        <p className="text-[10.5px] text-slate text-center mt-1">+{sel.orderCount - customerOrders.length} more order{sel.orderCount - customerOrders.length === 1 ? '' : 's'}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-[#f0eee6] flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-medium text-graphite mb-[5px] block">Tags <span className="text-slate font-normal">(private to you)</span></label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {tags.map(t => (
                        <span key={t} className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full bg-brand-pale-orange text-brand-deep-orange text-[11px] font-medium">
                          {t}
                          <button onClick={() => removeTag(t)} className="bg-transparent border-none cursor-pointer p-0 text-brand-deep-orange/60 hover:text-brand-deep-orange leading-none">×</button>
                        </span>
                      ))}
                    </div>
                    <input
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      placeholder="e.g. VIP, Wholesale — press Enter"
                      className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-graphite mb-[5px] block">Notes <span className="text-slate font-normal">(private to you)</span></label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      onBlur={() => saveMeta(tags, notes, marketingOptIn)}
                      placeholder="Anything worth remembering about this customer…"
                      rows={3}
                      className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border resize-y"
                    />
                    {savingMeta && <p className="text-[10px] text-slate mt-1">Saving…</p>}
                  </div>
                  <label className="flex items-center gap-2 text-xs font-medium text-graphite cursor-pointer">
                    <input type="checkbox" checked={marketingOptIn} onChange={toggleMarketingOptIn} className="accent-brand-orange cursor-pointer" />
                    Subscribed to marketing emails
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {bulkTagOpen && (
        <Modal
          title={`Add tag to ${selectedKeys.size} customer${selectedKeys.size === 1 ? '' : 's'}`}
          onClose={() => setBulkTagOpen(false)}
          footer={<>
            <Button variant="ghost" onClick={() => setBulkTagOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleBulkTag} loading={bulkSaving}>Add Tag(s)</Button>
          </>}
        >
          <input
            autoFocus
            value={bulkTagInput}
            onChange={e => setBulkTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleBulkTag(); } }}
            placeholder="e.g. VIP, Wholesale — comma separated"
            className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border"
          />
        </Modal>
      )}
    </>
  );
}
