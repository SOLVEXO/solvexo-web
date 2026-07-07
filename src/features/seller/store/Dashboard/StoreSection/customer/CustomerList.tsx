import { useEffect, useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { apiGetStoreCustomers, apiUpdateStoreCustomer, type StoreCustomer } from '@/api/services/store';

function initialsOf(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
}

export default function StoreCustomerList() {
  usePageTitle('Customers');
  const { storeId } = useStoreWorkspace();

  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<StoreCustomer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sel, setSel] = useState<StoreCustomer | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    apiGetStoreCustomers(storeId)
      .then(res => { setCustomers(res.data.customers); setTotal(res.data.pagination.total); })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load customers.'))
      .finally(() => setLoading(false));
  }, [storeId]);

  function select(c: StoreCustomer) {
    setSel(c);
    setForm({ name: c.name, phone: c.phone ?? '', email: c.email });
  }

  async function saveEdit() {
    if (!sel) return;
    setSaving(true);
    try {
      const res = await apiUpdateStoreCustomer(storeId, sel._id, form);
      setCustomers(prev => prev.map(c => c._id === sel._id ? res.data : c));
      setSel(res.data);
    } finally {
      setSaving(false);
    }
  }

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  return (
    <>
      <SellerPageHeader
        title="Customers"
        subtitle="Manage buyer relationships for this store."
      />

      <div className="px-7 pt-5 pb-8 flex flex-col gap-5">

        <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-4 max-w-[220px]">
          <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">Total Customers</p>
          <p className="text-[28px] font-bold text-carbon leading-[1.15]">{total}</p>
        </div>

        <div className="flex gap-4 items-start">
          <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] flex-1 min-w-0 overflow-hidden">
            <div className="flex gap-2.5 px-5 py-3.5 border-b border-bone">
              <div className="flex items-center gap-1.5 border border-bone rounded-lg px-3 bg-white flex-1 max-w-[260px]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8C8A82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)}
                  className="border-none outline-none text-[13px] py-2 w-full text-charcoal bg-transparent" />
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <p className="p-4 text-xs text-slate">Loading…</p>
              ) : error ? (
                <p className="p-4 text-xs text-error">{error}</p>
              ) : filtered.length === 0 ? (
                <p className="p-8 text-center text-xs text-slate">No customers found for this store yet.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['Customer', 'Phone', 'Member Since', ''].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate uppercase tracking-[0.05em] border-b border-bone bg-cream whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c, i) => (
                      <tr key={c._id} onClick={() => select(c)}
                        className="cursor-pointer"
                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F0EEE6' : 'none', background: sel?._id === c._id ? '#FBECE4' : 'transparent' }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-[30px] h-[30px] rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 bg-[#F0EEE6] text-[#5A5852]">{initialsOf(c.name)}</div>
                            <div>
                              <p className="text-[13px] font-semibold text-charcoal leading-[1.3]">{c.name}</p>
                              <p className="text-[11px] text-slate">{c.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-slate">{c.phone || '—'}</td>
                        <td className="px-4 py-3 text-[13px] text-slate">{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button onClick={e => { e.stopPropagation(); select(c); }} className="text-xs font-medium text-brand-orange bg-transparent border-none cursor-pointer">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Edit panel */}
          {sel && (
            <div className="w-[300px] shrink-0">
              <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-[18px] py-5 sticky top-[70px]">
                <div className="flex flex-col items-center text-center pb-4 border-b border-[#F0EEE6] mb-3.5">
                  <div className="w-[52px] h-[52px] rounded-full text-base font-bold flex items-center justify-center mb-2.5 bg-[#F0EEE6] text-[#5A5852]">
                    {initialsOf(sel.name)}
                  </div>
                  <p className="text-[15px] font-bold text-carbon mb-[3px]">{sel.name}</p>
                  <p className="text-xs text-slate">Customer since {new Date(sel.createdAt).toLocaleDateString()}</p>
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
    </>
  );
}
