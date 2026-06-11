import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ArrowLeft, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────
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

const RISK: Record<Risk, { label: string; bg: string; color: string; Icon: LucideIcon }> = {
  high:   { label: 'High',   bg: '#FDECEA', color: '#C0392B', Icon: AlertCircle   },
  medium: { label: 'Medium', bg: '#FFF4DC', color: '#B36200', Icon: AlertTriangle },
  low:    { label: 'Low',    bg: '#F0EEE6', color: '#5A5852', Icon: Info          },
};

const typeStyle: Record<ItemType, { bg: string; color: string }> = {
  Listing: { bg: '#EAF0FB', color: '#2156A8' },
  Seller:  { bg: '#FBECE4', color: '#C96847' },
  Review:  { bg: '#F0EEE6', color: '#5A5852' },
};

const metrics = [
  { label: 'Queue Total',     value: '52',      sub: 'Items to review',    trend: null,            trendUp: false },
  { label: 'Urgent',          value: '14',      sub: 'High-risk flags',    trend: null,            trendUp: false },
  { label: 'Approved Today',  value: '86',      sub: null,                 trend: '+12 vs yesterday', trendUp: true },
  { label: 'Avg Review Time', value: '4.2 min', sub: null,                 trend: '-0.8 min',      trendUp: true  },
] as const;

const poppins   = "'Poppins', sans-serif";
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };

// ── Component ─────────────────────────────────────────────────────────────────
export function AdminModeration() {
  const navigate = useNavigate();
  usePageTitle('Moderation');
  const [search, setSearch] = useState('');
  const [typeF,  setTypeF]  = useState('');
  const [riskF,  setRiskF]  = useState('');

  const filtered = ITEMS.filter(item => {
    const q = search.toLowerCase();
    if (q && !item.id.toLowerCase().includes(q) && !item.item.toLowerCase().includes(q) && !item.seller.toLowerCase().includes(q)) return false;
    if (typeF && item.type !== typeF) return false;
    if (riskF && item.risk !== riskF) return false;
    return true;
  });

  return (
    <div style={{ fontFamily: poppins }}>

      {/* ── Header ── */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E8E6DC',
        padding: '14px 28px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#141413', lineHeight: 1.3 }}>Content Moderation</h1>
          <p style={{ fontSize: 12, color: '#8C8A82', marginTop: 2 }}>Review flagged listings, sellers, and reports</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: '#FDECEA', color: '#C0392B' }}>
            <AlertCircle size={11} /> 14 Urgent
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: '#FFF4DC', color: '#B36200' }}>
            <AlertTriangle size={11} /> 38 Pending
          </span>
          <button
            onClick={() => navigate('/seller/dashboard')}
            style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#8C8A82', background: 'transparent', border: '1px solid #E8E6DC', cursor: 'pointer', fontFamily: poppins, display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <ArrowLeft size={13} /> Back to Demo
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '20px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {metrics.map(m => (
            <div key={m.label} style={{ ...cardStyle, padding: '16px 20px' }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{m.label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#141413', lineHeight: 1.15 }}>{m.value}</p>
              {m.trend && <p style={{ fontSize: 12, color: '#2D8A4E', marginTop: 4 }}>▲ {m.trend}</p>}
              {m.sub   && <p style={{ fontSize: 12, color: '#8C8A82', marginTop: 4 }}>{m.sub}</p>}
            </div>
          ))}
        </div>

        {/* Table card */}
        <div style={{ ...cardStyle, overflow: 'hidden' }}>

          {/* Filters */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E8E6DC', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #E8E6DC', borderRadius: 8, padding: '0 12px', background: '#fff', flex: 1, maxWidth: 280 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8C8A82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input placeholder="Search flagged items..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: 13, padding: '8px 0', width: '100%', fontFamily: poppins, color: '#2C2A28', background: 'transparent' }} />
            </div>
            {[
              { value: typeF, set: setTypeF, opts: ['All Types','Listing','Seller','Review'] },
              { value: riskF, set: setRiskF, opts: ['All Priority','high','medium','low']    },
            ].map((s, i) => (
              <select key={i} value={s.value} onChange={e => s.set(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E8E6DC', fontSize: 13, fontFamily: poppins, background: '#fff', color: '#2C2A28', outline: 'none', cursor: 'pointer' }}>
                {s.opts.map(o => <option key={o} value={o.startsWith('All') ? '' : o}>{o}</option>)}
              </select>
            ))}
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#','Type','Item','Seller','Reason','Risk','Reported','Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E8E6DC', background: '#FAF9F5', whiteSpace: 'nowrap', fontFamily: poppins }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const risk = RISK[item.risk];
                  const ts   = typeStyle[item.type];
                  return (
                    <tr key={item.id}
                      style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F0EEE6' : 'none', background: item.risk === 'high' ? '#FFFAF9' : '#fff', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                      onMouseLeave={e => (e.currentTarget.style.background = item.risk === 'high' ? '#FFFAF9' : '#fff')}
                    >
                      {/* ID */}
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#B95A3A', whiteSpace: 'nowrap', fontFamily: poppins, fontSize: 13 }}>{item.id}</td>
                      {/* Type */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: ts.bg, color: ts.color, fontFamily: poppins }}>{item.type}</span>
                      </td>
                      {/* Item */}
                      <td style={{ padding: '12px 16px', maxWidth: 180 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#141413', margin: 0, fontFamily: poppins }}>{item.item}</p>
                      </td>
                      {/* Seller */}
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#4A4945', whiteSpace: 'nowrap', fontFamily: poppins }}>{item.seller}</td>
                      {/* Reason */}
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#4A4945', maxWidth: 200, fontFamily: poppins }}>{item.reason}</td>
                      {/* Risk */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: risk.bg, color: risk.color, fontFamily: poppins }}>
                          <risk.Icon size={10} /> {risk.label}
                        </span>
                      </td>
                      {/* Reported */}
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#8C8A82', whiteSpace: 'nowrap', fontFamily: poppins }}>{item.reported}</td>
                      {/* Actions */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {[['Review','#1A72C2'],['Approve','#2D8A4E'],['Remove','#C13030']].map(([label, bg]) => (
                            <button key={label} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, color: '#fff', background: bg, border: 'none', cursor: 'pointer', fontFamily: poppins, whiteSpace: 'nowrap' }}>
                              {label}
                            </button>
                          ))}
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