import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { StorePageHeader } from '@/components/layouts/StoreLayout';
import { Ruler, Coffee, Image, BookOpen, Flame, Palette, Layers, Music } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Product = {
  sku: string;
  Icon: LucideIcon;
  name: string;
  type: 'Digital' | 'Physical';
  stock: number | null;
  status: string;
  price: number;
  sales: number;
};

const PRODUCTS: Product[] = [
  { sku: 'MTH-001', Icon: Ruler,    name: 'Grade 5 Math Bundle',           type: 'Digital',  stock: null, status: 'Active',       price: 49, sales: 847 },
  { sku: 'MUG-004', Icon: Coffee,   name: 'Ceramic Mug Set (2pk)',          type: 'Physical', stock: 34,   status: 'Active',       price: 58, sales: 203 },
  { sku: 'WAL-012', Icon: Image,    name: 'Linen Wall Hanging — Boho',     type: 'Physical', stock: 7,    status: 'Low Stock',    price: 72, sales: 144 },
  { sku: 'ELA-005', Icon: BookOpen, name: 'Reading Comprehension Passages', type: 'Digital',  stock: null, status: 'Active',       price: 22, sales: 623 },
  { sku: 'CVL-019', Icon: Flame,    name: 'Scented Soy Candle — Large',    type: 'Physical', stock: 0,    status: 'Out of Stock', price: 24, sales: 312 },
  { sku: 'TMP-030', Icon: Palette,  name: 'Brand Identity Figma Kit',       type: 'Digital',  stock: null, status: 'Active',       price: 39, sales: 519 },
  { sku: 'SCF-027', Icon: Layers,   name: 'Silk Scarf — Midnight Blue',    type: 'Physical', stock: 12,   status: 'Active',       price: 88, sales: 68  },
  { sku: 'MUS-008', Icon: Music,    name: 'Lo-Fi Chill Music Pack',         type: 'Digital',  stock: null, status: 'Draft',        price: 19, sales: 0   },
];

const typeStyle: Record<string, { bg: string; color: string }> = {
  Digital:  { bg: '#EAF0FB', color: '#2156A8' },
  Physical: { bg: '#FBECE4', color: '#C96847' },
};

const statusStyle: Record<string, { bg: string; color: string }> = {
  Active:         { bg: '#E3F4EA', color: '#1E7A3C' },
  'Low Stock':    { bg: '#FFF4DC', color: '#B36200' },
  'Out of Stock': { bg: '#FDECEA', color: '#C0392B' },
  Draft:          { bg: '#F0EEE6', color: '#8C8A82' },
};

