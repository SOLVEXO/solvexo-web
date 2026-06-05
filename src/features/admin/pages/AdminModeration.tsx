import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft } from 'lucide-react';

type Risk     = 'high' | 'medium' | 'low';
type ItemType = 'Listing' | 'Seller' | 'Review';

interface ModerationItem {
  id: string; type: ItemType; item: string;
  seller: string; reason: string; risk: Risk; reported: string;
}

const ITEMS: ModerationItem[] = [
  { id: 'R-3401', type: 'Listing', item: 'Grade 12 Exam Papers 2024', seller: 'ExamLeaks99',   reason: 'Possible copyright violation', risk: 'high',   reported: '2h ago'    },
  { id: 'R-3400', type: 'Seller',  item: 'FastDigital99 account',     seller: 'FastDigital99', reason: 'Duplicate account suspected',  risk: 'high',   reported: '3h ago'    },
  { id: 'R-3399', type: 'Listing', item: 'Premium UI Kit Bundle',     seller: 'DesignHub',     reason: 'Counterfeit product report',   risk: 'medium', reported: '5h ago'    },
  { id: 'R-3398', type: 'Review',  item: "Review on 'Math Bundle'",   seller: 'anon_buyer',    reason: 'Suspected fake review',        risk: 'low',    reported: '8h ago'    },
  { id: 'R-3397', type: 'Listing', item: 'Music Sample Pack Vol.3',   seller: 'BeatFactory',   reason: 'DMCA takedown request',        risk: 'high',   reported: 'Yesterday' },
  { id: 'R-3396', type: 'Seller',  item: 'QuickSell Store',           seller: 'QuickSell',     reason: 'High refund rate (42%)',       risk: 'medium', reported: 'Yesterday' },
];

const RISK: Record<Risk, { label: string; badge: 'red' | 'yellow' | 'gray'; emoji: string }> = {
  high:   { label: 'High',   badge: 'red',    emoji: '🚨' },
  medium: { label: 'Medium', badge: 'yellow', emoji: '⚠️' },
  low:    { label: 'Low',    badge: 'gray',   emoji: 'ℹ️' },
};

const TYPE_COLOR: Record<ItemType, 'blue' | 'orange' | 'gray'> = {
  Listing: 'blue',
  Seller:  'orange',
  Review:  'gray',
};

const TH: React.CSSProperties = {
  textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600,
  color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.05em',
  borderBottom: '1px solid #E8E6DC', background: '#FAF9F5',
  fontFamily: "'Poppins', sans-serif", whiteSpace: 'nowrap',
};
const TD: React.CSSProperties = {
  padding: '12px 12px', fontFamily: "'Poppins', sans-serif",
  fontSize: 13, color: '#2C2A28',
};

const ActionBtn = ({ label, bg }: { label: string; bg: string }) => (
  <button
    style={{
      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
      color: '#fff', background: bg, border: 'none', cursor: 'pointer',
      fontFamily: "'Poppins', sans-serif", whiteSpace: 'nowrap',
    }}
  >
    {label}
  </button>
);

export function AdminModeration() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeF,  setTypeF]  = useState('');
  const [riskF,  setRiskF]  = useState('');

  const filtered = ITEMS.filter(item => {
    const q = search.toLowerCase();
    if (q && !item.id.toLowerCase().includes(q) && !item.item.toLowerCase().includes(q) && !item.seller.toLowerCase().includes(q)) return false;
    if (typeF && item.type !== typeF)  return false;
    if (riskF && item.risk !== riskF)  return false;
    return true;
  });

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Reference-exact header */}
      <div
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E8E6DC',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#141413', lineHeight: 1.3 }}>
            Content Moderation
          </h1>
          <p style={{ fontSize: 12, color: '#8C8A82', marginTop: 2 }}>
            Review flagged listings, sellers, and reports
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Badge color="red">🚨 14 Urgent</Badge>
          <Badge color="yellow">⚠️ 38 Pending</Badge>
          <button
            onClick={() => navigate('/seller/dashboard')}
            style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              color: '#8C8A82', background: 'transparent',
              border: '1px solid #E8E6DC', cursor: 'pointer',
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            <ArrowLeft size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Back to Demo
          </button>
        </div>
      </div>

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Metrics */}
        <div style={{ display: 'flex', gap: 14 }}>
          <MetricCard label="Queue Total"     value="52"     sub="Items to review" />
          <MetricCard label="Urgent"          value="14"     sub="High-risk flags" />
          <MetricCard label="Approved Today"  value="86"     trend="+12 vs yesterday" trendUp />
          <MetricCard label="Avg Review Time" value="4.2 min" trend="-0.8 min"        trendUp />
        </div>

        {/* Table card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid #E8E6DC',
          }}
        >
          {/* Filters */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E8E6DC',
              display: 'flex',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <input
              placeholder="🔍 Search flagged items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, maxWidth: 280, padding: '9px 12px', borderRadius: 8,
                border: '1px solid #E8E6DC', fontSize: 13, outline: 'none',
                fontFamily: "'Poppins', sans-serif", color: '#2C2A28',
              }}
            />
            {[
              { value: typeF, set: setTypeF, opts: ['All Types', 'Listing', 'Seller', 'Review'] },
              { value: riskF, set: setRiskF, opts: ['All Priority', 'high', 'medium', 'low']    },
            ].map((s, i) => (
              <select
                key={i}
                value={s.value}
                onChange={e => s.set(e.target.value)}
                style={{
                  padding: '9px 12px', borderRadius: 8, border: '1px solid #E8E6DC',
                  fontSize: 13, fontFamily: "'Poppins', sans-serif",
                  background: '#fff', color: '#2C2A28', outline: 'none', cursor: 'pointer',
                }}
              >
                {s.opts.map(o => <option key={o} value={o.startsWith('All') ? '' : o}>{o}</option>)}
              </select>
            ))}
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Type', 'Item', 'Seller', 'Reason', 'Risk', 'Reported', 'Actions'].map(h => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const risk   = RISK[item.risk];
                  const isHigh = item.risk === 'high';
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #E8E6DC',
                        background: isHigh ? '#FFFAF9' : '#FFFFFF',
                      }}
                    >
                      {/* RMA ID — deepOrange bold (reference exact) */}
                      <td style={{ ...TD, fontWeight: 700, color: '#B95A3A', whiteSpace: 'nowrap' }}>
                        {item.id}
                      </td>
                      <td style={TD}>
                        <Badge color={TYPE_COLOR[item.type]}>{item.type}</Badge>
                      </td>
                      <td style={{ ...TD, maxWidth: 180 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#141413', margin: 0 }}>
                          {item.item}
                        </p>
                      </td>
                      <td style={{ ...TD, color: '#2C2A28', whiteSpace: 'nowrap' }}>{item.seller}</td>
                      <td style={{ ...TD, color: '#2C2A28', maxWidth: 200 }}>{item.reason}</td>
                      <td style={TD}>
                        <Badge color={risk.badge}>{risk.emoji} {risk.label}</Badge>
                      </td>
                      <td style={{ ...TD, color: '#8C8A82', whiteSpace: 'nowrap' }}>{item.reported}</td>
                      <td style={TD}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <ActionBtn label="Review"  bg="#1A72C2" />
                          <ActionBtn label="Approve" bg="#2D8A4E" />
                          <ActionBtn label="Remove"  bg="#C13030" />
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
    </div>
  );
}
