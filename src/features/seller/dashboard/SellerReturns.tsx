import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

// ── Data ──────────────────────────────────────────────────────────────────────
const RETURNS = [
  { rma: 'RMA-041', order: '#8802', customer: 'David Reynolds', product: 'Fractions Mastery Kit',   reason: 'Wrong item received',    amount: '$18.00', status: 'Approved',          date: 'May 18' },
  { rma: 'RMA-040', order: '#8799', customer: 'Lena Kowalski',  product: 'Ceramic Mug — Sage',      reason: 'Arrived damaged',        amount: '$28.00', status: 'Replacement Sent',  date: 'May 16' },
  { rma: 'RMA-039', order: '#8795', customer: 'Mike Svensson',  product: 'Lo-Fi Music Pack',         reason: 'Not as described',       amount: '$24.00', status: 'Under Review',      date: 'May 15' },
  { rma: 'RMA-038', order: '#8780', customer: 'Jane Park',      product: 'Geometric Mug — Navy',     reason: 'Defective product',      amount: '$32.00', status: 'Refunded',          date: 'May 12' },
  { rma: 'RMA-037', order: '#8761', customer: 'Carlos Mendez',  product: 'Writing Prompts Vol.1',    reason: 'Accidentally purchased', amount: '$12.00', status: 'Declined',          date: 'May 8'  },
];

const statusStyle: Record<string, { bg: string; color: string }> = {
  'Approved':         { bg: '#EAF0FB', color: '#2156A8' },
  'Replacement Sent': { bg: '#E3F4EA', color: '#1E7A3C' },
  'Under Review':     { bg: '#FFF4DC', color: '#B36200' },
  'Refunded':         { bg: '#E3F4EA', color: '#1E7A3C' },
  'Declined':         { bg: '#FDECEA', color: '#C0392B' },
};

