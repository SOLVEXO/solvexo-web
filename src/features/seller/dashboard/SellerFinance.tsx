import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { ArrowRight } from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────
const TRANSACTIONS = [
  { date: 'May 20', description: 'Payout — Bank Transfer',       type: 'Payout', amount: '-$2,840.00', positive: false, balance: '$320.40'   },
  { date: 'May 18', description: 'Sale — Grade 5 Math Bundle × 6',type: 'Sale',   amount: '+$294.00',   positive: true,  balance: '$3,160.40' },
  { date: 'May 17', description: 'Sale — Fractions Kit × 3',      type: 'Sale',   amount: '+$54.00',    positive: true,  balance: '$2,866.40' },
  { date: 'May 17', description: 'Platform Fee (8%)',              type: 'Fee',    amount: '-$27.84',    positive: false, balance: '$2,812.40' },
  { date: 'May 16', description: 'Refund — Order #8815',           type: 'Refund', amount: '-$12.00',    positive: false, balance: '$2,840.24' },
  { date: 'May 15', description: 'Sale — Ceramic Mug Set',         type: 'Sale',   amount: '+$58.00',    positive: true,  balance: '$2,852.24' },
];

const typeStyle: Record<string, { bg: string; color: string }> = {
  Sale:   { bg: '#E3F4EA', color: '#1E7A3C' },
  Payout: { bg: '#F0EEE6', color: '#5A5852' },
  Fee:    { bg: '#FFF4DC', color: '#B36200' },
  Refund: { bg: '#FDECEA', color: '#C0392B' },
};

const TAX_REPORTS = [
  { name: 'Q1 2025 Summary', period: 'Jan–Mar',  date: 'Generated Apr 1, 2025'  },
  { name: 'Q4 2024 Summary', period: 'Oct–Dec',  date: 'Generated Jan 2, 2025'  },
  { name: 'Annual 2024',     period: 'Full Year', date: 'Generated Feb 5, 2025' },
];

