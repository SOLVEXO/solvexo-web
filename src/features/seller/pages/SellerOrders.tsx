import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

// ── Data ──────────────────────────────────────────────────────────────────────
const ORDERS = [
  { id: '#8821', cust: 'Sarah M.',  initials: 'SM', email: 'sarah@email.com', product: 'Grade 5 Math Bundle',      type: 'Digital',  date: 'Today 2:14 PM',  amount: '$49.00', status: 'Paid'       },
  { id: '#8820', cust: 'David R.',  initials: 'DR', email: 'david@email.com', product: 'Fractions Mastery Kit',    type: 'Digital',  date: 'Today 11:03 AM', amount: '$18.00', status: 'Fulfilled'  },
  { id: '#8819', cust: 'Lena K.',   initials: 'LK', email: 'lena@email.com',  product: 'Handmade Ceramic Mug Set', type: 'Physical', date: 'Yesterday',      amount: '$58.00', status: 'Processing' },
  { id: '#8818', cust: 'Tom B.',    initials: 'TB', email: 'tom@email.com',   product: 'Science Lab Worksheets',   type: 'Digital',  date: 'Yesterday',      amount: '$15.00', status: 'Paid'       },
  { id: '#8817', cust: 'Amy L.',    initials: 'AL', email: 'amy@email.com',   product: 'Linen Wall Hanging',       type: 'Physical', date: 'May 18',         amount: '$72.00', status: 'Delivered'  },
  { id: '#8816', cust: 'Mike S.',   initials: 'MS', email: 'mike@email.com',  product: 'Lo-Fi Music Pack',         type: 'Digital',  date: 'May 18',         amount: '$19.00', status: 'Fulfilled'  },
  { id: '#8815', cust: 'Jane P.',   initials: 'JP', email: 'jane@email.com',  product: 'Creative Writing Prompts', type: 'Digital',  date: 'May 17',         amount: '$12.00', status: 'Refunded'   },
];

// ── Style maps ────────────────────────────────────────────────────────────────
const avatarColor: Record<string, { bg: string; color: string }> = {
  SM: { bg: '#FDECEA', color: '#C0392B' },
  DR: { bg: '#EAF3FB', color: '#2156A8' },
  LK: { bg: '#EAF7EF', color: '#1E7A3C' },
  TB: { bg: '#FFF4E5', color: '#B36200' },
  AL: { bg: '#F3EAFB', color: '#7A1EA8' },
  MS: { bg: '#E5F4FB', color: '#1A6A8A' },
  JP: { bg: '#FDECEA', color: '#C0392B' },
};

const statusStyle: Record<string, { bg: string; color: string }> = {
  Paid:       { bg: '#E3F4EA', color: '#1E7A3C' },
  Fulfilled:  { bg: '#EAF0FB', color: '#2156A8' },
  Processing: { bg: '#EAF0FB', color: '#2156A8' },
  Delivered:  { bg: '#E3F4EA', color: '#1E7A3C' },
  Refunded:   { bg: '#FDECEA', color: '#C0392B' },
  Pending:    { bg: '#FFF0E0', color: '#B36200' },
};

const typeStyle: Record<string, { bg: string; color: string }> = {
  Digital:  { bg: '#EAF0FB', color: '#2156A8' },
  Physical: { bg: '#FBECE4', color: '#C96847' },
};

