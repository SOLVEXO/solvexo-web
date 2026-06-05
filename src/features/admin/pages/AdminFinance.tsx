import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';

interface Payout {
  id:      string;
  seller:  string;
  email:   string;
  amount:  string;
  method:  string;
  period:  string;
  status:  'Pending' | 'Processing' | 'Paid' | 'Held';
}

const PAYOUTS: Payout[] = [
  { id: 'PAY-0841', seller: 'Alex Chen',        email: 'alex@myshop.com',       amount: '$2,184.00', method: 'Bank Transfer', period: 'May 2025',   status: 'Pending'    },
  { id: 'PAY-0840', seller: 'DesignHub Studio', email: 'designhub@gmail.com',   amount: '$980.00',   method: 'PayPal',        period: 'May 2025',   status: 'Processing' },
  { id: 'PAY-0839', seller: 'BeatFactory',      email: 'beats@mail.com',        amount: '$340.00',   method: 'Bank Transfer', period: 'May 2025',   status: 'Pending'    },
  { id: 'PAY-0838', seller: 'Priya Sharma',     email: 'priya@edu.in',          amount: '$1,240.00', method: 'Bank Transfer', period: 'May 2025',   status: 'Pending'    },
  { id: 'PAY-0837', seller: 'QuickSell Store',  email: 'quicksell@store.com',   amount: '$120.00',   method: 'PayPal',        period: 'Apr 2025',   status: 'Held'       },
  { id: 'PAY-0836', seller: 'Alex Chen',        email: 'alex@myshop.com',       amount: '$1,980.00', method: 'Bank Transfer', period: 'Apr 2025',   status: 'Paid'       },
];

const STATUS_COLORS: Record<string, 'yellow' | 'blue' | 'green' | 'red'> = {
  Pending:    'yellow',
  Processing: 'blue',
  Paid:       'green',
  Held:       'red',
};

export function AdminFinance() {
  usePageTitle('Finance');
  const [payouts, setPayouts] = useState<Payout[]>(PAYOUTS);

  const approve = (id: string) =>
    setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'Processing' } : p));

  const hold = (id: string) =>
    setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'Held' } : p));

  return (
    <div className="p-7 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-[18px] font-bold text-carbon">Finance & Payouts</h1>
        <p className="text-[12px] text-slate mt-0.5">Review revenue, manage seller payouts and financial reports.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total Revenue"    value="$8.4M"    trend="+18.2% this month" trendUp />
        <MetricCard label="Pending Payouts"  value="$4,744"   sub="4 sellers awaiting" />
        <MetricCard label="Platform Fee"     value="$1.26M"   trend="15% commission"    trendUp />
        <MetricCard label="Refunds Issued"   value="$12,480"  sub="This month" />
      </div>

      {/* Revenue split */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Card>
          <p className="text-[14px] font-bold text-carbon mb-4">Revenue Breakdown</p>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Gross Merchandise Value', value: '$8,400,000', pct: 100 },
              { label: 'Platform Commission (15%)', value: '$1,260,000', pct: 15 },
              { label: 'Seller Payouts (85%)',       value: '$7,140,000', pct: 85 },
              { label: 'Payment Fees (~2%)',          value: '$168,000',   pct: 2  },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] text-charcoal">{item.label}</span>
                  <span className="text-[12px] font-semibold text-carbon">{item.value}</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: '#E8E6DC' }}>
                  <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: '#D97757' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-[14px] font-bold text-carbon mb-4">Payout Summary</p>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Pending',    count: 3, amount: '$3,764', color: '#C08B1E', bg: '#FEF7E5' },
              { label: 'Processing', count: 1, amount: '$980',   color: '#1A72C2', bg: '#E6F1FB' },
              { label: 'Held',       count: 1, amount: '$120',   color: '#C13030', bg: '#FDEAEA' },
              { label: 'Paid (May)', count: 1, amount: '$1,980', color: '#2D8A4E', bg: '#EBF7EF' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between p-3 rounded-lg" style={{ background: s.bg }}>
                <div>
                  <span className="text-[13px] font-semibold" style={{ color: s.color }}>{s.label}</span>
                  <span className="text-[11px] ml-2" style={{ color: s.color }}>{s.count} seller{s.count !== 1 ? 's' : ''}</span>
                </div>
                <span className="text-[14px] font-bold" style={{ color: s.color }}>{s.amount}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Payouts table */}
      <Card padding="none">
        <div className="px-5 pt-5 pb-3">
          <p className="text-[14px] font-bold text-carbon">Pending Payouts</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-bone">
                {['ID', 'Seller', 'Amount', 'Method', 'Period', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-slate uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payouts.map((p, i) => (
                <tr key={p.id} className={`hover:bg-cream/50 transition-colors ${i < payouts.length - 1 ? 'border-b border-bone' : ''}`}>
                  <td className="px-5 py-3.5 font-semibold text-carbon">{p.id}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Avatar name={p.seller} size={28} />
                      <div>
                        <p className="font-medium text-carbon text-[12px]">{p.seller}</p>
                        <p className="text-[11px] text-slate">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-carbon">{p.amount}</td>
                  <td className="px-5 py-3.5 text-charcoal">{p.method}</td>
                  <td className="px-5 py-3.5 text-slate">{p.period}</td>
                  <td className="px-5 py-3.5"><Badge color={STATUS_COLORS[p.status]}>{p.status}</Badge></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {p.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => approve(p.id)}
                            className="text-[11px] font-medium cursor-pointer hover:underline"
                            style={{ color: '#2D8A4E' }}
                          >
                            Approve
                          </button>
                          <span className="text-bone">|</span>
                          <button
                            onClick={() => hold(p.id)}
                            className="text-[11px] font-medium cursor-pointer hover:underline"
                            style={{ color: '#C13030' }}
                          >
                            Hold
                          </button>
                        </>
                      )}
                      {p.status !== 'Pending' && (
                        <button className="text-[11px] font-medium cursor-pointer text-slate hover:text-carbon">View</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
