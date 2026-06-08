import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { SolvexoIcon } from '@/components/ui/SolvexoLogo';
import {
  ArrowRight, ShoppingCart, ClipboardList, Package, BarChart2,
  Camera, CreditCard, Banknote, Smartphone, Zap, CheckCircle,
  User, Tag, Printer, Mail, Star, Pause, Search, Coffee, ShoppingBag,
  Image as ImageIcon, Flame, Leaf, Droplets, Pencil, Sparkles, BookOpen,
  Droplet, Key, Utensils, Ruler,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PaymentMethod, DiscountType, AppliedDiscount } from '@/types';

// ── Data ─────────────────────────────────────────────────────────────────────
const POS_PRODUCTS: { name: string; price: number; icon: LucideIcon; sku: string; category: string; stock: number }[] = [
  { name: 'Ceramic Mug',        price: 28, icon: Coffee,      sku: 'MUG-001', category: 'Ceramics',    stock: 34 },
  { name: 'Linen Tote',         price: 42, icon: ShoppingBag, sku: 'TOT-002', category: 'Accessories', stock: 18 },
  { name: 'Wall Print A3',      price: 18, icon: ImageIcon,   sku: 'PRT-003', category: 'Prints',      stock: 52 },
  { name: 'Scented Candle',     price: 24, icon: Flame,       sku: 'CND-004', category: 'Candles',     stock: 0  },
  { name: 'Cork Coasters 4pk',  price: 16, icon: Leaf,        sku: 'CST-005', category: 'Accessories', stock: 29 },
  { name: 'Hand Lotion 100ml',  price: 14, icon: Droplets,    sku: 'LOT-006', category: 'Accessories', stock: 45 },
  { name: 'Bamboo Pen Set',     price: 22, icon: Pencil,      sku: 'PEN-007', category: 'Accessories', stock: 12 },
  { name: 'Photo Book S',       price: 36, icon: Camera,      sku: 'PHO-008', category: 'Prints',      stock: 8  },
  { name: 'Silk Scrunchie 3pk', price: 12, icon: Sparkles,    sku: 'SCR-009', category: 'Accessories', stock: 67 },
  { name: 'Travel Journal',     price: 20, icon: BookOpen,    sku: 'JRN-010', category: 'Stationery',  stock: 23 },
  { name: 'Essential Oil 30ml', price: 19, icon: Droplet,     sku: 'OIL-011', category: 'Candles',     stock: 31 },
  { name: 'Macrame Keyring',    price: 10, icon: Key,         sku: 'KEY-012', category: 'Accessories', stock: 44 },
  { name: 'Ceramic Bowl Set',   price: 55, icon: Utensils,    sku: 'BWL-013', category: 'Ceramics',    stock: 7  },
  { name: 'Beeswax Candle',     price: 18, icon: Flame,       sku: 'BCN-014', category: 'Candles',     stock: 19 },
  { name: 'Washi Tape Set',     price: 9,  icon: Ruler,       sku: 'WSH-015', category: 'Stationery',  stock: 88 },
  { name: 'Linen Napkins 4pk',  price: 32, icon: Utensils,    sku: 'NAP-016', category: 'Accessories', stock: 14 },
];

const HELD_SALES = [
  { id: 'H-001', customer: 'Walk-in',  items: 3, total: 74.00,  time: '2:14 PM' },
  { id: 'H-002', customer: 'Sarah M.', items: 1, total: 42.00,  time: '2:31 PM' },
];

const RECENT_SALES = [
  { id: 'POS-8841', customer: 'David R.', items: 2, total: 52.00,  method: 'Card', time: '3:05 PM' },
  { id: 'POS-8840', customer: 'Walk-in',  items: 4, total: 86.00,  method: 'Cash', time: '2:48 PM' },
  { id: 'POS-8839', customer: 'Lena K.',  items: 1, total: 24.00,  method: 'Tap',  time: '2:31 PM' },
  { id: 'POS-8838', customer: 'Walk-in',  items: 3, total: 61.50,  method: 'Card', time: '1:59 PM' },
  { id: 'POS-8837', customer: 'Tom B.',   items: 6, total: 118.00, method: 'Cash', time: '1:22 PM' },
];

