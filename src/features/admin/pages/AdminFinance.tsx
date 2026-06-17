import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';

// ── Data ──────────────────────────────────────────────────────────────────────
interface Payout {
  id: string; seller: string; initials: string; email: string;
  amount: string; method: string; period: string;
  status: 'Pending' | 'Processing' | 'Paid' | 'Held';
}

const PAYOUTS: Payout[] = [
  { id: 'PAY-0841', seller: 'Alex Chen',        initials: 'AC', email: 'alex@myshop.com',       amount: '$2,184.00', method: 'Bank Transfer', period: 'May 2025', status: 'Pending'    },
  { id: 'PAY-0840', seller: 'DesignHub Studio', initials: 'DS', email: 'designhub@gmail.com',   amount: '$980.00',   method: 'PayPal',        period: 'May 2025', status: 'Processing' },
  { id: 'PAY-0839', seller: 'BeatFactory',      initials: 'BF', email: 'beats@mail.com',        amount: '$340.00',   method: 'Bank Transfer', period: 'May 2025', status: 'Pending'    },
  { id: 'PAY-0838', seller: 'Priya Sharma',     initials: 'PS', email: 'priya@edu.in',          amount: '$1,240.00', method: 'Bank Transfer', period: 'May 2025', status: 'Pending'    },
  { id: 'PAY-0837', seller: 'QuickSell Store',  initials: 'QS', email: 'quicksell@store.com',   amount: '$120.00',   method: 'PayPal',        period: 'Apr 2025', status: 'Held'       },
  { id: 'PAY-0836', seller: 'Alex Chen',        initials: 'AC', email: 'alex@myshop.com',       amount: '$1,980.00', method: 'Bank Transfer', period: 'Apr 2025', status: 'Paid'       },
];

const avatarColors: Record<string, { bg: string; color: string }> = {
  AC: { bg: '#FBECE4', color: '#B95A3A' }, DS: { bg: '#EAF0FB', color: '#2156A8' },
  BF: { bg: '#EAF7EF', color: '#1E7A3C' }, PS: { bg: '#E5F4FB', color: '#1A6A8A' },
  QS: { bg: '#F3EAFB', color: '#7A1EA8' },
};

const statusStyle: Record<string, { bg: string; color: string }> = {
  Pending:    { bg: '#FFF4DC', color: '#B36200' },
  Processing: { bg: '#EAF0FB', color: '#2156A8' },
  Paid:       { bg: '#E3F4EA', color: '#1E7A3C' },
  Held:       { bg: '#FDECEA', color: '#C0392B' },
};

