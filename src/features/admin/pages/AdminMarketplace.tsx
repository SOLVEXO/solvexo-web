import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Input, Select } from '@/components/ui/Input';

interface Product {
  id:       string;
  title:    string;
  seller:   string;
  category: string;
  price:    string;
  sales:    number;
  status:   'Active' | 'Flagged' | 'Removed';
  featured: boolean;
  listed:   string;
}

const PRODUCTS: Product[] = [
  { id: 'P-8821', title: 'Grade 5 Math Mastery Bundle',   seller: 'Alex Chen',        category: 'Educational', price: '$49.00', sales: 284, status: 'Active',  featured: true,  listed: 'Jan 2024' },
  { id: 'P-8820', title: 'Premium UI Kit Bundle',         seller: 'DesignHub Studio', category: 'Digital',     price: '$79.00', sales: 142, status: 'Flagged', featured: false, listed: 'Feb 2024' },
  { id: 'P-8819', title: 'Lo-Fi Music Sample Pack Vol.3', seller: 'BeatFactory',      category: 'Digital',     price: '$19.00', sales: 98,  status: 'Active',  featured: false, listed: 'Mar 2024' },
  { id: 'P-8818', title: 'Science Lab Worksheets',        seller: 'Priya Sharma',     category: 'Educational', price: '$15.00', sales: 64,  status: 'Active',  featured: true,  listed: 'Apr 2024' },
  { id: 'P-8817', title: 'Grade 12 Exam Papers 2024',     seller: 'ExamLeaks99',      category: 'Educational', price: '$12.00', sales: 34,  status: 'Flagged', featured: false, listed: 'May 2025' },
  { id: 'P-8816', title: 'Ceramic Mug Set — Handmade',    seller: 'CeramicsBy Anna',  category: 'Handmade',    price: '$58.00', sales: 22,  status: 'Active',  featured: false, listed: 'Jun 2024' },
];

const STATUS_COLORS: Record<string, 'green' | 'red' | 'yellow'> = {
  Active:  'green',
  Flagged: 'yellow',
  Removed: 'red',
};

export function AdminMarketplace() {
  const [search, setSearch]   = useState('');
  const [catFilter, setCat]   = useState('');
  const [statFilter, setStat] = useState('');

  const filtered = PRODUCTS.filter(p => {
    const q = search.toLowerCase();
    if (q && !p.title.toLowerCase().includes(q) && !p.seller.toLowerCase().includes(q)) return false;
    if (catFilter  && p.category !== catFilter) return false;
    if (statFilter && p.status   !== statFilter) return false;
    return true;
  });

  return (
    <div className="p-7 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-[18px] font-bold text-carbon">Marketplace Management</h1>
        <p className="text-[12px] text-slate mt-0.5">Review, feature and manage all marketplace listings.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total Listings"   value="28,492" trend="+314 this week" trendUp />
        <MetricCard label="Active"           value="27,840" sub="Live on marketplace" />
        <MetricCard label="Flagged"          value="127"    sub="Pending review" />
        <MetricCard label="GMV This Month"   value="$8.4M"  trend="+18.2%"        trendUp />
      </div>

      {/* Table */}
      <Card padding="none">
        {/* Filters */}
        <div className="px-5 py-4 flex items-end gap-3 border-b border-bone">
          <div style={{ maxWidth: 280 }} className="flex-1">
            <Input placeholder="Search listings or sellers…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="w-[150px]">
            <Select value={catFilter} onChange={e => setCat(e.target.value)}>
              <option value="">All Categories</option>
              <option>Educational</option>
              <option>Digital</option>
              <option>Handmade</option>
              <option>Business Tools</option>
            </Select>
          </div>
          <div className="w-[140px]">
            <Select value={statFilter} onChange={e => setStat(e.target.value)}>
              <option value="">All Statuses</option>
              <option>Active</option>
              <option>Flagged</option>
              <option>Removed</option>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-bone">
                {['ID', 'Title', 'Seller', 'Category', 'Price', 'Sales', 'Status', 'Featured', 'Actions'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-slate uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr
                  key={p.id}
                  className={`hover:bg-cream/50 transition-colors ${i < filtered.length - 1 ? 'border-b border-bone' : ''}`}
                  style={{ background: p.status === 'Flagged' ? '#FFFAF9' : undefined }}
                >
                  <td className="px-4 py-3.5 font-semibold text-carbon whitespace-nowrap">{p.id}</td>
                  <td className="px-4 py-3.5 text-charcoal max-w-[180px]">
                    <p className="truncate font-medium">{p.title}</p>
                  </td>
                  <td className="px-4 py-3.5 text-charcoal whitespace-nowrap">{p.seller}</td>
                  <td className="px-4 py-3.5"><Badge color="gray">{p.category}</Badge></td>
                  <td className="px-4 py-3.5 font-semibold text-carbon">{p.price}</td>
                  <td className="px-4 py-3.5 text-carbon">{p.sales.toLocaleString()}</td>
                  <td className="px-4 py-3.5"><Badge color={STATUS_COLORS[p.status]}>{p.status}</Badge></td>
                  <td className="px-4 py-3.5">
                    <span style={{ fontSize: 14 }}>{p.featured ? '⭐' : '—'}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        className="text-[11px] font-medium cursor-pointer hover:underline"
                        style={{ color: p.featured ? '#8C8A82' : '#D97757' }}
                      >
                        {p.featured ? 'Unfeature' : 'Feature'}
                      </button>
                      <span className="text-bone">|</span>
                      <button className="text-[11px] font-medium cursor-pointer hover:underline" style={{ color: '#C13030' }}>
                        Remove
                      </button>
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
