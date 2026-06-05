import { Button }      from '@/components/ui/Button';
import { Card }        from '@/components/ui/Card';
import { MetricCard }  from '@/components/ui/MetricCard';
import { Badge }       from '@/components/ui/Badge';
import { Select }      from '@/components/ui/Input';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { ArrowRight } from 'lucide-react';

// ── Types & Data ──────────────────────────────────────────────────────────────
type Transaction = {
  date: string;
  description: string;
  type: string;
  typeColor: 'gray' | 'green' | 'yellow' | 'red' | 'blue' | 'orange';
  amount: string;
  amountColor: string;
  balance: string;
};

const TRANSACTIONS: Transaction[] = [
  {
    date: 'May 20', description: 'Payout — Bank Transfer',
    type: 'Payout', typeColor: 'gray',
    amount: '-$2,840.00', amountColor: 'text-error',
    balance: '$320.40',
  },
  {
    date: 'May 18', description: 'Sale — Grade 5 Math Bundle × 6',
    type: 'Sale', typeColor: 'green',
    amount: '+$294.00', amountColor: 'text-success',
    balance: '$3,160.40',
  },
  {
    date: 'May 17', description: 'Sale — Fractions Kit × 3',
    type: 'Sale', typeColor: 'green',
    amount: '+$54.00', amountColor: 'text-success',
    balance: '$2,866.40',
  },
  {
    date: 'May 17', description: 'Platform Fee (8%)',
    type: 'Fee', typeColor: 'yellow',
    amount: '-$27.84', amountColor: 'text-error',
    balance: '$2,812.40',
  },
  {
    date: 'May 16', description: 'Refund — Order #8815',
    type: 'Refund', typeColor: 'red',
    amount: '-$12.00', amountColor: 'text-error',
    balance: '$2,840.24',
  },
  {
    date: 'May 15', description: 'Sale — Ceramic Mug Set',
    type: 'Sale', typeColor: 'green',
    amount: '+$58.00', amountColor: 'text-success',
    balance: '$2,852.24',
  },
];

type TaxReport = {
  name: string;
  period: string;
  date: string;
};