export function StoreInventory() {
  const navigate = useNavigate();
  usePageTitle('Inventory');
  const [search,  setSearch]  = useState('');
  const [typeF,   setTypeF]   = useState('');
  const [statusF, setStatusF] = useState('');

  const filtered = PRODUCTS.filter(p => {
    const q = search.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
    if (typeF   && typeF   !== 'All Types'  && p.type   !== typeF)   return false;
    if (statusF && statusF !== 'All Status' && p.status !== statusF) return false;
    return true;
  });

  const inStock  = PRODUCTS.filter(p => p.status === 'Active').length;
  const lowStock = PRODUCTS.filter(p => p.status === 'Low Stock').length;
  const outStock = PRODUCTS.filter(p => p.status === 'Out of Stock').length;
  const digital  = PRODUCTS.filter(p => p.type === 'Digital').length;
  const physical = PRODUCTS.filter(p => p.type === 'Physical').length;

  return (
    <>
      <StorePageHeader
        title="Inventory"
        subtitle="Monitor stock levels and product availability."
        actions={
          <>
            <button className="px-4 py-[7px] bg-white border border-bone rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer">
              Import CSV
            </button>
            <button className="px-4 py-[7px] bg-white border border-bone rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer">
              Export
            </button>
            <button onClick={() => navigate('products/add')} className="px-4 py-[7px] bg-brand-orange border-0 rounded-lg text-xs font-semibold text-white cursor-pointer">
              + Add Product
            </button>
          </>
        }
      />

      <div className="px-7 pt-5 pb-8 flex flex-col gap-5">

        {/* Metrics row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white border border-bone rounded-[10px] px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">Total Products</p>
            <p className="text-[28px] font-bold text-charcoal leading-[1.15]">{PRODUCTS.length}</p>
            <p className="text-xs text-slate mt-1">All product types</p>
          </div>
          <div className="bg-white border border-bone rounded-[10px] px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">In Stock</p>
            <p className="text-[28px] font-bold text-charcoal leading-[1.15]">{inStock}</p>
            <p className="text-xs text-[#2D8A4E] mt-1">▲ {digital} digital, {physical} physical</p>
          </div>
          <div className="bg-white border border-bone rounded-[10px] px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">Low Stock</p>
            <p className="text-[28px] font-bold text-charcoal leading-[1.15]">{lowStock}</p>
            <p className="text-xs text-slate mt-1">Below threshold</p>
          </div>
          <div className="bg-white border border-bone rounded-[10px] px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">Out of Stock</p>
            <p className="text-[28px] font-bold text-charcoal leading-[1.15]">{outStock}</p>
            <p className="text-xs text-[#C0392B] mt-1">▼ Needs restocking</p>
          </div>
        </div>

        {/* Table card */}
        <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">

          {/* Filters */}
          <div className="flex items-center gap-[10px] px-5 py-[14px] border-b border-bone flex-wrap">
            <div className="flex items-center gap-[6px] border border-bone rounded-lg px-3 bg-white">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8C8A82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="border-0 outline-none text-[13px] py-2 w-[200px] text-charcoal bg-transparent"
              />
            </div>
            <select
              value={typeF || 'All Types'}
              onChange={e => setTypeF(e.target.value === 'All Types' ? '' : e.target.value)}
              className="text-[13px] px-3 py-2 rounded-lg border border-bone bg-white text-charcoal outline-none cursor-pointer"
            >
              {['All Types','Digital','Physical'].map(o => <option key={o}>{o}</option>)}
            </select>
            <select
              value={statusF || 'All Status'}
              onChange={e => setStatusF(e.target.value === 'All Status' ? '' : e.target.value)}
              className="text-[13px] px-3 py-2 rounded-lg border border-bone bg-white text-charcoal outline-none cursor-pointer"
            >
              {['All Status','Active','Low Stock','Out of Stock','Draft'].map(o => <option key={o}>{o}</option>)}
            </select>
            <button
              onClick={() => { setSearch(''); setTypeF(''); setStatusF(''); }}
              className="px-[14px] py-2 bg-white border border-bone rounded-lg text-xs text-slate cursor-pointer"
            >
              Reset Filters
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['SKU','Product','Type','Stock','Status','Price','All-Time Sales','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-[10px] text-[11px] font-semibold text-slate uppercase tracking-[0.05em] border-b border-bone bg-cream whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const isOos      = p.status === 'Out of Stock';
                  const isLowStock = p.status === 'Low Stock';
                  const ty         = typeStyle[p.type]     ?? { bg: '#F0EEE6', color: '#5A5852' };
                  const st         = statusStyle[p.status] ?? { bg: '#F0EEE6', color: '#5A5852' };

                  return (
                    <tr
                      key={p.sku}
                      className="transition-[background] duration-[0.12s]"
                      style={{
                        borderBottom: i < filtered.length - 1 ? '1px solid #F0EEE6' : 'none',
                        background: isOos ? '#FFF9F9' : 'transparent',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = isOos ? '#FFF5F5' : '#FAF9F5')}
                      onMouseLeave={e => (e.currentTarget.style.background = isOos ? '#FFF9F9' : 'transparent')}
                    >
                      <td className="px-4 py-[13px]">
                        <span className="text-[11px] font-mono text-slate">{p.sku}</span>
                      </td>
                      <td className="px-4 py-[13px]">
                        <div className="flex items-center gap-[10px]">
                          <p.Icon size={20} className="text-brand-orange shrink-0" />
                          <span className="text-[13px] font-medium text-charcoal">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-[13px]">
                        <span className="inline-block px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold" style={{ background: ty.bg, color: ty.color }}>
                          {p.type}
                        </span>
                      </td>
                      <td className="px-4 py-[13px]">
                        {p.stock === null ? (
                          <span className="text-[13px] font-semibold text-[#2D8A4E]">∞ Unlimited</span>
                        ) : p.stock === 0 ? (
                          <span className="text-[13px] font-semibold text-[#C0392B]">0 units</span>
                        ) : isLowStock ? (
                          <span className="text-[13px] font-semibold text-[#B36200]">{p.stock} units</span>
                        ) : (
                          <span className="text-[13px] font-semibold text-charcoal">{p.stock} units</span>
                        )}
                      </td>
                      <td className="px-4 py-[13px]">
                        <span className="inline-block px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold" style={{ background: st.bg, color: st.color }}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-[13px] text-[13px] font-semibold text-charcoal">
                        ${p.price}.00
                      </td>
                      <td className="px-4 py-[13px] text-[13px] text-[#4A4845]">
                        {p.sales.toLocaleString()}
                      </td>
                      <td className="px-4 py-[13px]">
                        <div className="flex items-center gap-[6px]">
                          <button
                            onClick={() => navigate('products/add')}
                            className="px-3 py-1 bg-white border border-bone rounded-md text-xs text-[#4A4945] cursor-pointer hover:bg-cream"
                          >
                            Edit
                          </button>
                          {(isOos || isLowStock) && (
                            <button className="px-3 py-1 bg-brand-pale-orange border-0 rounded-md text-xs font-semibold text-[#C96847] cursor-pointer">
                              Restock
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-[13px] text-slate">
                      No products match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-bone">
            <span className="text-xs text-slate">
              Showing {filtered.length} of {PRODUCTS.length} products
            </span>
          </div>

        </div>
      </div>
    </>
  );
}