const metrics = [
  { label: 'Total Revenue',   value: '$8.4M',   trend: '+18.2% this month', sub: null,                trendUp: true  },
  { label: 'Pending Payouts', value: '$4,744',  trend: null,                sub: '4 sellers awaiting',trendUp: false },
  { label: 'Platform Fee',    value: '$1.26M',  trend: '15% commission',    sub: null,                trendUp: true  },
  { label: 'Refunds Issued',  value: '$12,480', trend: null,                sub: 'This month',        trendUp: false },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────
export function AdminFinance() {
  usePageTitle('Finance');
  const [payouts, setPayouts] = useState<Payout[]>(PAYOUTS);

  const approve = (id: string) => setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'Processing' as const } : p));
  const hold    = (id: string) => setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'Held'       as const } : p));

  return (
    <div className="px-7 pt-6 pb-8 flex flex-col gap-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-[18px] font-bold text-charcoal mb-[3px]">Finance &amp; Payouts</h1>
        <p className="text-[12px] text-slate">Review revenue, manage seller payouts and financial reports.</p>
      </div>

      {/* ── Metrics ── */}
      <div className="grid grid-cols-4 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-4">
            <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">{m.label}</p>
            <p className="text-[28px] font-bold text-charcoal leading-[1.15]">{m.value}</p>
            {m.trend && <p className="text-[12px] text-[#2D8A4E] mt-1">▲ {m.trend}</p>}
            {m.sub   && <p className="text-[12px] text-slate mt-1">{m.sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Revenue split ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Revenue Breakdown */}
        <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-[22px] py-5">
          <p className="text-[14px] font-bold text-charcoal mb-[18px]">Revenue Breakdown</p>
          <div className="flex flex-col gap-[14px]">
            {[
              { label: 'Gross Merchandise Value',   value: '$8,400,000', pct: 100 },
              { label: 'Platform Commission (15%)',  value: '$1,260,000', pct: 15  },
              { label: 'Seller Payouts (85%)',        value: '$7,140,000', pct: 85  },
              { label: 'Payment Fees (~2%)',           value: '$168,000',   pct: 2   },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between mb-[5px]">
                  <span className="text-[12px] text-[#4A4945]">{item.label}</span>
                  <span className="text-[12px] font-semibold text-charcoal">{item.value}</span>
                </div>
                <div className="h-[6px] rounded-[3px] bg-bone">
                  <div className="h-full rounded-[3px] bg-brand-orange" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payout Summary */}
        <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-[22px] py-5">
          <p className="text-[14px] font-bold text-charcoal mb-4">Payout Summary</p>
          <div className="flex flex-col gap-[10px]">
            {[
              { label: 'Pending',    count: 3, amount: '$3,764', color: '#C08B1E', bg: '#FEF7E5' },
              { label: 'Processing', count: 1, amount: '$980',   color: '#1A72C2', bg: '#E6F1FB' },
              { label: 'Held',       count: 1, amount: '$120',   color: '#C13030', bg: '#FDEAEA' },
              { label: 'Paid (May)', count: 1, amount: '$1,980', color: '#2D8A4E', bg: '#EBF7EF' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between px-[14px] py-[11px] rounded-[9px]"
                style={{ background: s.bg }}>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold" style={{ color: s.color }}>{s.label}</span>
                  <span className="text-[11px]" style={{ color: s.color }}>{s.count} seller{s.count !== 1 ? 's' : ''}</span>
                </div>
                <span className="text-[14px] font-bold" style={{ color: s.color }}>{s.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Payouts table ── */}
      <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 pt-4 pb-[10px]">
          <p className="text-[14px] font-bold text-charcoal">Pending Payouts</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['ID','Seller','Amount','Method','Period','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-[10px] text-[11px] font-semibold text-slate uppercase tracking-[0.05em] border-b border-bone bg-[#FAF9F5] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payouts.map((p, i) => {
                const av = avatarColors[p.initials] ?? { bg: '#F0EEE6', color: '#5A5852' };
                const ss = statusStyle[p.status];
                return (
                  <tr key={p.id}
                    className="transition-colors duration-[120ms]"
                    style={{ borderBottom: i < payouts.length - 1 ? '1px solid #F0EEE6' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* ID */}
                    <td className="px-4 py-3 text-[13px] font-semibold text-charcoal">{p.id}</td>
                    {/* Seller */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-[10px]">
                        <div className="w-7 h-7 rounded-full text-[9px] font-bold flex items-center justify-center flex-shrink-0"
                          style={{ background: av.bg, color: av.color }}>
                          {p.initials}
                        </div>
                        <div>
                          <p className="text-[12px] font-medium text-charcoal">{p.seller}</p>
                          <p className="text-[11px] text-slate">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Amount */}
                    <td className="px-4 py-3 text-[13px] font-bold text-charcoal">{p.amount}</td>
                    {/* Method */}
                    <td className="px-4 py-3 text-[13px] text-[#4A4945]">{p.method}</td>
                    {/* Period */}
                    <td className="px-4 py-3 text-[13px] text-slate">{p.period}</td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className="px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold"
                        style={{ background: ss.bg, color: ss.color }}>{p.status}</span>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.status === 'Pending' ? (
                          <>
                            <button onClick={() => approve(p.id)} className="text-[11px] font-medium text-[#2D8A4E] bg-transparent border-none cursor-pointer">Approve</button>
                            <span className="text-[#E8E6DC] text-[13px]">|</span>
                            <button onClick={() => hold(p.id)}    className="text-[11px] font-medium text-[#C13030] bg-transparent border-none cursor-pointer">Hold</button>
                          </>
                        ) : (
                          <button className="text-[11px] font-medium text-slate bg-transparent border-none cursor-pointer">View</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