const metrics = [
  { label: 'This Month Revenue', value: '$9,100',  trend: '+23% vs last month', sub: null,              trendUp: true  },
  { label: 'Platform Fees',      value: '$728',    trend: null,                 sub: '8% of revenue',   trendUp: false },
  { label: 'Total Paid Out',     value: '$24,800', trend: null,                 sub: 'All time',         trendUp: false },
  { label: 'Pending Tax',        value: '$1,240',  trend: null,                 sub: 'Est. for Q2 2025', trendUp: false },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerFinance() {
  usePageTitle('Finance');

  return (
    <>
      <SellerPageHeader
        title="Finance & Payouts"
        subtitle="Track earnings, payouts, fees, and tax reports."
        actions={
          <>
            <button className="px-4 py-[7px] bg-white border border-[#E8E6DC] rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer">
              Download Tax Report
            </button>
            <button className="px-4 py-[7px] bg-brand-orange border-none rounded-lg text-xs font-semibold text-white cursor-pointer">
              Request Payout
            </button>
          </>
        }
      />

      <div className="px-7 pt-5 pb-8 flex flex-col gap-5">

        {/* ── Balance Card ── */}
        <div className="bg-[#141413] rounded-xl px-7 py-6 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-semibold text-[#8C8A82] uppercase tracking-[0.1em] mb-2">
              Available Balance
            </p>
            <p className="text-[32px] font-bold text-white leading-[1.1] mb-3">$3,160.40</p>
            <div className="flex items-center gap-6">
              <span className="text-[11px] text-[#8C8A82]">Pending: <span className="text-white font-medium">$840.00</span></span>
              <span className="text-[11px] text-brand-orange font-medium">Next Payout: May 25</span>
              <span className="text-[11px] text-[#8C8A82]">Method: Bank ••4821</span>
            </div>
          </div>
          <button className="px-5 py-2.5 bg-brand-orange border-none rounded-lg text-[13px] font-semibold text-white cursor-pointer flex items-center gap-1.5">
            Request Payout <ArrowRight size={14} />
          </button>
        </div>

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

        {/* ── 2-col layout ── */}
        <div className="flex gap-4 items-start">

          {/* LEFT — Transaction History */}
          <div className="flex-1 min-w-0 bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8E6DC] flex-wrap gap-2.5">
              <p className="text-sm font-semibold text-[#141413]">Transaction History</p>
              <div className="flex items-center gap-2">
                <select className="px-3 py-[7px] text-[13px] border border-[#E8E6DC] rounded-lg bg-white text-[#2C2A28] outline-none cursor-pointer">
                  <option>All Types</option>
                  <option>Sale</option>
                  <option>Payout</option>
                  <option>Fee</option>
                  <option>Refund</option>
                </select>
                <button className="px-3.5 py-[7px] bg-white border border-[#E8E6DC] rounded-lg text-xs text-[#4A4945] cursor-pointer">
                  Export CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Date','Description','Type','Amount','Balance'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-[#8C8A82] uppercase tracking-[0.05em] border-b border-[#E8E6DC] bg-[#FAF9F5] whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TRANSACTIONS.map((t, i) => {
                    const ts = typeStyle[t.type] ?? { bg: '#F0EEE6', color: '#5A5852' };
                    return (
                      <tr key={i}
                        className="transition-colors duration-[120ms]"
                        style={{ borderBottom: i < TRANSACTIONS.length - 1 ? '1px solid #F0EEE6' : 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td className="px-4 py-3 text-[13px] text-[#8C8A82] whitespace-nowrap">{t.date}</td>
                        <td className="px-4 py-3 text-[13px] text-[#4A4945]">{t.description}</td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2.5 py-[3px] rounded-[5px] text-[11px] font-semibold"
                            style={{ background: ts.bg, color: ts.color }}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 text-[13px] font-semibold whitespace-nowrap"
                          style={{ color: t.positive ? '#2D8A4E' : '#C13030' }}
                        >
                          {t.amount}
                        </td>
                        <td className="px-4 py-3 text-[13px] font-medium text-[#141413] whitespace-nowrap">
                          {t.balance}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT — 3 stacked cards */}
          <div className="w-[280px] shrink-0 flex flex-col gap-3.5">

            {/* Payout Schedule */}
            <div className="bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-[18px] py-4">
              <p className="text-[13px] font-semibold text-[#141413] mb-3">Payout Schedule</p>
              <div className="flex flex-col gap-2.5">
                {[['Frequency','Weekly (Every Monday)'],['Method','Bank Transfer ••4821'],['Currency','USD'],['Minimum','$50.00']].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-[#8C8A82]">{label}</span>
                    <span className="text-xs font-medium text-[#4A4945]">{val}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#F0EEE6]">
                <button className="px-3.5 py-1.5 bg-white border border-[#E8E6DC] rounded-[7px] text-xs text-[#4A4945] cursor-pointer">
                  Update Payout Method
                </button>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-[18px] py-4">
              <p className="text-[13px] font-semibold text-[#141413] mb-3">Fee Breakdown</p>
              <div className="flex flex-col gap-2.5">
                {[['Marketplace Listing Fee','Free'],['Transaction Fee','8% per sale'],['Payment Processing','2.9% + $0.30'],['Digital Delivery','Included'],['AI Credits','750 / month']].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-[#8C8A82]">{label}</span>
                    <span className="text-xs font-medium text-[#4A4945]">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax Reports */}
            <div className="bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-[18px] py-4">
              <p className="text-[13px] font-semibold text-[#141413] mb-3">Tax Reports</p>
              <div className="flex flex-col gap-3">
                {TAX_REPORTS.map(r => (
                  <div key={r.name} className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#4A4945] leading-[1.3]">{r.name}</p>
                      <p className="text-[11px] text-[#8C8A82] mt-0.5">{r.period} · {r.date}</p>
                    </div>
                    <button className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-white border border-[#E8E6DC] rounded-[6px] text-[11px] font-medium text-[#8C8A82] cursor-pointer">
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M6 1v7M3 5l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      PDF
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
