import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button }      from '@/components/ui/Button';
import { Card }        from '@/components/ui/Card';
import { MetricCard }  from '@/components/ui/MetricCard';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { Ruler, Coffee, Image, BookOpen, Flame, Palette, Layers, Music } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Data (same products as SellerProducts) ────────────────────────────────────
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
  { sku: 'MTH-001', Icon: Ruler,   name: 'Grade 5 Math Bundle',             type: 'Digital',  stock: null, status: 'Active',       price: 49, sales: 847 },
  { sku: 'MUG-004', Icon: Coffee,  name: 'Ceramic Mug Set (2pk)',            type: 'Physical', stock: 34,   status: 'Active',       price: 58, sales: 203 },
  { sku: 'WAL-012', Icon: Image,   name: 'Linen Wall Hanging',              type: 'Physical', stock: 7,    status: 'Low Stock',    price: 72, sales: 144 },
  { sku: 'ELA-005', Icon: BookOpen,name: 'Reading Comprehension Passages',   type: 'Digital',  stock: null, status: 'Active',       price: 22, sales: 623 },
  { sku: 'CVL-019', Icon: Flame,   name: 'Scented Soy Candle',             type: 'Physical', stock: 0,    status: 'Out of Stock', price: 24, sales: 312 },
  { sku: 'TMP-030', Icon: Palette, name: 'Brand Identity Figma Kit',         type: 'Digital',  stock: null, status: 'Active',       price: 39, sales: 519 },
  { sku: 'SCF-027', Icon: Layers,  name: 'Silk Scarf - Midnight Blue',       type: 'Physical', stock: 12,   status: 'Active',       price: 88, sales: 68  },
  { sku: 'MUS-008', Icon: Music,   name: 'Lo-Fi Chill Music Pack',           type: 'Digital',  stock: null, status: 'Draft',        price: 19, sales: 0   },
];

function StockCell({ stock }: { stock: number | null }) {
  if (stock === null) return <span className="text-[13px] font-semibold text-success">∞ Unlimited</span>;
  if (stock === 0)    return <span className="text-[13px] font-semibold text-error">0</span>;
  if (stock <= 8)     return <span className="text-[13px] font-semibold text-warning">{stock}</span>;
  return <span className="text-[13px] font-semibold text-carbon">{stock}</span>;
}

const TH: React.CSSProperties = {
  textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600,
  color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.05em',
  borderBottom: '1px solid #E8E6DC', background: '#FAF9F5',
  fontFamily: "'Poppins', sans-serif", whiteSpace: 'nowrap',
};
const TD: React.CSSProperties = {
  padding: '13px 12px', fontFamily: "'Poppins', sans-serif",
};

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerInventory() {
  const navigate  = useNavigate();
  const [search,  setSearch]  = useState('');
  const [typeF,   setTypeF]   = useState('');
  const [statusF, setStatusF] = useState('');

  const filtered = PRODUCTS.filter(p => {
    const q = search.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
    if (typeF   && p.type   !== typeF)   return false;
    if (statusF && p.status !== statusF) return false;
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
            <Button variant="ghost"     size="sm">Import CSV</Button>
            <Button variant="secondary" size="sm">Export</Button>
            <Button variant="primary"   size="sm" onClick={() => navigate('/seller/products/add')}>
              + Add Product
            </Button>
          </>
        }
      />

      <div className="p-7 flex flex-col gap-6">
        {/* Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard label="Total Products" value={PRODUCTS.length} sub="All product types" />
          <MetricCard label="In Stock"       value={inStock}  sub={`${digital} digital, ${physical} physical`} trendUp trend="Healthy levels" />
          <MetricCard label="Low Stock"      value={lowStock} sub="Below threshold" />
          <MetricCard label="Out of Stock"   value={outStock} sub="Needs restocking" />
        </div>

        <Card padding="none">
          {/* Filters */}
          <div className="px-5 py-4 flex items-end gap-3 border-b border-bone flex-wrap">
            <div style={{ maxWidth: 260 }} className="flex-1 min-w-[160px]">
              <Input
                placeholder="Search inventory…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="w-[140px]">
              <Select value={typeF} onChange={e => setTypeF(e.target.value)}>
                <option value="">All Types</option>
                <option>Digital</option>
                <option>Physical</option>
              </Select>
            </div>
            <div className="w-[160px]">
              <Select value={statusF} onChange={e => setStatusF(e.target.value)}>
                <option value="">All Statuses</option>
                <option>Active</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
                <option>Draft</option>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table style={{ borderCollapse: 'collapse', width: '100%' }} className="text-[13px]">
              <thead>
                <tr>
                  {['SKU', 'Product', 'Type', 'Stock', 'Status', 'Price', 'All-time Sales', 'Actions'].map(h => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const isOos = p.status === 'Out of Stock';
                  return (
                    <tr
                      key={p.sku}
                      className="hover:bg-cream/50 transition-colors"
                      style={{
                        ...(isOos ? { backgroundColor: '#FFF9F9' } : undefined),
                        borderBottom: i < filtered.length - 1 ? '1px solid #E8E6DC' : undefined,
                      }}
                    >
                      <td style={{ ...TD, fontSize: 12, color: '#8C8A82', fontFamily: 'monospace' }}>{p.sku}</td>
                      <td style={TD}>
                        <div className="flex items-center gap-2.5">
                          <p.Icon size={20} style={{ color: '#D97757', flexShrink: 0 }} />
                          <span className="font-medium text-carbon">{p.name}</span>
                        </div>
                      </td>
                      <td style={TD}>
                        <Badge color={p.type === 'Digital' ? 'blue' : 'gray'}>{p.type}</Badge>
                      </td>
                      <td style={TD}>
                        <StockCell stock={p.stock} />
                      </td>
                      <td style={TD}><StatusBadge status={p.status} /></td>
                      <td style={{ ...TD, fontWeight: 600, color: '#2C2A28' }}>${p.price}</td>
                      <td style={{ ...TD, color: '#4A4845' }}>{p.sales.toLocaleString()}</td>
                      <td style={TD}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate('/seller/products/add')}
                            className="text-[12px] font-medium hover:underline cursor-pointer"
                            style={{ color: '#D97757' }}
                          >
                            Edit
                          </button>
                          {isOos && (
                            <>
                              <span className="text-bone">|</span>
                              <button className="text-[12px] text-info font-medium hover:underline cursor-pointer">
                                Restock
                              </button>
                            </>
                          )}
                          {p.status === 'Low Stock' && (
                            <>
                              <span className="text-bone">|</span>
                              <button className="text-[12px] text-warning font-medium hover:underline cursor-pointer">
                                Restock
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ ...TD, textAlign: 'center', color: '#8C8A82', paddingTop: 40, paddingBottom: 40 }}>
                      No products match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-bone">
            <span className="text-[12px] text-slate">Showing {filtered.length} of {PRODUCTS.length} products</span>
          </div>
        </Card>
      </div>
    </>
  );
}
