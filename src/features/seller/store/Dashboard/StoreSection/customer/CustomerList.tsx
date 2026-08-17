import { useEffect, useState } from 'react';
import { Users, ShoppingBag, DollarSign } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { apiGetStoreCustomers, apiUpdateStoreCustomer, type StoreCustomer } from '@/api/services/store';
import { TabBar, type Tab } from '@/components/comman/ui/TabBar';
import { MetricCard } from '@/components/comman/ui/MetricCard';
import { Table, type TableColumn } from '@/components/comman/ui/Table';
import { Badge } from '@/components/comman/ui/Badge';
import { SearchInput } from '@/components/comman/ui/SearchInput';
import { formatMoneyCompact } from '@/utils/currency';
import { FollowersTab } from './tabs/FollowersTab';

const TABS: Tab[] = [
  { id: 'customers', label: 'Customers' },
  { id: 'followers', label: 'Followers' },
];

const PER_PAGE = 20;

function initialsOf(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

export default function StoreCustomerList() {
  usePageTitle('Customers');
  const { storeId, store } = useStoreWorkspace();

  const [activeTab, setActiveTab] = useState('customers');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [customers, setCustomers] = useState<StoreCustomer[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ totalOrders: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sel, setSel] = useState<StoreCustomer | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!storeId || activeTab !== 'customers') return;
    setLoading(true);
    apiGetStoreCustomers(storeId, page, PER_PAGE)
      .then(res => {
        setCustomers(res.data.customers ?? []);
        setTotal(res.data.pagination.total);
        setSummary(res.data.summary);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load customers.'))
      .finally(() => setLoading(false));
  }, [storeId, page, activeTab]);

  function select(c: StoreCustomer) {
    setSel(c);
    setForm({ name: c.name, phone: c.phone ?? '', email: c.email });
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

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  const columns: TableColumn<StoreCustomer>[] = [
    {
      key: 'name', header: 'Customer',
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
      key: 'orderCount', header: 'Orders', align: 'center',
      render: c => <Badge color={c.orderCount > 1 ? 'green' : 'orange'}>{c.orderCount}</Badge>,
    },
    {
      key: 'totalSpent', header: 'Total Spent', align: 'right',
      render: c => <span className="font-semibold text-charcoal">{formatMoneyCompact(c.totalSpent, store?.baseCurrency)}</span>,
    },
    { key: 'lastOrderAt', header: 'Last Order', render: c => <span className="text-slate">{fmtDate(c.lastOrderAt)}</span> },
    { key: 'createdAt', header: 'Member Since', render: c => <span className="text-slate">{fmtDate(c.createdAt)}</span> },
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

      <div className="px-4 md:px-7 pt-3">
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'followers' ? (
        <div className="px-4 md:px-7 pt-5 pb-8">
          <FollowersTab />
        </div>
      ) : (
      <div className="px-4 md:px-7 pt-5 pb-8 flex flex-col gap-5">

        <div className="flex flex-wrap gap-3">
          <MetricCard label="Total Customers" value={total.toLocaleString()} icon={<Users size={16} />} loading={loading && page === 1 && customers.length === 0} />
          <MetricCard label="Total Orders"     value={summary.totalOrders.toLocaleString()} icon={<ShoppingBag size={16} />} loading={loading && page === 1 && customers.length === 0} />
          <MetricCard label="Total Revenue"    value={formatMoneyCompact(summary.totalRevenue, store?.baseCurrency)} icon={<DollarSign size={16} />} loading={loading && page === 1 && customers.length === 0} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
          <div className="bg-white border border-bone rounded-[10px] min-w-0 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-bone">
              <SearchInput value={search} onChange={setSearch} placeholder="Search customers…" className="max-w-[260px]" />
            </div>

            {error ? (
              <p className="p-4 text-xs text-error">{error}</p>
            ) : (
              <Table
                columns={columns}
                data={filtered}
                keyExtractor={c => c._id}
                onRowClick={select}
                loading={loading}
                pagination={{ page, total, perPage: PER_PAGE, onChange: setPage, label: 'customers' }}
                emptyState={{
                  icon: <Users size={28} className="text-brand-orange opacity-55" />,
                  title: 'No customers found for this store yet',
                  description: 'Customers who place an order from this store will show up here.',
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
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </>
  );
}
