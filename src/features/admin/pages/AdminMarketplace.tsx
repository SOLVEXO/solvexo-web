import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Star } from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────
interface Product {
  id: string; title: string; seller: string; category: string;
  price: string; sales: number; status: 'Active' | 'Flagged' | 'Removed';
  featured: boolean; listed: string;
}

const PRODUCTS: Product[] = [
  { id: 'P-8821', title: 'Grade 5 Math Mastery Bundle',   seller: 'Alex Chen',        category: 'Educational', price: '$49.00', sales: 284, status: 'Active',  featured: true,  listed: 'Jan 2024' },
  { id: 'P-8820', title: 'Premium UI Kit Bundle',         seller: 'DesignHub Studio', category: 'Digital',     price: '$79.00', sales: 142, status: 'Flagged', featured: false, listed: 'Feb 2024' },
  { id: 'P-8819', title: 'Lo-Fi Music Sample Pack Vol.3', seller: 'BeatFactory',      category: 'Digital',     price: '$19.00', sales: 98,  status: 'Active',  featured: false, listed: 'Mar 2024' },
  { id: 'P-8818', title: 'Science Lab Worksheets',        seller: 'Priya Sharma',     category: 'Educational', price: '$15.00', sales: 64,  status: 'Active',  featured: true,  listed: 'Apr 2024' },
  { id: 'P-8817', title: 'Grade 12 Exam Papers 2024',     seller: 'ExamLeaks99',      category: 'Educational', price: '$12.00', sales: 34,  status: 'Flagged', featured: false, listed: 'May 2025' },
  { id: 'P-8816', title: 'Ceramic Mug Set — Handmade',    seller: 'CeramicsBy Anna',  category: 'Handmade',    price: '$58.00', sales: 22,  status: 'Active',  featured: false, listed: 'Jun 2024' },
];

const statusStyle: Record<string, { bg: string; color: string }> = {
  Active:  { bg: '#E3F4EA', color: '#1E7A3C' },
  Flagged: { bg: '#FFF4DC', color: '#B36200' },
  Removed: { bg: '#FDECEA', color: '#C0392B' },
};

const metrics = [
  { label: 'Total Listings', value: '28,492', trend: '+314 this week', sub: null,                  trendUp: true  },
  { label: 'Active',         value: '27,840', trend: null,             sub: 'Live on marketplace', trendUp: false },
  { label: 'Flagged',        value: '127',    trend: null,             sub: 'Pending review',      trendUp: false },
  { label: 'GMV This Month', value: '$8.4M',  trend: '+18.2%',         sub: null,                  trendUp: true  },
] as const;

const poppins   = "'Poppins', sans-serif";
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };

// ── Component ─────────────────────────────────────────────────────────────────
export function AdminMarketplace() {
  usePageTitle('Marketplace');
  const [search,     setSearch] = useState('');
  const [catFilter,  setCat]    = useState('');
  const [statFilter, setStat]   = useState('');

  const filtered = PRODUCTS.filter(p => {
    const q = search.toLowerCase();
    if (q && !p.title.toLowerCase().includes(q) && !p.seller.toLowerCase().includes(q)) return false;
    if (catFilter  && catFilter  !== 'All Categories' && p.category !== catFilter)  return false;
    if (statFilter && statFilter !== 'All Statuses'   && p.status   !== statFilter) return false;
    return true;
  });

  return (
    <div style={{ padding: '24px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: poppins }}>

      {/* ── Header ── */}
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#141413', marginBottom: 3 }}>Marketplace Management</h1>
        <p style={{ fontSize: 12, color: '#8C8A82' }}>Review, feature and manage all marketplace listings.</p>
      </div>

      {/* ── Metrics ── */}
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

      {/* ── Table card ── */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid #E8E6DC', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #E8E6DC', borderRadius: 8, padding: '0 12px', background: '#fff', flex: 1, maxWidth: 300 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8C8A82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input placeholder="Search listings or sellers…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 13, padding: '8px 0', width: '100%', fontFamily: poppins, color: '#2C2A28', background: 'transparent' }} />
          </div>
          <select value={catFilter} onChange={e => setCat(e.target.value)}
            style={{ padding: '8px 12px', fontSize: 13, border: '1px solid #E8E6DC', borderRadius: 8, background: '#fff', color: '#2C2A28', outline: 'none', cursor: 'pointer', fontFamily: poppins }}>
            {['All Categories','Educational','Digital','Handmade','Business Tools'].map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={statFilter} onChange={e => setStat(e.target.value)}
            style={{ padding: '8px 12px', fontSize: 13, border: '1px solid #E8E6DC', borderRadius: 8, background: '#fff', color: '#2C2A28', outline: 'none', cursor: 'pointer', fontFamily: poppins }}>
            {['All Statuses','Active','Flagged','Removed'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['ID','Title','Seller','Category','Price','Sales','Status','Featured','Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E8E6DC', background: '#FAF9F5', whiteSpace: 'nowrap', fontFamily: poppins }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const ss = statusStyle[p.status] ?? { bg: '#F0EEE6', color: '#5A5852' };
                return (
                  <tr key={p.id}
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F0EEE6' : 'none', background: p.status === 'Flagged' ? '#FFFAF9' : 'transparent', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                    onMouseLeave={e => (e.currentTarget.style.background = p.status === 'Flagged' ? '#FFFAF9' : 'transparent')}
                  >
                    {/* ID */}
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#141413', whiteSpace: 'nowrap', fontFamily: poppins }}>{p.id}</td>
                    {/* Title */}
                    <td style={{ padding: '12px 16px', maxWidth: 200 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#4A4945', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0, fontFamily: poppins }}>{p.title}</p>
                    </td>
                    {/* Seller */}
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#4A4945', whiteSpace: 'nowrap', fontFamily: poppins }}>{p.seller}</td>
                    {/* Category */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: '#F0EEE6', color: '#5A5852', fontFamily: poppins }}>{p.category}</span>
                    </td>
                    {/* Price */}
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#141413', fontFamily: poppins }}>{p.price}</td>
                    {/* Sales */}
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#141413', fontFamily: poppins }}>{p.sales.toLocaleString()}</td>
                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: ss.bg, color: ss.color, fontFamily: poppins }}>{p.status}</span>
                    </td>
                    {/* Featured */}
                    <td style={{ padding: '12px 16px' }}>
                      {p.featured
                        ? <Star size={14} style={{ color: '#D97757', fill: '#D97757' }} />
                        : <span style={{ fontSize: 13, color: '#C0BDB5' }}>—</span>
                      }
                    </td>
                    {/* Actions */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button style={{ fontSize: 11, fontWeight: 500, color: p.featured ? '#8C8A82' : '#D97757', background: 'none', border: 'none', cursor: 'pointer', fontFamily: poppins }}>
                          {p.featured ? 'Unfeature' : 'Feature'}
                        </button>
                        <span style={{ color: '#E8E6DC', fontSize: 13 }}>|</span>
                        <button style={{ fontSize: 11, fontWeight: 500, color: '#C13030', background: 'none', border: 'none', cursor: 'pointer', fontFamily: poppins }}>
                          Remove
                        </button>
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