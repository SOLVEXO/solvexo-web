import { useState } from 'react';
import { Button }      from '@/components/ui/Button';
import { Card }        from '@/components/ui/Card';
import { MetricCard }  from '@/components/ui/MetricCard';
import { Badge }       from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

// ── Types & Data ──────────────────────────────────────────────────────────────
type ReturnEntry = {
  rma: string;
  order: string;
  customer: string;
  product: string;
  reason: string;
  amount: string;
  status: string;
  statusColor: 'green' | 'blue' | 'yellow' | 'red' | 'gray' | 'orange';
  date: string;
};

const RETURNS: ReturnEntry[] = [
  {
    rma: 'RMA-041', order: '#8802', customer: 'David Reynolds',
    product: 'Fractions Mastery Kit',     reason: 'Wrong item received',    amount: '$18.00',
    status: 'Approved',          statusColor: 'green',  date: 'May 18',
  },
  {
    rma: 'RMA-040', order: '#8799', customer: 'Lena Kowalski',
    product: 'Ceramic Mug — Sage',         reason: 'Arrived damaged',        amount: '$28.00',
    status: 'Replacement Sent',  statusColor: 'blue',   date: 'May 16',
  },
  {
    rma: 'RMA-039', order: '#8795', customer: 'Mike Svensson',
    product: 'Lo-Fi Music Pack',           reason: 'Not as described',       amount: '$24.00',
    status: 'Under Review',      statusColor: 'yellow', date: 'May 15',
  },
  {
    rma: 'RMA-038', order: '#8780', customer: 'Jane Park',
    product: 'Geometric Mug — Navy',       reason: 'Defective product',      amount: '$32.00',
    status: 'Refunded',          statusColor: 'green',  date: 'May 12',
  },
  {
    rma: 'RMA-037', order: '#8761', customer: 'Carlos Mendez',
    product: 'Writing Prompts Vol.1',      reason: 'Accidentally purchased', amount: '$12.00',
    status: 'Declined',          statusColor: 'red',    date: 'May 8',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerReturns() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType]     = useState('');

  const filtered = RETURNS.filter(r => {
    const q = search.toLowerCase();
    if (q && !r.rma.toLowerCase().includes(q) && !r.customer.toLowerCase().includes(q) && !r.product.toLowerCase().includes(q)) return false;
    if (status && r.status !== status) return false;
    if (type && !r.product.toLowerCase().includes(type.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <SellerPageHeader
        title="Returns & Refunds"
        subtitle="Process return requests, issue refunds, and send replacements."
        actions={
          <Button variant="ghost" size="sm">Export Report</Button>
        }
      />

      <div className="p-7 flex flex-col gap-5">

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard label="Open Requests"   value="2"       sub="Awaiting action" />
          <MetricCard label="Return Rate"     value="2.1%"    trend="Below avg (5%)"           trendUp />
          <MetricCard label="Total Refunded"  value="$860"    sub="Last 30 days" />
          <MetricCard label="Avg Resolution"  value="1.4 days" trend="Fast"                    trendUp />
        </div>

        {/* Return Policy Summary */}
        <Card padding="md" className="mb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-carbon mb-1.5">Return Policy Summary</p>
              <p className="text-[13px] text-slate leading-relaxed">
                Physical: 30-day returns in original condition.
                Digital: Non-refundable unless defective.
                Damaged items: replacement or full refund.
              </p>
            </div>
            <Button variant="ghost" size="sm" className="flex-shrink-0">Edit Policy</Button>
          </div>
        </Card>

        {/* Table Card */}
        <div className="border border-bone rounded-xl overflow-hidden bg-white">

          {/* Filters */}
          <div className="px-5 py-4 flex items-end gap-3 border-b border-bone flex-wrap">
            <div className="flex-1 min-w-[180px] max-w-[280px]">
              <Input
                placeholder="Search RMA, customer, product…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="w-[140px]">
              <Select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">All Status</option>
                <option>Approved</option>
                <option>Replacement Sent</option>
                <option>Under Review</option>
                <option>Refunded</option>
                <option>Declined</option>
              </Select>
            </div>
            <div className="w-[130px]">
              <Select value={type} onChange={e => setType(e.target.value)}>
                <option value="">All Types</option>
                <option value="kit">Physical</option>
                <option value="pack">Digital</option>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-bone bg-cream/50">
                  {['RMA', 'Order', 'Customer', 'Product', 'Reason', 'Amount', 'Status', 'Date', 'Actions'].map(h => (
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
                {filtered.map((r, i) => (
                  <tr
                    key={r.rma}
                    className={`hover:bg-cream/50 transition-colors ${i < filtered.length - 1 ? 'border-b border-bone' : ''}`}
                  >
                    <td className="px-5 py-3.5 font-bold text-brand-deep-orange whitespace-nowrap">{r.rma}</td>
                    <td className="px-5 py-3.5 font-medium text-carbon whitespace-nowrap">{r.order}</td>
                    <td className="px-5 py-3.5 text-charcoal whitespace-nowrap">{r.customer}</td>
                    <td className="px-5 py-3.5 text-charcoal max-w-[160px] truncate">{r.product}</td>
                    <td className="px-5 py-3.5 text-slate max-w-[160px] truncate">{r.reason}</td>
                    <td className="px-5 py-3.5 font-semibold text-carbon whitespace-nowrap">{r.amount}</td>
                    <td className="px-5 py-3.5">
                      <Badge color={r.statusColor}>{r.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate whitespace-nowrap">{r.date}</td>
                    <td className="px-5 py-3.5">
                      <button className="text-[12px] text-brand-orange font-medium hover:underline cursor-pointer whitespace-nowrap">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-[13px] text-slate">
                      No return requests match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 border-t border-bone">
            <span className="text-[12px] text-slate">
              Showing {filtered.length} of {RETURNS.length} return requests
            </span>
          </div>
        </div>

      </div>
    </>
  );
}
