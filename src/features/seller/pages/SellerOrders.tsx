import { useState } from 'react';
import { Button }      from '@/components/ui/Button';
import { Card }        from '@/components/ui/Card';
import { MetricCard }  from '@/components/ui/MetricCard';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Avatar }      from '@/components/ui/Avatar';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

// Reference exact data — includes email under customer name
const ORDERS = [
  { id: '#8821', cust: 'Sarah M.',  email: 'sarah@email.com', product: 'Grade 5 Math Bundle',     type: 'Digital',  date: 'Today 2:14 PM',  amount: '$49.00', status: 'Paid'       },
  { id: '#8820', cust: 'David R.',  email: 'david@email.com', product: 'Fractions Mastery Kit',   type: 'Digital',  date: 'Today 11:03 AM', amount: '$18.00', status: 'Fulfilled'  },
  { id: '#8819', cust: 'Lena K.',   email: 'lena@email.com',  product: 'Ceramic Mug Set',         type: 'Physical', date: 'Yesterday',      amount: '$58.00', status: 'Processing' },
  { id: '#8818', cust: 'Tom B.',    email: 'tom@email.com',   product: 'Science Lab Worksheets',  type: 'Digital',  date: 'Yesterday',      amount: '$15.00', status: 'Paid'       },
  { id: '#8817', cust: 'Amy L.',    email: 'amy@email.com',   product: 'Linen Wall Hanging',      type: 'Physical', date: 'May 18',         amount: '$72.00', status: 'Delivered'  },
  { id: '#8816', cust: 'Mike S.',   email: 'mike@email.com',  product: 'Lo-Fi Music Pack',        type: 'Digital',  date: 'May 18',         amount: '$19.00', status: 'Fulfilled'  },
  { id: '#8815', cust: 'Jane P.',   email: 'jane@email.com',  product: 'Creative Writing Prompts',type: 'Digital',  date: 'May 17',         amount: '$12.00', status: 'Refunded'   },
];

const TH_STYLE: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: 11,
  fontWeight: 600,
  color: '#8C8A82',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1px solid #E8E6DC',
  background: '#FAF9F5',
  fontFamily: "'Poppins', sans-serif",
  whiteSpace: 'nowrap',
};

const TD_STYLE: React.CSSProperties = {
  padding: '13px 12px',
  fontFamily: "'Poppins', sans-serif",
};

export function SellerOrders() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type,   setType]   = useState('');
  const [time,   setTime]   = useState('');

  const filtered = ORDERS.filter(o => {
    const q = search.toLowerCase();
    if (q && !o.id.toLowerCase().includes(q) && !o.cust.toLowerCase().includes(q) && !o.product.toLowerCase().includes(q)) return false;
    if (status && o.status !== status) return false;
    if (type   && o.type   !== type)   return false;
    return true;
  });

  return (
    <>
      <SellerPageHeader
        title="Orders"
        subtitle="Track and manage all customer orders."
        actions={
          <>
            <Button variant="ghost"   size="sm">Export CSV</Button>
            <Button variant="primary" size="sm">Bulk Actions</Button>
          </>
        }
      />

      <div className="p-7 flex flex-col gap-5">
        {/* Metrics row */}
        <div className="flex gap-3.5">
          <MetricCard label="Total Orders" value="284"     trend="+12 this week"        trendUp />
          <MetricCard label="Revenue"      value="$12,480" trend="+8.4%"                trendUp />
          <MetricCard label="Pending"      value="6"       sub="Awaiting fulfillment" />
          <MetricCard label="Avg Order"    value="$43.94"  trend="+$2.10 vs last month" trendUp />
        </div>

        {/* Table card — reference uses Card with internal padding for filters */}
        <Card padding="md">
          {/* Filter row */}
          <div className="flex gap-2.5 mb-4 flex-wrap items-center">
            <input
              placeholder="🔍 Search orders..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 13,
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #E8E6DC',
                outline: 'none',
                width: 240,
                flexShrink: 0,
              }}
            />
            {[
              { value: status, onChange: (v: string) => setStatus(v), options: ['All Status', 'Paid', 'Pending', 'Processing', 'Fulfilled', 'Delivered', 'Refunded'] },
              { value: type,   onChange: (v: string) => setType(v),   options: ['All Types', 'Physical', 'Digital'] },
              { value: time,   onChange: (v: string) => setTime(v),   options: ['All Time', 'Today', 'Last 7 days', 'This month'] },
            ].map((s, i) => (
              <select
                key={i}
                value={s.value}
                onChange={e => s.onChange(e.target.value)}
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 13,
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #E8E6DC',
                  background: '#FFFFFF',
                  color: '#2C2A28',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {s.options.map(o => <option key={o}>{o}</option>)}
              </select>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(''); setStatus(''); setType(''); setTime(''); }}
            >
              Clear Filters
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Order', 'Customer', 'Product', 'Type', 'Date', 'Amount', 'Status', 'Actions'].map(h => (
                    <th key={h} style={TH_STYLE}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #E8E6DC' }}>
                    {/* Order ID — deepOrange bold */}
                    <td style={TD_STYLE}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#B95A3A' }}>{o.id}</span>
                    </td>
                    {/* Customer — name + email stacked */}
                    <td style={TD_STYLE}>
                      <div className="flex items-center gap-2">
                        <Avatar name={o.cust} size={26} />
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 500, color: '#141413', display: 'block', lineHeight: 1.3 }}>{o.cust}</p>
                          <p style={{ fontSize: 11, color: '#8C8A82', lineHeight: 1.3 }}>{o.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...TD_STYLE, fontSize: 12, color: '#2C2A28' }}>{o.product}</td>
                    <td style={TD_STYLE}>
                      <Badge color={o.type === 'Digital' ? 'blue' : 'orange'}>{o.type}</Badge>
                    </td>
                    <td style={{ ...TD_STYLE, fontSize: 12, color: '#8C8A82', whiteSpace: 'nowrap' }}>{o.date}</td>
                    <td style={{ ...TD_STYLE, fontSize: 13, fontWeight: 700, color: '#141413' }}>{o.amount}</td>
                    <td style={TD_STYLE}><StatusBadge status={o.status} /></td>
                    <td style={TD_STYLE}>
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="sm">View</Button>
                        {o.status === 'Paid' && (
                          <Button variant="secondary" size="sm">Fulfill</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ ...TD_STYLE, textAlign: 'center', color: '#8C8A82', padding: '40px 12px' }}>
                      No orders match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <span style={{ fontSize: 12, color: '#8C8A82' }}>Showing {filtered.length} of 284 orders</span>
            <div className="flex items-center gap-1.5">
              {['←', '1', '2', '3', '…', '28', '→'].map((p, i) => (
                <button
                  key={i}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: p === '1' ? 600 : 400,
                    border: `1px solid ${p === '1' ? '#D97757' : '#E8E6DC'}`,
                    background: p === '1' ? '#D97757' : 'transparent',
                    color: p === '1' ? '#fff' : '#2C2A28',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