const POS_CUSTOMERS = [
  { name: 'Sarah Mitchell', email: 'sarah@email.com', points: 420, segment: 'VIP'   },
  { name: 'David Reynolds', email: 'david@email.com', points: 180, segment: 'Loyal' },
  { name: 'Lena Kowalski',  email: 'lena@email.com',  points: 60,  segment: 'New'   },
];

type CartItem  = { name: string; price: number; icon: LucideIcon; sku: string; qty: number; customPrice: number | null };
type PosView   = 'charge' | 'customer' | 'discount' | 'receipt';
type ActiveTab = 'sale' | 'orders' | 'products' | 'summary';

const C = {
  orange:  '#D97757',
  white:   '#FFFFFF',
  muted:   '#5C5A58',
  faint:   '#6A6866',
  border:  '#2C2A28',
  surface: '#1A1918',
  bg:      '#0F0E0D',
};

// ── POS Top Bar ───────────────────────────────────────────────────────────────
function POSTopBar({
  activeTab, setActiveTab, navigate,
}: {
  activeTab: ActiveTab;
  setActiveTab: (t: ActiveTab) => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <div
      style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16,
        padding: '0 20px', height: 52,
        background: C.surface, borderBottom: `1px solid ${C.border}`,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <SolvexoIcon size={26} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.white }}>POS Register</span>
        <div style={{ background: C.border, borderRadius: 6, padding: '2px 8px' }}>
          <span style={{ fontSize: 10, color: C.orange }}>● Live</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: C.border, borderRadius: 8, padding: 3 }}>
        {(['sale', 'orders', 'products', 'summary'] as const).map(tab => {
          const icons: Record<ActiveTab, LucideIcon> = { sale: ShoppingCart, orders: ClipboardList, products: Package, summary: BarChart2 };
          const Icon = icons[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12,
                fontWeight: 500, cursor: 'pointer', border: 'none',
                fontFamily: "'Poppins', sans-serif",
                background: activeTab === tab ? C.orange : 'transparent',
                color: activeTab === tab ? C.white : C.faint,
                display: 'flex', alignItems: 'center', gap: 5,
                textTransform: 'capitalize',
                transition: 'background 0.15s',
              }}
            >
              <Icon size={12} />
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      {/* Shift info */}
      <div style={{ textAlign: 'right', marginRight: 8 }}>
        <p style={{ fontSize: 11, color: C.muted }}>Shift: 9:00 AM · Open</p>
        <p style={{ fontSize: 11, fontWeight: 500, color: C.orange }}>Alex Chen · Register 1</p>
      </div>
      <Avatar name="Alex Chen" size={30} variant="pos" />
      <button
        onClick={() => navigate('/seller/dashboard')}
        style={{
          padding: '6px 12px', borderRadius: 8, fontSize: 11,
          cursor: 'pointer', border: `1px solid ${C.border}`,
          background: 'transparent', color: 'rgba(255,255,255,0.45)',
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        ← Dashboard
      </button>
    </div>
  );
}

// ── Sale Tab ──────────────────────────────────────────────────────────────────
function SaleTab() {
  const [cart, setCart]                       = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery]         = useState('');
  const [activeCategory, setActiveCategory]   = useState('All');
  const [paymentMethod, setPaymentMethod]     = useState<PaymentMethod>('card');
  const [posView, setPosView]                 = useState<PosView>('charge');
  const [discountType, setDiscountType]       = useState<DiscountType>('pct');
  const [discountVal, setDiscountVal]         = useState('');
  const [couponCode, setCouponCode]           = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [customer, setCustomer]               = useState<(typeof POS_CUSTOMERS)[0] | null>(null);
  const [cashGiven, setCashGiven]             = useState('');
  const [note, setNote]                       = useState('');

  const categories = useMemo(() => ['All', ...new Set(POS_PRODUCTS.map(p => p.category))], []);
  const filtered   = useMemo(() => POS_PRODUCTS.filter(p =>
    (activeCategory === 'All' || p.category === activeCategory) &&
    (!searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  ), [activeCategory, searchQuery]);

  const addItem      = (p: (typeof POS_PRODUCTS)[0]) => {
    if (p.stock === 0) return;
    setCart(prev => {
      const ex = prev.find(i => i.name === p.name);
      if (ex) return prev.map(i => i.name === p.name ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...p, qty: 1, customPrice: null }];
    });
  };
  const removeItem   = (name: string) => setCart(prev => prev.filter(i => i.name !== name));
  const updateQty    = (name: string, delta: number) => setCart(prev => prev.map(i => i.name === name ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  const setCustomPrice = (name: string, price: string) => setCart(prev => prev.map(i => i.name === name ? { ...i, customPrice: parseFloat(price) || null } : i));

  const subtotal    = cart.reduce((s, i) => s + (i.customPrice ?? i.price) * i.qty, 0);
  const discountAmt = appliedDiscount
    ? (appliedDiscount.type === 'pct' ? subtotal * (appliedDiscount.value / 100) : Math.min(appliedDiscount.value, subtotal))
    : 0;
  const afterDiscount = subtotal - discountAmt;
  const tax           = afterDiscount * 0.08;
  const total         = afterDiscount + tax;
  const cashChange    = cashGiven ? Math.max(0, parseFloat(cashGiven) - total) : 0;

  const applyDiscount = () => {
    if (discountType === 'coupon' && couponCode === 'SAVE10') {
      setAppliedDiscount({ type: 'pct', value: 10, label: 'Coupon SAVE10' });
      setPosView('charge'); return;
    }
    if (discountType !== 'coupon' && discountVal) {
      setAppliedDiscount({ type: discountType, value: parseFloat(discountVal), label: discountType === 'pct' ? `${discountVal}% off` : `$${discountVal} off` });
      setPosView('charge');
    }
  };

  const resetSale = () => { setCart([]); setAppliedDiscount(null); setCustomer(null); setCashGiven(''); setNote(''); setPosView('charge'); };

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

      {/* ── Left: Product Grid ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: `1px solid ${C.border}` }}>

        {/* Search bar */}
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          padding: '10px 16px', background: C.surface,
          borderBottom: `1px solid ${C.border}`, flexShrink: 0,
        }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center',
            background: C.border, borderRadius: 8, overflow: 'hidden',
          }}>
            <Search size={13} style={{ color: C.faint, marginLeft: 12, flexShrink: 0 }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products or scan barcode (SKU)..."
              style={{
                flex: 1, padding: '8px 12px', fontSize: 13,
                background: 'transparent', border: 'none', outline: 'none',
                color: C.white, fontFamily: "'Poppins', sans-serif",
              }}
            />
          </div>
          <button style={{
            padding: '7px 14px', background: C.border, border: 'none',
            borderRadius: 8, fontSize: 12, color: C.faint, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            fontFamily: "'Poppins', sans-serif",
          }}>
            <Camera size={12} /> Scan
          </button>
          <button style={{
            padding: '7px 14px', background: C.border, border: 'none',
            borderRadius: 8, fontSize: 12, color: C.faint, cursor: 'pointer',
            flexShrink: 0, fontFamily: "'Poppins', sans-serif",
          }}>
            + Custom Item
          </button>
        </div>

        {/* Category pills */}
        <div style={{
          display: 'flex', gap: 6, padding: '8px 16px',
          background: C.surface, borderBottom: `1px solid ${C.border}`,
          flexShrink: 0, overflowX: 'auto',
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                flexShrink: 0, padding: '5px 14px', borderRadius: 20,
                fontSize: 11, fontWeight: 500, cursor: 'pointer', border: 'none',
                fontFamily: "'Poppins', sans-serif",
                background: activeCategory === cat ? C.orange : C.border,
                color: activeCategory === cat ? C.white : C.faint,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product cards grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12,
          }}>
            {filtered.map(p => {
              const inCart = cart.find(i => i.name === p.name);
              return (
                <button
                  key={p.name}
                  onClick={() => addItem(p)}
                  style={{
                    position: 'relative',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '20px 14px 16px',
                    background: C.surface,
                    border: `1px solid ${inCart ? C.orange : C.border}`,
                    borderRadius: 12,
                    cursor: p.stock === 0 ? 'not-allowed' : 'pointer',
                    opacity: p.stock === 0 ? 0.45 : 1,
                    transition: 'border-color 0.15s',
                    textAlign: 'center',
                    minHeight: 0,
                  }}
                >
                  {/* Qty badge */}
                  {inCart && (
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 20, height: 20, borderRadius: '50%',
                      background: C.orange, color: C.white,
                      fontSize: 10, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {inCart.qty}
                    </div>
                  )}

                  {/* Icon */}
                  <div style={{
                    width: 48, height: 48, marginBottom: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <p.icon size={30} style={{ color: C.orange, opacity: p.stock === 0 ? 0.3 : 1 }} />
                  </div>

                  {/* Name */}
                  <span style={{
                    display: 'block', fontSize: 12, fontWeight: 600,
                    color: C.white, lineHeight: 1.35, marginBottom: 4,
                    wordBreak: 'break-word',
                  }}>
                    {p.name}
                  </span>

                  {/* SKU */}
                  <span style={{
                    display: 'block', fontSize: 10, color: C.muted, marginBottom: 8,
                  }}>
                    {p.sku}
                  </span>

                  {/* Price */}
                  <span style={{
                    display: 'block', fontSize: 15, fontWeight: 700,
                    color: p.stock === 0 ? C.muted : C.orange,
                  }}>
                    ${p.price.toFixed(2)}
                  </span>

                  {/* Stock warning */}
                  {p.stock > 0 && p.stock <= 8 && (
                    <span style={{ display: 'block', fontSize: 10, color: '#C08B1E', marginTop: 4 }}>
                      Low: {p.stock} left
                    </span>
                  )}
                  {p.stock === 0 && (
                    <span style={{ display: 'block', fontSize: 10, color: '#C13030', marginTop: 4 }}>
                      Out of stock
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Held sales bar */}
        {HELD_SALES.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', background: C.surface,
            borderTop: `1px solid ${C.border}`, flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>On Hold:</span>
            {HELD_SALES.map(h => (
              <button
                key={h.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 12px', background: C.border,
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 500, color: C.white }}>{h.customer}</span>
                <span style={{ fontSize: 11, color: C.orange }}>${h.total.toFixed(2)}</span>
                <span style={{ fontSize: 10, color: C.muted }}>{h.time}</span>
              </button>
            ))}
            <button style={{
              marginLeft: 'auto', padding: '5px 12px', background: 'transparent',
              border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer',
              fontSize: 11, color: C.faint, fontFamily: "'Poppins', sans-serif",
            }}>
              Hold Current Sale
            </button>
          </div>
        )}
      </div>

      {/* ── Right: Cart Panel ── */}
      <div style={{
        width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column',
        position: 'relative', background: C.surface,
      }}>
        {/* Cart header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 18px', borderBottom: `1px solid ${C.border}`, flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.white }}>Current Sale</p>
            {cart.length > 0 && (
              <p style={{ fontSize: 11, color: '#8C8A82', marginTop: 1 }}>
                {cart.reduce((s, i) => s + i.qty, 0)} items · ${subtotal.toFixed(2)} subtotal
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setPosView(posView === 'customer' ? 'charge' : 'customer')}
              style={{
                padding: '5px 10px', background: posView === 'customer' ? '#B95A3A' : C.border,
                border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
                color: customer ? C.orange : C.faint,
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              <User size={11} />{customer ? customer.name.split(' ')[0] : 'Customer'}
            </button>
            <button
              onClick={() => setPosView(posView === 'discount' ? 'charge' : 'discount')}
              style={{
                padding: '5px 10px', background: posView === 'discount' ? '#B95A3A' : C.border,
                border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
                color: appliedDiscount ? C.orange : C.faint,
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              <Tag size={11} />{appliedDiscount ? appliedDiscount.label : 'Discount'}
            </button>
          </div>
        </div>

        {/* Customer panel */}
        {posView === 'customer' && (
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, background: '#141312', flexShrink: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.white, marginBottom: 10 }}>Attach Customer</p>
            <input
              placeholder="Search by name or email..."
              style={{
                width: '100%', background: C.border, border: 'none', borderRadius: 8,
                padding: '7px 12px', fontSize: 12, color: C.white, outline: 'none',
                marginBottom: 10, fontFamily: "'Poppins', sans-serif", boxSizing: 'border-box',
              }}
            />
            {POS_CUSTOMERS.map(c => (
              <button
                key={c.email}
                onClick={() => { setCustomer(c); setPosView('charge'); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 10px', borderRadius: 8, marginBottom: 4,
                  background: customer?.email === c.email ? C.border : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                <Avatar name={c.name} size={28} variant="pos" />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: C.white }}>{c.name}</p>
                  <p style={{ fontSize: 10, color: C.muted }}>{c.email}</p>
                </div>
                <span style={{ background: '#FBECE4', color: '#B95A3A', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Star size={9} style={{ fill: '#B95A3A' }} />{c.points} pts
                </span>
              </button>
            ))}
            <button onClick={() => { setCustomer(null); setPosView('charge'); }} style={{ width: '100%', textAlign: 'center', padding: '6px 0', fontSize: 11, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>
              × Clear customer
            </button>
          </div>
        )}

        {/* Discount panel */}
        {posView === 'discount' && (
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, background: '#141312', flexShrink: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.white, marginBottom: 12 }}>Apply Discount</p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {(['pct', 'fixed', 'coupon'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setDiscountType(t)}
                  style={{
                    flex: 1, padding: '6px 0', textAlign: 'center', borderRadius: 8,
                    fontSize: 11, fontWeight: 500, cursor: 'pointer',
                    fontFamily: "'Poppins', sans-serif",
                    background: discountType === t ? '#B95A3A' : C.border,
                    border: `1px solid ${discountType === t ? C.orange : 'transparent'}`,
                    color: discountType === t ? C.white : C.faint,
                  }}
                >
                  {t === 'pct' ? '% Off' : t === 'fixed' ? '$ Off' : 'Coupon'}
                </button>
              ))}
            </div>
            {discountType !== 'coupon' ? (
              <input
                value={discountVal}
                onChange={e => setDiscountVal(e.target.value)}
                placeholder={discountType === 'pct' ? 'e.g. 10 (for 10%)' : 'e.g. 5.00'}
                style={{ width: '100%', background: C.border, border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: C.white, outline: 'none', marginBottom: 8, fontFamily: "'Poppins', sans-serif", boxSizing: 'border-box' }}
              />
            ) : (
              <input
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                placeholder="Enter coupon code (try: SAVE10)"
                style={{ width: '100%', background: C.border, border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: C.white, outline: 'none', marginBottom: 8, fontFamily: "'Poppins', sans-serif", boxSizing: 'border-box' }}
              />
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={applyDiscount} style={{ flex: 1, background: C.orange, border: 'none', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 600, color: C.white, cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>Apply</button>
              {appliedDiscount && (
                <button onClick={() => { setAppliedDiscount(null); setPosView('charge'); }} style={{ padding: '8px 12px', background: C.border, border: 'none', borderRadius: 8, fontSize: 12, color: '#C13030', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>Remove</button>
              )}
            </div>
          </div>
        )}

        {/* Cart items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 18px' }}>
          {cart.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', paddingTop: 40 }}>
              <ShoppingCart size={48} style={{ color: C.border, marginBottom: 12 }} />
              <p style={{ fontSize: 13, color: '#3A3836', textAlign: 'center', lineHeight: 1.5 }}>
                Tap a product to add it<br />to the cart
              </p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.name} style={{ padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <item.icon size={18} style={{ color: C.orange, marginTop: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: C.white }}>{item.name}</p>
                    <p style={{ fontSize: 10, color: C.muted }}>{item.sku}</p>
                  </div>
                  <button onClick={() => removeItem(item.name)} style={{ fontSize: 16, color: '#3A3836', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, marginTop: -2 }}>×</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingLeft: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={() => updateQty(item.name, -1)} style={{ width: 22, height: 22, borderRadius: 6, background: C.border, border: 'none', color: C.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.white, width: 20, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.name, 1)} style={{ width: 22, height: 22, borderRadius: 6, background: C.border, border: 'none', color: C.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>+</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, color: C.muted }}>$</span>
                    <input
                      value={item.customPrice ?? item.price}
                      onChange={e => setCustomPrice(item.name, e.target.value)}
                      style={{
                        width: 52, textAlign: 'right', background: C.border,
                        border: `1px solid ${item.customPrice ? C.orange : C.border}`,
                        borderRadius: 6, padding: '2px 6px', fontSize: 12, outline: 'none',
                        color: item.customPrice ? C.orange : C.white,
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>
                    ${((item.customPrice ?? item.price) * item.qty).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
          {cart.length > 0 && (
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add order note..."
              style={{
                width: '100%', marginTop: 10, background: '#141312',
                border: `1px solid ${C.border}`, borderRadius: 8,
                padding: '6px 10px', fontSize: 11, color: C.faint,
                outline: 'none', fontFamily: "'Poppins', sans-serif", boxSizing: 'border-box',
              }}
            />
          )}
        </div>

        {/* Cart footer */}
        <div style={{ padding: '14px 18px', borderTop: `1px solid ${C.border}`, background: '#141312', flexShrink: 0 }}>
          {cart.length > 0 && (
            <>
              {/* Totals */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: C.faint }}>Subtotal</span>
                  <span style={{ fontSize: 12, color: C.white }}>${subtotal.toFixed(2)}</span>
                </div>
                {appliedDiscount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#2D8A4E', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Tag size={10} />{appliedDiscount.label}
                    </span>
                    <span style={{ fontSize: 12, color: '#2D8A4E' }}>−${discountAmt.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: C.faint }}>Tax (8%)</span>
                  <span style={{ fontSize: 12, color: C.white }}>${tax.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.white }}>Total</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: C.orange }}>${total.toFixed(2)}</span>
                </div>
                {customer && (
                  <div style={{ marginTop: 6, background: C.surface, borderRadius: 8, padding: '6px 10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: C.faint, display: 'flex', alignItems: 'center', gap: 4 }}><User size={10} />{customer.name}</span>
                    <span style={{ fontSize: 11, color: C.orange }}>+{Math.floor(total)} pts</span>
                  </div>
                )}
              </div>

              {/* Payment methods */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 10 }}>
                {([['card', CreditCard, 'Card'],['cash', Banknote, 'Cash'],['tap', Smartphone, 'Tap'],['split', Zap, 'Split']] as [PaymentMethod, LucideIcon, string][]).map(([id, IconComp, label]) => (
                  <button
                    key={id}
                    onClick={() => setPaymentMethod(id)}
                    style={{
                      padding: '8px 4px', borderRadius: 8, border: `1px solid ${paymentMethod === id ? C.orange : 'transparent'}`,
                      background: paymentMethod === id ? '#B95A3A' : C.border,
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    <IconComp size={14} style={{ color: paymentMethod === id ? C.white : C.faint }} />
                    <span style={{ fontSize: 10, fontWeight: 500, color: paymentMethod === id ? C.white : C.faint }}>{label}</span>
                  </button>
                ))}
              </div>

              {/* Cash tendered */}
              {paymentMethod === 'cash' && (
                <div style={{ background: C.surface, borderRadius: 8, padding: 12, marginBottom: 10 }}>
                  <p style={{ fontSize: 11, color: C.faint, marginBottom: 6 }}>Cash tendered</p>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <input
                      value={cashGiven}
                      onChange={e => setCashGiven(e.target.value)}
                      placeholder="0.00"
                      style={{ flex: 1, background: C.border, border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 13, color: C.white, outline: 'none', fontFamily: "'Poppins', sans-serif" }}
                    />
                    {[20, 50, 100].map(amt => (
                      <button key={amt} onClick={() => setCashGiven(amt.toString())} style={{ padding: '6px 10px', background: C.border, border: 'none', borderRadius: 8, fontSize: 11, color: C.white, cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>${amt}</button>
                    ))}
                  </div>
                  {cashGiven && parseFloat(cashGiven) >= total && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: C.faint }}>Change due</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#2D8A4E' }}>${cashChange.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Charge button */}
          <button
            onClick={() => cart.length > 0 && setPosView('receipt')}
            style={{
              width: '100%', borderRadius: 10, padding: '13px 0',
              textAlign: 'center', fontSize: 15, fontWeight: 700,
              color: C.white, border: 'none', cursor: cart.length === 0 ? 'default' : 'pointer',
              background: cart.length === 0 ? C.border : C.orange,
              opacity: cart.length === 0 ? 0.4 : 1,
              fontFamily: "'Poppins', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {cart.length === 0 ? 'Charge $0.00' : <>Charge ${total.toFixed(2)}</>}
          </button>

          {/* Clear / Hold / Print */}
          {cart.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {[['× Clear', null, resetSale], ['Hold', Pause, () => {}], ['Print', Printer, () => {}]].map(([label, Icon, handler]: any) => (
                <button
                  key={label as string}
                  onClick={handler}
                  style={{
                    flex: 1, padding: '7px 0', background: C.surface,
                    border: `1px solid ${C.border}`, borderRadius: 8,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {Icon && <Icon size={11} style={{ color: C.muted }} />}
                  <span style={{ fontSize: 11, color: C.muted }}>{label as string}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Receipt overlay */}
        {posView === 'receipt' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', zIndex: 20 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: 320 }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <CheckCircle size={48} style={{ color: '#2D8A4E', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 18, fontWeight: 700, color: C.white }}>Payment Complete</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: C.orange, margin: '8px 0 4px' }}>${total.toFixed(2)}</p>
                <p style={{ fontSize: 12, color: C.faint }}>{new Date().toLocaleTimeString()} · {paymentMethod}</p>
              </div>
              {paymentMethod === 'cash' && cashChange > 0 && (
                <div style={{ background: '#2D8A4E20', border: '1px solid #2D8A4E', borderRadius: 10, padding: 12, marginBottom: 16, textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: C.faint, marginBottom: 4 }}>Change due</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#2D8A4E' }}>${cashChange.toFixed(2)}</p>
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                {cart.map(item => (
                  <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 11, color: '#8C8A82' }}>{item.qty}× {item.name}</span>
                    <span style={{ fontSize: 11, color: C.white }}>${((item.customPrice ?? item.price) * item.qty).toFixed(2)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
                  <span style={{ fontSize: 12, color: C.faint }}>Total paid</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.white }}>${total.toFixed(2)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[[Mail, 'Email Receipt'],[Printer, 'Print Receipt']].map(([Icon, label]: any) => (
                  <button key={label} style={{ background: C.border, border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 12, color: C.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: "'Poppins', sans-serif" }}>
                    <Icon size={13} />{label}
                  </button>
                ))}
                <button onClick={resetSale} style={{ background: C.orange, border: 'none', borderRadius: 8, padding: '12px 0', fontSize: 13, fontWeight: 700, color: C.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: "'Poppins', sans-serif" }}>
                  New Sale <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Orders Tab ────────────────────────────────────────────────────────────────
function OrdersTab() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
        {[["Today's Sales","$842.50","14 transactions"],["Avg Ticket","$60.18","↑ vs yesterday"],["Top Item","Ceramic Mug","8 sold today"],["Cash in Drawer","$340.00","Expected"]].map(([label,value,sub]) => (
          <div key={label} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.muted, marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: C.white }}>{value}</p>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</p>
          </div>
        ))}
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.white, flex: 1 }}>Recent Transactions</p>
          <input placeholder="Search..." style={{ background: C.border, border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: C.white, outline: 'none', fontFamily: "'Poppins', sans-serif" }} />
          <button style={{ background: C.border, border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, color: C.faint, cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>Export</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Order','Customer','Items','Total','Method','Time','Actions'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.muted, background: '#141312', borderBottom: `1px solid ${C.border}` }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {RECENT_SALES.map(s => (
              <tr key={s.id} style={{ borderBottom: `1px solid ${C.surface}` }}>
                <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 12, fontWeight: 700, color: C.orange }}>{s.id}</span></td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={s.customer === 'Walk-in' ? 'WI' : s.customer} size={24} variant="pos" />
                    <span style={{ fontSize: 12, color: C.white }}>{s.customer}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 12, color: C.faint }}>{s.items}</span></td>
                <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 13, fontWeight: 600, color: C.white }}>${s.total.toFixed(2)}</span></td>
                <td style={{ padding: '12px 16px' }}><Badge color={s.method === 'Card' ? 'blue' : s.method === 'Cash' ? 'green' : 'orange'}>{s.method}</Badge></td>
                <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 11, color: C.muted }}>{s.time}</span></td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['Receipt','Refund'].map((a, i) => (
                      <button key={a} style={{ padding: '4px 10px', background: C.border, border: 'none', borderRadius: 6, fontSize: 11, color: i === 1 ? '#C13030' : C.faint, cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>{a}</button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Products Tab ──────────────────────────────────────────────────────────────
function ProductsTab() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: C.white, flex: 1 }}>Product Catalog</p>
        <input placeholder="Search SKU or name..." style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 13, color: C.white, outline: 'none', fontFamily: "'Poppins', sans-serif" }} />
        <button style={{ padding: '8px 16px', background: C.orange, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: C.white, cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>+ Add Product</button>
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['SKU','Product','Category','Price','Stock','Status','Actions'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.muted, background: '#141312', borderBottom: `1px solid ${C.border}` }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {POS_PRODUCTS.map(p => (
              <tr key={p.sku} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 11, fontFamily: 'monospace', color: C.muted }}>{p.sku}</span></td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p.icon size={18} style={{ color: C.orange, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: C.white }}>{p.name}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 16px' }}><Badge color="gray">{p.category}</Badge></td>
                <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 13, fontWeight: 600, color: C.orange }}>${p.price.toFixed(2)}</span></td>
                <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 12, color: p.stock === 0 ? '#C13030' : p.stock <= 8 ? '#C08B1E' : C.faint }}>{p.stock === 0 ? 'Out of stock' : `${p.stock} units`}</span></td>
                <td style={{ padding: '10px 16px' }}><Badge color={p.stock === 0 ? 'red' : p.stock <= 8 ? 'yellow' : 'green'}>{p.stock === 0 ? 'Out of Stock' : p.stock <= 8 ? 'Low Stock' : 'In Stock'}</Badge></td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ padding: '4px 10px', background: C.border, border: 'none', borderRadius: 6, fontSize: 11, color: C.faint, cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>Edit</button>
                    {p.stock <= 8 && <button style={{ padding: '4px 10px', background: C.border, border: 'none', borderRadius: 6, fontSize: 11, color: C.orange, cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>Restock</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Summary Tab ───────────────────────────────────────────────────────────────
function SummaryTab() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: C.white, flex: 1 }}>Shift Summary</p>
        <p style={{ fontSize: 12, color: C.muted }}>Opened 9:00 AM · May 22, 2026</p>
        <button style={{ padding: '8px 16px', background: '#C1303020', border: '1px solid #C13030', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#C13030', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>Close Shift</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {[["Total Sales","$842.50","14 transactions"],["Cash Sales","$340.00","5 transactions"],["Card Sales","$502.50","9 transactions"],["Avg Transaction","$60.18","+$4.20 vs yesterday"],["Items Sold","38 units","Across 16 products"],["Refunds","$0.00","0 refunds today"]].map(([label,value,sub]) => (
          <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.muted, marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: C.white }}>{value}</p>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 14 }}>Top Sellers Today</p>
          {[['Ceramic Mug',8,'$224.00'],['Scented Candle',6,'$144.00'],['Bamboo Pen Set',5,'$110.00'],['Linen Tote',4,'$168.00']].map(([name,qty,revenue]) => (
            <div key={name as string} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: C.white, flex: 1 }}>{name as string}</span>
              <span style={{ fontSize: 11, color: C.muted }}>{qty} sold</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.orange }}>{revenue}</span>
            </div>
          ))}
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 14 }}>Cash Drawer Reconciliation</p>
          {[['Opening Float','$200.00'],['Cash Sales','$340.00'],['Payouts','−$0.00'],['Expected','$540.00'],['Actual (counted)','$538.50'],['Variance','−$1.50']].map(([label,val],i) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, marginBottom: 8, borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, color: C.faint }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: i === 5 ? '#C08B1E' : C.white }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main POS Register ─────────────────────────────────────────────────────────
export function POSRegister() {
  const navigate = useNavigate();
  usePageTitle('POS Register');
  const [activeTab, setActiveTab] = useState<ActiveTab>('sale');

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', background: C.bg,
      fontFamily: "'Poppins', sans-serif",
    }}>
      <POSTopBar activeTab={activeTab} setActiveTab={setActiveTab} navigate={navigate} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {activeTab === 'sale'     && <SaleTab />}
        {activeTab === 'orders'   && <OrdersTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'summary'  && <SummaryTab />}
      </div>
    </div>
  );
}