const metrics = [
  { label: 'Total Orders', value: '284',     trend: '+12 this week',        sub: null,                  trendUp: true  },
  { label: 'Revenue',      value: '$12,480', trend: '+8.4%',                sub: null,                  trendUp: true  },
  { label: 'Pending',      value: '6',       trend: null,                   sub: 'Awaiting fulfillment', trendUp: false },
  { label: 'Avg Order',    value: '$43.94',  trend: '+$2.10 vs last month', sub: null,                  trendUp: true  },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerOrders() {
  usePageTitle('Orders');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type,   setType]   = useState('');
  const [time,   setTime]   = useState('');

  const filtered = ORDERS.filter(o => {
    const q = search.toLowerCase();
    if (q && !o.id.toLowerCase().includes(q) && !o.cust.toLowerCase().includes(q) && !o.product.toLowerCase().includes(q)) return false;
    if (status && status !== 'All Status' && o.status !== status) return false;
    if (type   && type   !== 'All Types'  && o.type   !== type)   return false;
    return true;
  });

  return (
    <>
      <SellerPageHeader
        title="Orders"
        subtitle="Track and manage all customer orders."
        actions={
          <>
            <button className="px-4 py-[7px] bg-white border border-bone rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer">
              Export CSV
            </button>
            <button className="px-4 py-[7px] bg-brand-orange border-0 rounded-lg text-xs font-semibold text-white cursor-pointer">
              Bulk Actions
            </button>
          </>
        }
      />

      <div className="px-7 pt-5 pb-8 flex flex-col gap-5">

        {/* ── Metrics row (separate cards) ── */}
        <div className="grid grid-cols-4 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="bg-white border border-bone rounded-[10px] px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">
                {m.label}
              </p>
              <p className="text-[28px] font-bold text-charcoal leading-[1.15]">
                {m.value}
              </p>
              {m.trend && (
                <p className="text-xs text-[#2D8A4E] mt-1">▲ {m.trend}</p>
              )}
              {m.sub && (
                <p className="text-xs text-slate mt-1">{m.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* ── Table card ── */}
        <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 pt-5 pb-4">

          {/* Filter row */}
          <div className="flex gap-[10px] mb-4 flex-wrap items-center">
            {/* Search */}
            <div className="flex items-center gap-[6px] border border-bone rounded-lg px-3 bg-white shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8C8A82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                placeholder="Search orders..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="border-0 outline-none text-[13px] py-2 w-[200px] text-[#2C2A28] bg-transparent"
              />
            </div>

            {/* Dropdowns */}
            {[
              { value: status, set: setStatus, options: ['All Status','Paid','Pending','Processing','Fulfilled','Delivered','Refunded'] },
              { value: type,   set: setType,   options: ['All Types','Physical','Digital'] },
              { value: time,   set: setTime,   options: ['All Time','Today','Last 7 days','This month'] },
            ].map((s, i) => (
              <select
                key={i}
                value={s.value || s.options[0]}
                onChange={e => s.set(e.target.value)}
                className="text-[13px] px-3 py-2 rounded-lg border border-bone bg-white text-[#2C2A28] outline-none cursor-pointer"
              >
                {s.options.map(o => <option key={o}>{o}</option>)}
              </select>
            ))}

            <button
              onClick={() => { setSearch(''); setStatus(''); setType(''); setTime(''); }}
              className="px-[14px] py-2 bg-transparent border border-bone rounded-lg text-xs text-slate cursor-pointer"
            >
              Clear Filters
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Order','Customer','Product','Type','Date','Amount','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-[14px] py-[10px] text-[11px] font-semibold text-slate uppercase tracking-[0.05em] border-b border-bone bg-[#FAF9F5] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const av = avatarColor[o.initials] ?? { bg: '#F0EEE6', color: '#5A5852' };
                  const st = statusStyle[o.status]   ?? { bg: '#F0EEE6', color: '#5A5852' };
                  const ty = typeStyle[o.type]        ?? { bg: '#F0EEE6', color: '#5A5852' };
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-[#F0EEE6] transition-[background] duration-[0.12s]"
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Order ID */}
                      <td className="px-[14px] py-[13px]">
                        <span className="text-[13px] font-bold text-[#B95A3A]">
                          {o.id}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="px-[14px] py-[13px]">
                        <div className="flex items-center gap-[10px]">
                          <div
                            className="w-7 h-7 rounded-full text-[9px] font-bold shrink-0 flex items-center justify-center"
                            style={{ background: av.bg, color: av.color }}
                          >
                            {o.initials}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-charcoal leading-[1.3] m-0">
                              {o.cust}
                            </p>
                            <p className="text-[11px] text-slate leading-[1.3] m-0">
                              {o.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="px-[14px] py-[13px] text-xs text-[#2C2A28]">
                        {o.product}
                      </td>

                      {/* Type badge */}
                      <td className="px-[14px] py-[13px]">
                        <span
                          className="inline-block px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold"
                          style={{ background: ty.bg, color: ty.color }}
                        >
                          {o.type}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-[14px] py-[13px] text-xs text-slate whitespace-nowrap">
                        {o.date}
                      </td>

                      {/* Amount */}
                      <td className="px-[14px] py-[13px] text-[13px] font-bold text-charcoal">
                        {o.amount}
                      </td>

                      {/* Status badge */}
                      <td className="px-[14px] py-[13px]">
                        <span
                          className="inline-block px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold"
                          style={{ background: st.bg, color: st.color }}
                        >
                          {o.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-[14px] py-[13px]">
                        <div className="flex items-center gap-[6px]">
                          <button className="px-3 py-1 bg-transparent border border-bone rounded-md text-xs text-[#4A4945] cursor-pointer">
                            View
                          </button>
                          {o.status === 'Paid' && (
                            <button className="px-3 py-1 bg-brand-orange border-0 rounded-md text-xs font-semibold text-white cursor-pointer">
                              Fulfill
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-[14px] py-10 text-center text-slate text-[13px]">
                      No orders match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-slate">
              Showing {filtered.length} of 284 orders
            </span>
            <div className="flex items-center gap-1">
              {([<ChevronLeft size={14} />, '1', '2', '3', '…', '28', <ChevronRight size={14} />] as ReactNode[]).map((p, i) => (
                <button
                  key={i}
                  className="w-7 h-7 rounded-md text-xs flex items-center justify-center cursor-pointer"
                  style={{
                    fontWeight: p === '1' ? 600 : 400,
                    border: `1px solid ${p === '1' ? '#D97757' : '#E8E6DC'}`,
                    background: p === '1' ? '#D97757' : 'transparent',
                    color: p === '1' ? '#fff' : '#2C2A28',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
