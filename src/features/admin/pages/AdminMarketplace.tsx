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
    <div className="px-7 pt-6 pb-8 flex flex-col gap-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-[18px] font-bold text-charcoal mb-[3px]">Marketplace Management</h1>
        <p className="text-[12px] text-slate">Review, feature and manage all marketplace listings.</p>
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

      {/* ── Table card ── */}
      <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">

        {/* Filters */}
        <div className="flex items-center gap-[10px] px-5 py-[14px] border-b border-bone flex-wrap">
          <div className="flex items-center gap-[6px] border border-bone rounded-lg px-3 bg-white flex-1 max-w-[300px]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8C8A82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input placeholder="Search listings or sellers…" value={search} onChange={e => setSearch(e.target.value)}
              className="border-none outline-none text-[13px] py-2 w-full text-[#2C2A28] bg-transparent" />
          </div>
          <select value={catFilter} onChange={e => setCat(e.target.value)}
            className="px-3 py-2 text-[13px] border border-bone rounded-lg bg-white text-[#2C2A28] outline-none cursor-pointer">
            {['All Categories','Educational','Digital','Handmade','Business Tools'].map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={statFilter} onChange={e => setStat(e.target.value)}
            className="px-3 py-2 text-[13px] border border-bone rounded-lg bg-white text-[#2C2A28] outline-none cursor-pointer">
            {['All Statuses','Active','Flagged','Removed'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['ID','Title','Seller','Category','Price','Sales','Status','Featured','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-[10px] text-[11px] font-semibold text-slate uppercase tracking-[0.05em] border-b border-bone bg-[#FAF9F5] whitespace-nowrap">
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
                    className="transition-colors duration-[120ms]"
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F0EEE6' : 'none', background: p.status === 'Flagged' ? '#FFFAF9' : 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                    onMouseLeave={e => (e.currentTarget.style.background = p.status === 'Flagged' ? '#FFFAF9' : 'transparent')}
                  >
                    {/* ID */}
                    <td className="px-4 py-3 text-[13px] font-semibold text-charcoal whitespace-nowrap">{p.id}</td>
                    {/* Title */}
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-[13px] font-medium text-[#4A4945] overflow-hidden text-ellipsis whitespace-nowrap m-0">{p.title}</p>
                    </td>
                    {/* Seller */}
                    <td className="px-4 py-3 text-[13px] text-[#4A4945] whitespace-nowrap">{p.seller}</td>
                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className="px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold bg-[#F0EEE6] text-[#5A5852]">{p.category}</span>
                    </td>
                    {/* Price */}
                    <td className="px-4 py-3 text-[13px] font-semibold text-charcoal">{p.price}</td>
                    {/* Sales */}
                    <td className="px-4 py-3 text-[13px] text-charcoal">{p.sales.toLocaleString()}</td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className="px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold"
                        style={{ background: ss.bg, color: ss.color }}>{p.status}</span>
                    </td>
                    {/* Featured */}
                    <td className="px-4 py-3">
                      {p.featured
                        ? <Star size={14} style={{ color: '#D97757', fill: '#D97757' }} />
                        : <span className="text-[13px] text-[#C0BDB5]">—</span>
                      }
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="text-[11px] font-medium bg-transparent border-none cursor-pointer"
                          style={{ color: p.featured ? '#8C8A82' : '#D97757' }}>
                          {p.featured ? 'Unfeature' : 'Feature'}
                        </button>
                        <span className="text-[#E8E6DC] text-[13px]">|</span>
                        <button className="text-[11px] font-medium text-[#C13030] bg-transparent border-none cursor-pointer">
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