const metrics = [
  { label: 'Open Requests',  value: '2',       trend: null,             sub: 'Awaiting action' },
  { label: 'Return Rate',    value: '2.1%',    trend: '↓ Below avg (5%)', sub: null           },
  { label: 'Total Refunded', value: '$860',    trend: null,             sub: 'Last 30 days'   },
  { label: 'Avg Resolution', value: '1.4 days',trend: '↑ Fast',         sub: null            },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerReturns() {
  usePageTitle('Returns');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type,   setType]   = useState('');

  const filtered = RETURNS.filter(r => {
    const q = search.toLowerCase();
    if (q && !r.rma.toLowerCase().includes(q) && !r.customer.toLowerCase().includes(q) && !r.product.toLowerCase().includes(q)) return false;
    if (status && status !== 'All Status' && r.status !== status) return false;
    return true;
  });

  return (
    <>
      <SellerPageHeader
        title="Returns & Refunds"
        subtitle="Process return requests, issue refunds, and send replacements."
        actions={
          <button className="px-4 py-[7px] bg-white border border-[#E8E6DC] rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer">
            Export Report
          </button>
        }
      />

      <div className="px-7 pb-8 pt-5 flex flex-col gap-5">

        {/* ── Metrics row ── */}
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {metrics.map((m) => (
            <div key={m.label} className="bg-white border border-[#E8E6DC] rounded-[10px] px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <p className="text-[11px] font-medium text-[#8C8A82] uppercase tracking-[0.06em] mb-1">
                {m.label}
              </p>
              <p className="text-[28px] font-bold text-[#141413] leading-[1.15]">
                {m.value}
              </p>
              {m.trend && (
                <p className="text-xs text-[#2D8A4E] mt-1">▲ {m.trend}</p>
              )}
              {m.sub && (
                <p className="text-xs text-[#8C8A82] mt-1">{m.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* ── Return Policy Summary ── */}
        <div className="bg-white border border-[#E8E6DC] rounded-[10px] px-[22px] py-[18px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-[#141413] mb-1.5">
              Return Policy Summary
            </p>
            <p className="text-[13px] text-[#8C8A82] leading-[1.6]">
              Physical: 30-day returns in original condition. Digital: Non-refundable unless defective. Damaged items: replacement or full refund.
            </p>
          </div>
          <button className="px-[14px] py-[7px] bg-white border border-[#E8E6DC] rounded-lg text-xs text-[#4A4945] cursor-pointer shrink-0">
            Edit Policy
          </button>
        </div>

        {/* ── Table card ── */}
        <div className="bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">

          {/* Filters */}
          <div className="flex items-center gap-[10px] px-5 py-[14px] border-b border-[#E8E6DC] flex-wrap">
            {/* Search */}
            <div className="flex items-center gap-1.5 border border-[#E8E6DC] rounded-lg px-3 bg-white">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8C8A82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                placeholder="Search RMA ID or order..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="border-none outline-none text-[13px] py-2 w-[220px] text-[#2C2A28]"
              />
            </div>

            {/* Status dropdown */}
            <select
              value={status || 'All Status'}
              onChange={e => setStatus(e.target.value === 'All Status' ? '' : e.target.value)}
              className="text-[13px] px-3 py-2 rounded-lg border border-[#E8E6DC] bg-white text-[#2C2A28] outline-none cursor-pointer"
            >
              {['All Status','Approved','Replacement Sent','Under Review','Refunded','Declined'].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>

            {/* Type dropdown */}
            <select
              value={type || 'All Types'}
              onChange={e => setType(e.target.value === 'All Types' ? '' : e.target.value)}
              className="text-[13px] px-3 py-2 rounded-lg border border-[#E8E6DC] bg-white text-[#2C2A28] outline-none cursor-pointer"
            >
              {['All Types','Physical','Digital'].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['RMA','Order','Customer','Product','Reason','Amount','Status','Date','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-[10px] text-[11px] font-semibold text-[#8C8A82] uppercase tracking-[0.05em] border-b border-[#E8E6DC] bg-[#FAF9F5] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const st = statusStyle[r.status] ?? { bg: '#F0EEE6', color: '#5A5852' };
                  return (
                    <tr
                      key={r.rma}
                      className="transition-[background] duration-[120ms]"
                      style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F0EEE6' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* RMA */}
                      <td className="px-4 py-[13px] whitespace-nowrap">
                        <span className="text-[13px] font-bold text-[#B95A3A]">{r.rma}</span>
                      </td>

                      {/* Order */}
                      <td className="px-4 py-[13px] whitespace-nowrap">
                        <span className="text-[13px] font-medium text-[#141413]">{r.order}</span>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-[13px] text-[13px] text-[#4A4945] whitespace-nowrap">
                        {r.customer}
                      </td>

                      {/* Product */}
                      <td className="px-4 py-[13px] text-[13px] text-[#4A4945] max-w-[180px]">
                        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                          {r.product}
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-[13px] text-[13px] text-[#8C8A82] max-w-[180px]">
                        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                          {r.reason}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-[13px] text-[13px] font-semibold text-[#141413] whitespace-nowrap">
                        {r.amount}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-[13px]">
                        <span
                          className="inline-block px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold whitespace-nowrap"
                          style={{ background: st.bg, color: st.color }}
                        >
                          {r.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-[13px] text-xs text-[#8C8A82] whitespace-nowrap">
                        {r.date}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-[13px]">
                        <button
                          className="px-[14px] py-1 bg-white border border-[#E8E6DC] rounded-[6px] text-xs text-[#4A4945] cursor-pointer whitespace-nowrap"
                          onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-[40px] text-center text-[13px] text-[#8C8A82]">
                      No return requests match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-[#E8E6DC]">
            <span className="text-xs text-[#8C8A82]">
              Showing {filtered.length} of {RETURNS.length} return requests
            </span>
          </div>

        </div>
      </div>
    </>
  );
}
