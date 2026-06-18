import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Mail, Gift } from 'lucide-react';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

// ── Data ──────────────────────────────────────────────────────────────────────
type Segment = 'VIP' | 'Loyal' | 'Returning' | 'New' | 'At Risk';

interface Customer {
  id: string; name: string; initials: string; email: string;
  orders: number; ltv: string; lastOrder: string; segment: Segment; joined: string;
}

const CUSTOMERS: Customer[] = [
  { id: 'C-1001', name: 'Sarah Mitchell', initials: 'SM', email: 'sarah@email.com',  orders: 14, ltv: '$612',   lastOrder: 'Today',     segment: 'VIP',       joined: 'Jan 2024' },
  { id: 'C-1002', name: 'David Reynolds', initials: 'DR', email: 'david@email.com',  orders: 9,  ltv: '$387',   lastOrder: 'Yesterday', segment: 'Loyal',     joined: 'Mar 2024' },
  { id: 'C-1003', name: 'Lena Kowalski',  initials: 'LK', email: 'lena@email.com',   orders: 3,  ltv: '$134',   lastOrder: 'May 10',    segment: 'New',       joined: 'Apr 2025' },
  { id: 'C-1004', name: 'Tom Barnes',     initials: 'TB', email: 'tom@email.com',    orders: 21, ltv: '$1,042', lastOrder: 'May 14',    segment: 'VIP',       joined: 'Nov 2023' },
  { id: 'C-1005', name: 'Amy Liu',        initials: 'AL', email: 'amy@email.com',    orders: 6,  ltv: '$228',   lastOrder: 'May 8',     segment: 'Returning', joined: 'Feb 2024' },
  { id: 'C-1006', name: 'Mike Svensson',  initials: 'MS', email: 'mike@email.com',   orders: 1,  ltv: '$49',    lastOrder: 'May 16',    segment: 'New',       joined: 'May 2025' },
  { id: 'C-1007', name: 'Jane Park',      initials: 'JP', email: 'jane@email.com',   orders: 0,  ltv: '$0',     lastOrder: '—',         segment: 'At Risk',   joined: 'Dec 2023' },
  { id: 'C-1008', name: 'Carlos Mendez',  initials: 'CM', email: 'carlos@email.com', orders: 11, ltv: '$504',   lastOrder: 'Apr 30',    segment: 'Loyal',     joined: 'Jun 2024' },
];

const avatarColors: Record<string, { bg: string; color: string }> = {
  SM: { bg: '#FDECEA', color: '#C0392B' }, DR: { bg: '#EAF3FB', color: '#2156A8' },
  LK: { bg: '#EAF7EF', color: '#1E7A3C' }, TB: { bg: '#FFF4E5', color: '#B36200' },
  AL: { bg: '#F3EAFB', color: '#7A1EA8' }, MS: { bg: '#E5F4FB', color: '#1A6A8A' },
  JP: { bg: '#FDECEA', color: '#C0392B' }, CM: { bg: '#EAF7EF', color: '#1E7A3C' },
};

const segmentStyle: Record<Segment, { bg: string; color: string }> = {
  VIP:       { bg: '#FBECE4', color: '#C96847' },
  Loyal:     { bg: '#E3F4EA', color: '#1E7A3C' },
  Returning: { bg: '#EAF0FB', color: '#2156A8' },
  New:       { bg: '#F0EEE6', color: '#5A5852' },
  'At Risk': { bg: '#FDECEA', color: '#C0392B' },
};

const SEGMENT_PILLS = [
  { label: 'All',       count: 1284 },
  { label: 'VIP',       count: 94   },
  { label: 'Loyal',     count: 312  },
  { label: 'Returning', count: 478  },
  { label: 'New',       count: 362  },
  { label: 'At Risk',   count: 38   },
];

