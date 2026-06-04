import { useState } from 'react';
import { Mail, Gift } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Input, Select } from '@/components/ui/Input';
import { Divider } from '@/components/ui/Divider';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import type { BadgeColor } from '@/types';

type Segment = 'VIP' | 'Loyal' | 'Returning' | 'New' | 'At Risk';

interface Customer {
  id: string;
  name: string;
  email: string;
  orders: number;
  ltv: string;
  lastOrder: string;
  segment: Segment;
  joined: string;
}

const CUSTOMERS: Customer[] = [
  { id: 'C-1001', name: 'Sarah Mitchell',  email: 'sarah@email.com',  orders: 14, ltv: '$612',   lastOrder: 'Today',    segment: 'VIP',      joined: 'Jan 2024' },
  { id: 'C-1002', name: 'David Reynolds',  email: 'david@email.com',  orders: 9,  ltv: '$387',   lastOrder: 'Yesterday', segment: 'Loyal',    joined: 'Mar 2024' },
  { id: 'C-1003', name: 'Lena Kowalski',   email: 'lena@email.com',   orders: 3,  ltv: '$134',   lastOrder: 'May 10',   segment: 'New',      joined: 'Apr 2025' },
  { id: 'C-1004', name: 'Tom Barnes',      email: 'tom@email.com',    orders: 21, ltv: '$1,042', lastOrder: 'May 14',   segment: 'VIP',      joined: 'Nov 2023' },
  { id: 'C-1005', name: 'Amy Liu',         email: 'amy@email.com',    orders: 6,  ltv: '$228',   lastOrder: 'May 8',    segment: 'Returning', joined: 'Feb 2024' },
  { id: 'C-1006', name: 'Mike Svensson',   email: 'mike@email.com',   orders: 1,  ltv: '$49',    lastOrder: 'May 16',   segment: 'New',      joined: 'May 2025' },
  { id: 'C-1007', name: 'Jane Park',       email: 'jane@email.com',   orders: 0,  ltv: '$0',     lastOrder: '—',        segment: 'At Risk',  joined: 'Dec 2023' },
  { id: 'C-1008', name: 'Carlos Mendez',   email: 'carlos@email.com', orders: 11, ltv: '$504',   lastOrder: 'Apr 30',   segment: 'Loyal',    joined: 'Jun 2024' },
];

const SEGMENT_COLORS: Record<Segment, BadgeColor> = {
  VIP:       'orange',
  Loyal:     'green',
  Returning: 'blue',
  New:       'gray',
  'At Risk': 'red',
};

const SEGMENT_PILLS = [
  { label: 'All',       count: 1284, color: 'gray'   as BadgeColor },
  { label: 'VIP',       count: 94,   color: 'orange' as BadgeColor },
  { label: 'Loyal',     count: 312,  color: 'green'  as BadgeColor },
  { label: 'Returning', count: 478,  color: 'blue'   as BadgeColor },
  { label: 'New',       count: 362,  color: 'gray'   as BadgeColor },
  { label: 'At Risk',   count: 38,   color: 'red'    as BadgeColor },
];

const TH: React.CSSProperties = {
  textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600,
  color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.05em',
  borderBottom: '1px solid #E8E6DC', background: '#FAF9F5',
  fontFamily: "'Poppins', sans-serif", whiteSpace: 'nowrap',
};
const TD: React.CSSProperties = {
  padding: '13px 12px', fontFamily: "'Poppins', sans-serif",
};