const TAX_REPORTS: TaxReport[] = [
  { name: 'Q1 2025 Summary', period: 'Jan–Mar',   date: 'Generated Apr 1, 2025' },
  { name: 'Q4 2024 Summary', period: 'Oct–Dec',   date: 'Generated Jan 2, 2025' },
  { name: 'Annual 2024',     period: 'Full Year',  date: 'Generated Feb 5, 2025' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerFinance() {
  return (
    <>
      <SellerPageHeader
        title="Finance & Payouts"
        subtitle="Track earnings, payouts, fees, and tax reports."
        actions={
          <>
            <Button variant="ghost"   size="sm">Download Tax Report</Button>
            <Button variant="primary" size="sm">Request Payout</Button>
          </>
        }
      />

      <div className="p-7 flex flex-col gap-5">

        {/* Balance Card */}
        <div className="bg-carbon rounded-xl p-6 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-semibold text-slate uppercase tracking-widest mb-2">
              Available Balance
            </p>
            <p className="text-[32px] font-bold text-white leading-tight mb-3">$3,160.40</p>
            <div className="flex items-center gap-6">
              <span className="text-[11px] text-slate">Pending: <span className="text-white font-medium">$840.00</span></span>
              <span className="text-[11px] text-brand-orange font-medium">Next Payout: May 25</span>
              <span className="text-[11px] text-slate">Method: Bank ••4821</span>
            </div>
          </div>
          <Button variant="primary" size="md">Request Payout <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} /></Button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard label="This Month Revenue" value="$9,100"  trend="+23% vs last month"  trendUp />
          <MetricCard label="Platform Fees"       value="$728"   sub="8% of revenue" />
          <MetricCard label="Total Paid Out"      value="$24,800" sub="All time" />
          <MetricCard label="Pending Tax"         value="$1,240" sub="Est. for Q2 2025" />
        </div>

        {/* 2-col layout */}
        <div className="flex gap-5 items-start">

          {/* LEFT — Transaction History */}
          <div className="flex-1 min-w-0">
            <Card padding="none">
              <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-bone flex-wrap">
                <p className="text-[14px] font-semibold text-carbon">Transaction History</p>
                <div className="flex items-center gap-2">
                  <div className="w-[130px]">
                    <Select>
                      <option value="">All Types</option>
                      <option>Sale</option>
                      <option>Payout</option>
                      <option>Fee</option>
                      <option>Refund</option>
                    </Select>
                  </div>
                  <Button variant="ghost" size="sm">Export CSV</Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-bone bg-cream/50">
                      {['Date', 'Description', 'Type', 'Amount', 'Balance'].map(h => (
                        <th
                          key={h}
                          className="text-left text-[11px] font-semibold text-slate uppercase tracking-wider px-5 py-3 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TRANSACTIONS.map((t, i) => (
                      <tr
                        key={i}
                        className={`hover:bg-cream/50 transition-colors ${i < TRANSACTIONS.length - 1 ? 'border-b border-bone' : ''}`}
                      >
                        <td className="px-5 py-3.5 text-slate whitespace-nowrap">{t.date}</td>
                        <td className="px-5 py-3.5 text-charcoal">{t.description}</td>
                        <td className="px-5 py-3.5">
                          <Badge color={t.typeColor}>{t.type}</Badge>
                        </td>
                        <td className={`px-5 py-3.5 font-semibold whitespace-nowrap ${t.amountColor}`}>
                          {t.amount}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-carbon whitespace-nowrap">{t.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* RIGHT — 3 stacked cards */}
          <div className="w-[300px] flex-shrink-0 flex flex-col gap-4">

            {/* Payout Schedule */}
            <Card padding="none">
              <div className="p-4">
                <p className="text-[13px] font-semibold text-carbon mb-3">Payout Schedule</p>
                <div className="flex flex-col gap-2.5">
                  {[
                    { label: 'Frequency', value: 'Weekly (Every Monday)' },
                    { label: 'Method',    value: 'Bank Transfer ••4821'  },
                    { label: 'Currency',  value: 'USD'                    },
                    { label: 'Minimum',   value: '$50.00'                 },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-[12px] text-slate">{row.label}</span>
                      <span className="text-[12px] font-medium text-charcoal">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-bone">
                  <Button variant="ghost" size="sm">Update Payout Method</Button>
                </div>
              </div>
            </Card>

            {/* Fee Breakdown */}
            <Card padding="none">
              <div className="p-4">
                <p className="text-[13px] font-semibold text-carbon mb-3">Fee Breakdown</p>
                <div className="flex flex-col gap-2.5">
                  {[
                    { label: 'Marketplace Listing Fee', value: 'Free'             },
                    { label: 'Transaction Fee',         value: '8% per sale'      },
                    { label: 'Payment Processing',      value: '2.9% + $0.30'     },
                    { label: 'Digital Delivery',        value: 'Included'          },
                    { label: 'AI Credits',              value: '750 / month'       },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-[12px] text-slate">{row.label}</span>
                      <span className="text-[12px] font-medium text-charcoal">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Tax Reports */}
            <Card padding="none">
              <div className="p-4">
                <p className="text-[13px] font-semibold text-carbon mb-3">Tax Reports</p>
                <div className="flex flex-col gap-3">
                  {TAX_REPORTS.map(r => (
                    <div key={r.name} className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-charcoal leading-tight">{r.name}</p>
                        <p className="text-[11px] text-slate mt-0.5">{r.period} · {r.date}</p>
                      </div>
                      <button className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-bone text-[11px] font-medium text-slate hover:bg-cream transition-colors cursor-pointer">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
                          <path d="M6 1v7M3 5l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        PDF
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

          </div>
        </div>

      </div>
    </>
  );
}