const metrics = [
  { label: 'Total Customers',    value: '1,284', trend: '+48 this month',       sub: null,                    trendUp: true  },
  { label: 'Avg Lifetime Value', value: '$247',  trend: '+$18 vs last month',   sub: null,                    trendUp: true  },
  { label: 'Repeat Rate',        value: '62%',   trend: 'Healthy',              sub: null,                    trendUp: true  },
  { label: 'At Risk',            value: '38',    trend: null,                   sub: 'No purchase in 90 days',trendUp: false },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────
export default function StoreCustomerList() {
  usePageTitle('Customers');
  const [search,     setSearch]     = useState('');
  const [seg,        setSeg]        = useState('');
  const [sort,       setSort]       = useState('');
  const [filterPill, setFilterPill] = useState('All');
  const [sel,        setSel]        = useState<Customer | null>(null);

  const filtered = CUSTOMERS.filter(c => {
    const q = search.toLowerCase();
    if (q && !c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q) && !c.id.toLowerCase().includes(q)) return false;
    if (seg && seg !== 'All Segments' && c.segment !== seg) return false;
    if (filterPill !== 'All' && c.segment !== filterPill) return false;
    return true;
  });

  return (
    <>
      <SellerPageHeader
        title="Customers"
        subtitle="Manage buyer relationships, segments and loyalty."
        actions={
          <>
            <button className="px-4 py-[7px] bg-white border border-[#E8E6DC] rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer">
              Export CSV
            </button>
            <button className="px-4 py-[7px] bg-brand-orange border-none rounded-lg text-xs font-semibold text-white cursor-pointer">
              + Add Customer
            </button>
          </>
        }
      />

      <div className="px-7 pt-5 pb-8 flex flex-col gap-5">

        {/* ── Metrics ── */}
        <div className="grid grid-cols-4 gap-3">
          {metrics.map(m => (
            <div key={m.label} className="bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-4">
              <p className="text-[11px] font-medium text-[#8C8A82] uppercase tracking-[0.06em] mb-1">{m.label}</p>
              <p className="text-[28px] font-bold text-[#141413] leading-[1.15]">{m.value}</p>
              {m.trend && <p className="text-xs text-[#2D8A4E] mt-1">▲ {m.trend}</p>}
              {m.sub   && <p className="text-xs text-[#8C8A82] mt-1">{m.sub}</p>}
            </div>
          ))}
        </div>

        {/* ── Segment pills ── */}
        <div className="flex items-center gap-2 flex-wrap">
          {SEGMENT_PILLS.map(pill => {
            const active = filterPill === pill.label;
            const st = pill.label === 'All' ? { bg: '#F0EEE6', color: '#5A5852' } : segmentStyle[pill.label as Segment] ?? { bg: '#F0EEE6', color: '#5A5852' };
            return (
              <button
                key={pill.label}
                onClick={() => setFilterPill(pill.label)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[20px] cursor-pointer text-xs font-medium transition-all duration-[120ms]"
                style={{
                  border: `1px solid ${active ? '#D97757' : '#E8E6DC'}`,
                  background: active ? '#FBECE4' : '#fff',
                  color: active ? '#B95A3A' : '#2C2A28',
                }}
              >
                {pill.label}
                <span
                  className="px-[7px] py-[1px] rounded text-[11px] font-semibold"
                  style={{
                    background: active ? '#fff' : st.bg,
                    color: active ? '#B95A3A' : st.color,
                  }}
                >
                  {pill.count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Table + Detail ── */}
        <div className="flex gap-4 items-start">

          {/* Table */}
          <div className="bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] flex-1 min-w-0 overflow-hidden">
            {/* Filters */}
            <div className="flex gap-2.5 px-5 py-3.5 border-b border-[#E8E6DC] flex-wrap items-center">
              <div className="flex items-center gap-1.5 border border-[#E8E6DC] rounded-lg px-3 bg-white flex-1 max-w-[260px]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8C8A82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)}
                  className="border-none outline-none text-[13px] py-2 w-full text-[#2C2A28] bg-transparent" />
              </div>
              <select value={seg} onChange={e => setSeg(e.target.value)}
                className="w-[150px] px-3 py-2 text-[13px] border border-[#E8E6DC] rounded-lg outline-none text-[#2C2A28] bg-white cursor-pointer box-border">
                {['All Segments','VIP','Loyal','Returning','New','At Risk'].map(o => <option key={o}>{o}</option>)}
              </select>
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="w-[160px] px-3 py-2 text-[13px] border border-[#E8E6DC] rounded-lg outline-none text-[#2C2A28] bg-white cursor-pointer box-border">
                {['Sort: Default','Highest LTV','Most Orders','Recently Active','Newest'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Customer','Orders','Lifetime Value','Last Order','Segment','Joined',''].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-[#8C8A82] uppercase tracking-[0.05em] border-b border-[#E8E6DC] bg-[#FAF9F5] whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => {
                    const av = avatarColors[c.initials] ?? { bg: '#F0EEE6', color: '#5A5852' };
                    const sg = segmentStyle[c.segment];
                    return (
                      <tr key={c.id} onClick={() => setSel(sel?.id === c.id ? null : c)}
                        className="cursor-pointer transition-colors duration-[120ms]"
                        style={{
                          borderBottom: i < filtered.length - 1 ? '1px solid #F0EEE6' : 'none',
                          background: sel?.id === c.id ? '#FBECE4' : 'transparent',
                        }}
                        onMouseEnter={e => { if (sel?.id !== c.id) e.currentTarget.style.background = '#FAF9F5'; }}
                        onMouseLeave={e => { if (sel?.id !== c.id) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-[30px] h-[30px] rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
                              style={{ background: av.bg, color: av.color }}
                            >{c.initials}</div>
                            <div>
                              <p className="text-[13px] font-semibold text-[#2C2A28] leading-[1.3]">{c.name}</p>
                              <p className="text-[11px] text-[#8C8A82]">{c.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[13px] font-semibold text-[#2C2A28]">{c.orders}</td>
                        <td className="px-4 py-3 text-[13px] font-semibold text-[#2C2A28]">{c.ltv}</td>
                        <td className="px-4 py-3 text-[13px] text-[#8C8A82]">{c.lastOrder}</td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2.5 py-[3px] rounded-[5px] text-[11px] font-semibold"
                            style={{ background: sg.bg, color: sg.color }}
                          >{c.segment}</span>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-[#8C8A82]">{c.joined}</td>
                        <td className="px-4 py-3">
                          <button onClick={e => { e.stopPropagation(); setSel(sel?.id === c.id ? null : c); }}
                            className="text-xs font-medium text-brand-orange bg-transparent border-none cursor-pointer">
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail panel */}
          {sel && (
            <div className="w-[300px] shrink-0">
              <div className="bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-[18px] py-5 sticky top-[70px]">
                {/* Avatar + name */}
                <div className="flex flex-col items-center text-center pb-4 border-b border-[#F0EEE6] mb-3.5">
                  <div
                    className="w-[52px] h-[52px] rounded-full text-base font-bold flex items-center justify-center mb-2.5"
                    style={{ background: avatarColors[sel.initials]?.bg ?? '#F0EEE6', color: avatarColors[sel.initials]?.color ?? '#5A5852' }}
                  >
                    {sel.initials}
                  </div>
                  <p className="text-[15px] font-bold text-[#141413] mb-[3px]">{sel.name}</p>
                  <p className="text-xs text-[#8C8A82] mb-2">{sel.email}</p>
                  <span
                    className="px-3 py-[3px] rounded-[20px] text-[11px] font-semibold"
                    style={{ background: segmentStyle[sel.segment].bg, color: segmentStyle[sel.segment].color }}
                  >
                    {sel.segment}
                  </span>
                </div>

                {/* Stats table */}
                <table className="w-full border-collapse text-xs mb-3.5">
                  <tbody>
                    {[['Customer ID', sel.id],['Member Since', sel.joined],['Total Orders', String(sel.orders)],['Lifetime Value', sel.ltv],['Last Purchase', sel.lastOrder]].map(([label, value]) => (
                      <tr key={label} className="border-b border-[#F0EEE6]">
                        <td className="py-[7px] text-[#8C8A82]">{label}</td>
                        <td className="py-[7px] font-semibold text-[#141413] text-right">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Recent orders */}
                <p className="text-[11px] font-semibold text-[#8C8A82] uppercase tracking-[0.07em] mb-2">Recent Orders</p>
                <div className="flex flex-col gap-1.5 mb-4">
                  {sel.orders > 0 ? (
                    [{ id: '#8821', product: 'Grade 5 Math Bundle', amount: '$49.00', status: 'Paid' },
                     { id: '#8820', product: 'Fractions Kit', amount: '$18.00', status: 'Fulfilled' }]
                    .slice(0, Math.min(sel.orders, 2)).map(o => (
                      <div key={o.id} className="flex justify-between items-center bg-[#FAF9F5] rounded-lg px-3 py-[9px]">
                        <div>
                          <p className="text-[11px] font-semibold text-[#141413]">{o.id}</p>
                          <p className="text-[11px] text-[#8C8A82]">{o.product}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-[#141413] mb-[3px]">{o.amount}</p>
                          <span
                            className="text-[10px] font-semibold px-[7px] py-[2px] rounded"
                            style={{ background: o.status === 'Paid' ? '#E3F4EA' : '#EAF0FB', color: o.status === 'Paid' ? '#1E7A3C' : '#2156A8' }}
                          >
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#8C8A82] italic">No orders yet</p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-white border border-[#E8E6DC] rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer flex items-center justify-center gap-[5px]">
                    <Mail size={13} /> Email
                  </button>
                  <button className="flex-1 py-2 bg-white border border-[#E8E6DC] rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer flex items-center justify-center gap-[5px]">
                    <Gift size={13} /> Loyalty Gift
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