export function SellerCustomers() {
  const [search, setSearch] = useState('');
  const [seg, setSeg]       = useState('');
  const [sort, setSort]     = useState('');
  const [filterPill, setFilterPill] = useState('All');
  const [sel, setSel]       = useState<Customer | null>(null);

  const filtered = CUSTOMERS.filter(c => {
    const q = search.toLowerCase();
    if (q && !c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q) && !c.id.toLowerCase().includes(q)) return false;
    if (seg && c.segment !== seg) return false;
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
            <Button variant="ghost" size="sm">Export CSV</Button>
            <Button variant="primary" size="sm">+ Add Customer</Button>
          </>
        }
      />

      <div className="p-7 flex flex-col gap-6">
        {/* Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard label="Total Customers"   value="1,284" trend="+48 this month"         trendUp />
          <MetricCard label="Avg Lifetime Value" value="$247"  trend="+$18 vs last month"    trendUp />
          <MetricCard label="Repeat Rate"        value="62%"   trend="Healthy"               trendUp />
          <MetricCard label="At Risk"            value="38"    sub="No purchase in 90 days" />
        </div>

        {/* Segment pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {SEGMENT_PILLS.map(pill => (
            <button
              key={pill.label}
              onClick={() => setFilterPill(pill.label)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[12px] font-medium transition-all cursor-pointer"
              style={{
                borderColor: filterPill === pill.label ? '#D97757' : '#E8E6DC',
                background:  filterPill === pill.label ? '#FBECE4' : '#FFFFFF',
                color:       filterPill === pill.label ? '#B95A3A' : '#2C2A28',
              }}
            >
              {pill.label}
              <Badge color={pill.color} className="ml-0.5">{pill.count.toLocaleString()}</Badge>
            </button>
          ))}
        </div>

        {/* Table + detail */}
        <div className="flex gap-5">
          {/* Table card */}
          <Card padding="none" className="flex-1 min-w-0">
            {/* Filters */}
            <div className="px-5 py-4 flex items-end gap-3 border-b border-bone">
              <div style={{ maxWidth: 240 }} className="flex-1">
                <Input placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="w-[140px]">
                <Select value={seg} onChange={e => setSeg(e.target.value)}>
                  <option value="">All Segments</option>
                  <option>VIP</option>
                  <option>Loyal</option>
                  <option>Returning</option>
                  <option>New</option>
                  <option>At Risk</option>
                </Select>
              </div>
              <div className="w-[140px]">
                <Select value={sort} onChange={e => setSort(e.target.value)}>
                  <option value="">Sort: Default</option>
                  <option>Highest LTV</option>
                  <option>Most Orders</option>
                  <option>Recently Active</option>
                  <option>Newest</option>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table style={{ borderCollapse: 'collapse', width: '100%' }} className="text-[13px]">
                <thead>
                  <tr>
                    {['Customer', 'Orders', 'Lifetime Value', 'Last Order', 'Segment', 'Joined', ''].map(h => (
                      <th key={h} style={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr
                      key={c.id}
                      onClick={() => setSel(sel?.id === c.id ? null : c)}
                      className="transition-colors cursor-pointer"
                      style={{
                        background: sel?.id === c.id ? '#FBECE4' : undefined,
                        borderBottom: i < filtered.length - 1 ? '1px solid #E8E6DC' : undefined,
                      }}
                    >
                      <td style={TD}>
                        <div className="flex items-center gap-2">
                          <Avatar name={c.name} size={30} />
                          <div>
                            <p style={{ fontWeight: 600, color: '#2C2A28', lineHeight: 1.3 }}>{c.name}</p>
                            <p style={{ fontSize: 11, color: '#8C8A82' }}>{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...TD, fontWeight: 600, color: '#2C2A28' }}>{c.orders}</td>
                      <td style={{ ...TD, fontWeight: 600, color: '#2C2A28' }}>{c.ltv}</td>
                      <td style={{ ...TD, color: '#8C8A82' }}>{c.lastOrder}</td>
                      <td style={TD}>
                        <StatusBadge status={c.segment} />
                      </td>
                      <td style={{ ...TD, color: '#8C8A82' }}>{c.joined}</td>
                      <td style={TD}>
                        <button
                          className="text-[12px] font-medium hover:underline cursor-pointer"
                          style={{ color: '#D97757' }}
                          onClick={e => { e.stopPropagation(); setSel(sel?.id === c.id ? null : c); }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Detail panel */}
          {sel && (
            <div style={{ width: 360 }} className="flex-shrink-0">
              <Card className="sticky top-[70px]">
                <div className="flex flex-col items-center text-center pb-4">
                  <Avatar name={sel.name} size={56} />
                  <p className="text-[16px] font-bold text-carbon mt-3">{sel.name}</p>
                  <p className="text-[12px] text-slate">{sel.email}</p>
                  <div className="mt-2">
                    <Badge color={SEGMENT_COLORS[sel.segment]}>{sel.segment}</Badge>
                  </div>
                </div>

                <Divider my={3} />

                <table className="w-full text-[12px] mb-4">
                  <tbody>
                    {[
                      ['Customer ID',    sel.id],
                      ['Member Since',   sel.joined],
                      ['Total Orders',   String(sel.orders)],
                      ['Lifetime Value', sel.ltv],
                      ['Last Purchase',  sel.lastOrder],
                    ].map(([label, value]) => (
                      <tr key={label} className="border-b border-bone">
                        <td className="py-2 text-slate">{label}</td>
                        <td className="py-2 font-semibold text-carbon text-right">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p className="text-[11px] font-semibold text-slate uppercase tracking-wider mb-2">Recent Orders</p>
                <div className="flex flex-col gap-1.5 mb-5">
                  {sel.orders > 0 ? (
                    [
                      { id: '#8821', product: 'Grade 5 Math Bundle', amount: '$49.00', status: 'Paid' },
                      { id: '#8820', product: 'Fractions Kit',       amount: '$18.00', status: 'Fulfilled' },
                    ].slice(0, Math.min(sel.orders, 2)).map(o => (
                      <div key={o.id} className="flex items-center justify-between rounded-lg p-2.5" style={{ background: '#FAF9F5' }}>
                        <div>
                          <p className="text-[11px] font-semibold text-carbon">{o.id}</p>
                          <p className="text-[11px] text-slate">{o.product}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[12px] font-bold text-carbon">{o.amount}</p>
                          <StatusBadge status={o.status} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[12px] text-slate italic">No orders yet</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" fullWidth><Mail size={13} className="mr-1" />Email</Button>
                  <Button variant="ghost"     size="sm" fullWidth><Gift size={13} className="mr-1" />Loyalty Gift</Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
