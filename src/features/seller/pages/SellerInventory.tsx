import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { Ruler, Coffee, Image, BookOpen, Flame, Palette, Layers, Music } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────
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

// ── Style helpers ─────────────────────────────────────────────────────────────
const poppins = "'Poppins', sans-serif";

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

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerInventory() {
  const navigate = useNavigate();
  usePageTitle('Inventory');
  const [search,  setSearch]  = useState('');
  const [typeF,   setTypeF]   = useState('');
  const [statusF, setStatusF] = useState('');

  const filtered = PRODUCTS.filter(p => {
    const q = search.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
    if (typeF   && typeF   !== 'All Types'    && p.type   !== typeF)   return false;
    if (statusF && statusF !== 'All Status'   && p.status !== statusF) return false;
    return true;
  });

  const inStock  = PRODUCTS.filter(p => p.status === 'Active').length;
  const lowStock = PRODUCTS.filter(p => p.status === 'Low Stock').length;
  const outStock = PRODUCTS.filter(p => p.status === 'Out of Stock').length;
  const digital  = PRODUCTS.filter(p => p.type === 'Digital').length;
  const physical = PRODUCTS.filter(p => p.type === 'Physical').length;

  return (
    <>
      <SellerPageHeader
        title="Inventory"
        subtitle="Monitor stock levels and product availability."
        actions={
          <>
            <button style={{ padding: '7px 16px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
              Import CSV
            </button>
            <button style={{ padding: '7px 16px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
              Export
            </button>
            <button onClick={() => navigate('/seller/products/add')} style={{ padding: '7px 16px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins }}>
              + Add Product
            </button>
          </>
        }
      />

      <div style={{ padding: '20px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: poppins }}>

        {/* ── Metrics row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {/* Total Products */}
          <div style={{ background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Total Products</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#141413', lineHeight: 1.15 }}>{PRODUCTS.length}</p>
            <p style={{ fontSize: 12, color: '#8C8A82', marginTop: 4 }}>All product types</p>
          </div>
          {/* In Stock */}
          <div style={{ background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>In Stock</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#141413', lineHeight: 1.15 }}>{inStock}</p>
            <p style={{ fontSize: 12, color: '#2D8A4E', marginTop: 4 }}>▲ {digital} digital, {physical} physical</p>
          </div>
          {/* Low Stock */}
          <div style={{ background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Low Stock</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#141413', lineHeight: 1.15 }}>{lowStock}</p>
            <p style={{ fontSize: 12, color: '#8C8A82', marginTop: 4 }}>Below threshold</p>
          </div>
          {/* Out of Stock */}
          <div style={{ background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Out of Stock</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#141413', lineHeight: 1.15 }}>{outStock}</p>
            <p style={{ fontSize: 12, color: '#C0392B', marginTop: 4 }}>▼ Needs restocking</p>
          </div>
        </div>

        {/* ── Table card ── */}
        <div style={{ background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid #E8E6DC', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #E8E6DC', borderRadius: 8, padding: '0 12px', background: '#fff' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8C8A82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: 13, padding: '8px 0', width: 200, fontFamily: poppins, color: '#2C2A28' }}
              />
            </div>

            {/* Type filter */}
            <select
              value={typeF || 'All Types'}
              onChange={e => setTypeF(e.target.value === 'All Types' ? '' : e.target.value)}
              style={{ fontSize: 13, padding: '8px 12px', borderRadius: 8, border: '1px solid #E8E6DC', background: '#fff', color: '#2C2A28', outline: 'none', cursor: 'pointer', fontFamily: poppins }}
            >
              {['All Types','Digital','Physical'].map(o => <option key={o}>{o}</option>)}
            </select>

            {/* Status filter */}
            <select
              value={statusF || 'All Status'}
              onChange={e => setStatusF(e.target.value === 'All Status' ? '' : e.target.value)}
              style={{ fontSize: 13, padding: '8px 12px', borderRadius: 8, border: '1px solid #E8E6DC', background: '#fff', color: '#2C2A28', outline: 'none', cursor: 'pointer', fontFamily: poppins }}
            >
              {['All Status','Active','Low Stock','Out of Stock','Draft'].map(o => <option key={o}>{o}</option>)}
            </select>

            {/* Reset */}
            <button
              onClick={() => { setSearch(''); setTypeF(''); setStatusF(''); }}
              style={{ padding: '8px 14px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, color: '#8C8A82', cursor: 'pointer', fontFamily: poppins }}
            >
              Reset Filters
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['SKU','Product','Type','Stock','Status','Price','All-Time Sales','Actions'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '10px 16px',
                      fontSize: 11, fontWeight: 600, color: '#8C8A82',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '1px solid #E8E6DC',
                      background: '#FAF9F5', whiteSpace: 'nowrap',
                      fontFamily: poppins,
                    }}>
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
                      style={{
                        borderBottom: i < filtered.length - 1 ? '1px solid #F0EEE6' : 'none',
                        background: isOos ? '#FFF9F9' : 'transparent',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = isOos ? '#FFF5F5' : '#FAF9F5')}
                      onMouseLeave={e => (e.currentTarget.style.background = isOos ? '#FFF9F9' : 'transparent')}
                    >
                      {/* SKU */}
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#8C8A82' }}>{p.sku}</span>
                      </td>

                      {/* Product */}
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <p.Icon size={20} style={{ color: '#D97757', flexShrink: 0 }} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#141413', fontFamily: poppins }}>{p.name}</span>
                        </div>
                      </td>

                      {/* Type */}
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: ty.bg, color: ty.color, fontFamily: poppins }}>
                          {p.type}
                        </span>
                      </td>

                      {/* Stock */}
                      <td style={{ padding: '13px 16px' }}>
                        {p.stock === null ? (
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#2D8A4E', fontFamily: poppins }}>∞ Unlimited</span>
                        ) : p.stock === 0 ? (
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#C0392B', fontFamily: poppins }}>0 units</span>
                        ) : isLowStock ? (
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#B36200', fontFamily: poppins }}>{p.stock} units</span>
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#141413', fontFamily: poppins }}>{p.stock} units</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color, fontFamily: poppins }}>
                          {p.status}
                        </span>
                      </td>

                      {/* Price */}
                      <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: '#141413', fontFamily: poppins }}>
                        ${p.price}.00
                      </td>

                      {/* All-time Sales */}
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#4A4845', fontFamily: poppins }}>
                        {p.sales.toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={() => navigate('/seller/products/add')}
                            style={{ padding: '4px 12px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 6, fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                          >
                            Edit
                          </button>
                          {(isOos || isLowStock) && (
                            <button style={{ padding: '4px 12px', background: '#FBECE4', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#C96847', cursor: 'pointer', fontFamily: poppins }}>
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
                    <td colSpan={8} style={{ padding: '40px 16px', textAlign: 'center', fontSize: 13, color: '#8C8A82', fontFamily: poppins }}>
                      No products match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid #E8E6DC' }}>
            <span style={{ fontSize: 12, color: '#8C8A82', fontFamily: poppins }}>
              Showing {filtered.length} of {PRODUCTS.length} products
            </span>
          </div>

        </div>
      </div>
    </>
  );
}