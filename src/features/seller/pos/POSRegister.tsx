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
    <div className="shrink-0 flex items-center gap-4 px-5 h-[52px] bg-pos-surface border-b border-carbon">
      {/* Logo */}
      <div className="flex items-center gap-[10px] shrink-0">
        <SolvexoIcon size={26} />
        <span className="text-[13px] font-bold text-white">POS Register</span>
        <div className="bg-carbon rounded-[6px] px-2 py-[2px]">
          <span className="text-[10px] text-brand-orange">● Live</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-[2px] bg-carbon rounded-lg p-[3px]">
        {(['sale', 'orders', 'products', 'summary'] as const).map(tab => {
          const icons: Record<ActiveTab, LucideIcon> = { sale: ShoppingCart, orders: ClipboardList, products: Package, summary: BarChart2 };
          const Icon = icons[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-[14px] py-[6px] rounded-[6px] text-[12px] font-medium cursor-pointer border-none flex items-center gap-[5px] capitalize transition-[background] duration-150"
              style={{
                background: activeTab === tab ? C.orange : 'transparent',
                color: activeTab === tab ? C.white : C.faint,
              }}
            >
              <Icon size={12} />
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      {/* Shift info */}
      <div className="text-right mr-2">
        <p className="text-[11px] text-carbon">Shift: 9:00 AM · Open</p>
        <p className="text-[11px] font-medium text-brand-orange">Alex Chen · Register 1</p>
      </div>
      <Avatar name="Alex Chen" size={30} variant="pos" />
      <button
        onClick={() => navigate('/seller/dashboard')}
        className="px-3 py-[6px] rounded-lg text-[11px] cursor-pointer border border-carbon bg-transparent text-white/45"
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
    <div className="flex flex-1 overflow-hidden">

      {/* ── Left: Product Grid ── */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-carbon">

        {/* Search bar */}
        <div className="flex gap-2 items-center px-4 py-[10px] bg-pos-surface border-b border-carbon shrink-0">
          <div className="flex-1 flex items-center bg-carbon rounded-lg overflow-hidden">
            <Search size={13} className="ml-3 shrink-0" style={{ color: C.faint }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products or scan barcode (SKU)..."
              className="flex-1 px-3 py-2 text-[13px] bg-transparent border-none outline-none text-white"
            />
          </div>
          <button className="px-[14px] py-[7px] bg-carbon border-none rounded-lg text-[12px] cursor-pointer flex items-center gap-[6px] shrink-0" style={{ color: C.faint }}>
            <Camera size={12} /> Scan
          </button>
          <button className="px-[14px] py-[7px] bg-carbon border-none rounded-lg text-[12px] cursor-pointer shrink-0" style={{ color: C.faint }}>
            + Custom Item
          </button>
        </div>

        {/* Category pills */}
        <div className="flex gap-[6px] px-4 py-2 bg-pos-surface border-b border-carbon shrink-0 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="shrink-0 px-[14px] py-[5px] rounded-[20px] text-[11px] font-medium cursor-pointer border-none"
              style={{
                background: activeCategory === cat ? C.orange : C.border,
                color: activeCategory === cat ? C.white : C.faint,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product cards grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
            {filtered.map(p => {
              const inCart = cart.find(i => i.name === p.name);
              return (
                <button
                  key={p.name}
                  onClick={() => addItem(p)}
                  className="relative flex flex-col items-center px-[14px] pt-5 pb-4 rounded-xl text-center transition-[border-color] duration-150"
                  style={{
                    background: C.surface,
                    border: `1px solid ${inCart ? C.orange : C.border}`,
                    cursor: p.stock === 0 ? 'not-allowed' : 'pointer',
                    opacity: p.stock === 0 ? 0.45 : 1,
                    minHeight: 0,
                  }}
                >
                  {/* Qty badge */}
                  {inCart && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-orange text-white text-[10px] font-bold flex items-center justify-center">
                      {inCart.qty}
                    </div>
                  )}

                  {/* Icon */}
                  <div className="w-12 h-12 mb-[10px] flex items-center justify-center shrink-0">
                    <p.icon size={30} style={{ color: C.orange, opacity: p.stock === 0 ? 0.3 : 1 }} />
                  </div>

                  {/* Name */}
                  <span className="block text-[12px] font-semibold text-white leading-[1.35] mb-1 break-words">
                    {p.name}
                  </span>

                  {/* SKU */}
                  <span className="block text-[10px] mb-2" style={{ color: C.muted }}>
                    {p.sku}
                  </span>

                  {/* Price */}
                  <span className="block text-[15px] font-bold" style={{ color: p.stock === 0 ? C.muted : C.orange }}>
                    ${p.price.toFixed(2)}
                  </span>

                  {/* Stock warning */}
                  {p.stock > 0 && p.stock <= 8 && (
                    <span className="block text-[10px] mt-1 text-[#C08B1E]">
                      Low: {p.stock} left
                    </span>
                  )}
                  {p.stock === 0 && (
                    <span className="block text-[10px] mt-1 text-[#C13030]">
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
          <div className="flex items-center gap-2 px-4 py-2 bg-pos-surface border-t border-carbon shrink-0">
            <span className="text-[11px] shrink-0" style={{ color: C.muted }}>On Hold:</span>
            {HELD_SALES.map(h => (
              <button
                key={h.id}
                className="flex items-center gap-2 px-3 py-[5px] bg-carbon border-none rounded-lg cursor-pointer"
              >
                <span className="text-[11px] font-medium text-white">{h.customer}</span>
                <span className="text-[11px] text-brand-orange">${h.total.toFixed(2)}</span>
                <span className="text-[10px]" style={{ color: C.muted }}>{h.time}</span>
              </button>
            ))}
            <button className="ml-auto px-3 py-[5px] bg-transparent border border-carbon rounded-lg cursor-pointer text-[11px]" style={{ color: C.faint }}>
              Hold Current Sale
            </button>
          </div>
        )}
      </div>

      {/* ── Right: Cart Panel ── */}
      <div className="w-[300px] shrink-0 flex flex-col relative bg-pos-surface">
        {/* Cart header */}
        <div className="flex items-center justify-between px-[18px] py-3 border-b border-carbon shrink-0">
          <div>
            <p className="text-[14px] font-semibold text-white">Current Sale</p>
            {cart.length > 0 && (
              <p className="text-[11px] text-[#8C8A82] mt-[1px]">
                {cart.reduce((s, i) => s + i.qty, 0)} items · ${subtotal.toFixed(2)} subtotal
              </p>
            )}
          </div>
          <div className="flex gap-[6px]">
            <button
              onClick={() => setPosView(posView === 'customer' ? 'charge' : 'customer')}
              className="px-[10px] py-[5px] border-none rounded-lg text-[11px] cursor-pointer flex items-center gap-1"
              style={{
                background: posView === 'customer' ? '#B95A3A' : C.border,
                color: customer ? C.orange : C.faint,
              }}
            >
              <User size={11} />{customer ? customer.name.split(' ')[0] : 'Customer'}
            </button>
            <button
              onClick={() => setPosView(posView === 'discount' ? 'charge' : 'discount')}
              className="px-[10px] py-[5px] border-none rounded-lg text-[11px] cursor-pointer flex items-center gap-1"
              style={{
                background: posView === 'discount' ? '#B95A3A' : C.border,
                color: appliedDiscount ? C.orange : C.faint,
              }}
            >
              <Tag size={11} />{appliedDiscount ? appliedDiscount.label : 'Discount'}
            </button>
          </div>
        </div>

        {/* Customer panel */}
        {posView === 'customer' && (
          <div className="px-[18px] py-[14px] border-b border-carbon bg-[#141312] shrink-0">
            <p className="text-[12px] font-semibold text-white mb-[10px]">Attach Customer</p>
            <input
              placeholder="Search by name or email..."
              className="w-full bg-carbon border-none rounded-lg px-3 py-[7px] text-[12px] text-white outline-none mb-[10px] box-border"
            />
            {POS_CUSTOMERS.map(c => (
              <button
                key={c.email}
                onClick={() => { setCustomer(c); setPosView('charge'); }}
                className="w-full flex items-center gap-[10px] px-[10px] py-[7px] rounded-lg mb-1 border-none cursor-pointer text-left"
                style={{ background: customer?.email === c.email ? C.border : 'transparent' }}
              >
                <Avatar name={c.name} size={28} variant="pos" />
                <div className="flex-1">
                  <p className="text-[12px] font-medium text-white">{c.name}</p>
                  <p className="text-[10px]" style={{ color: C.muted }}>{c.email}</p>
                </div>
                <span className="bg-brand-pale-orange text-brand-deep-orange text-[10px] font-semibold px-[7px] py-[2px] rounded-[20px] flex items-center gap-[3px]">
                  <Star size={9} style={{ fill: '#B95A3A' }} />{c.points} pts
                </span>
              </button>
            ))}
            <button onClick={() => { setCustomer(null); setPosView('charge'); }} className="w-full text-center px-0 py-[6px] text-[11px] bg-none border-none cursor-pointer" style={{ color: C.muted }}>
              × Clear customer
            </button>
          </div>
        )}

        {/* Discount panel */}
        {posView === 'discount' && (
          <div className="px-[18px] py-[14px] border-b border-carbon bg-[#141312] shrink-0">
            <p className="text-[12px] font-semibold text-white mb-3">Apply Discount</p>
            <div className="flex gap-[6px] mb-[10px]">
              {(['pct', 'fixed', 'coupon'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setDiscountType(t)}
                  className="flex-1 py-[6px] text-center rounded-lg text-[11px] font-medium cursor-pointer"
                  style={{
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
                className="w-full bg-carbon border-none rounded-lg px-3 py-[7px] text-[12px] text-white outline-none mb-2 box-border"
              />
            ) : (
              <input
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                placeholder="Enter coupon code (try: SAVE10)"
                className="w-full bg-carbon border-none rounded-lg px-3 py-[7px] text-[12px] text-white outline-none mb-2 box-border"
              />
            )}
            <div className="flex gap-2">
              <button onClick={applyDiscount} className="flex-1 bg-brand-orange border-none rounded-lg py-2 text-[12px] font-semibold text-white cursor-pointer">Apply</button>
              {appliedDiscount && (
                <button onClick={() => { setAppliedDiscount(null); setPosView('charge'); }} className="px-3 py-2 bg-carbon border-none rounded-lg text-[12px] text-[#C13030] cursor-pointer">Remove</button>
              )}
            </div>
          </div>
        )}

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-[18px] py-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full pt-10">
              <ShoppingCart size={48} className="mb-3" style={{ color: C.border }} />
              <p className="text-[13px] text-[#3A3836] text-center leading-[1.5]">
                Tap a product to add it<br />to the cart
              </p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.name} className="py-[10px] border-b border-carbon">
                <div className="flex items-start gap-[10px]">
                  <item.icon size={18} className="mt-[2px] shrink-0 text-brand-orange" />
                  <div className="flex-1">
                    <p className="text-[12px] font-medium text-white">{item.name}</p>
                    <p className="text-[10px]" style={{ color: C.muted }}>{item.sku}</p>
                  </div>
                  <button onClick={() => removeItem(item.name)} className="text-[16px] bg-none border-none cursor-pointer leading-none -mt-[2px]" style={{ color: '#3A3836' }}>×</button>
                </div>
                <div className="flex items-center justify-between mt-2 pl-7">
                  <div className="flex items-center gap-[6px]">
                    <button onClick={() => updateQty(item.name, -1)} className="w-[22px] h-[22px] rounded-[6px] bg-carbon border-none text-white cursor-pointer flex items-center justify-center text-[14px]">−</button>
                    <span className="text-[13px] font-semibold text-white w-5 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.name, 1)} className="w-[22px] h-[22px] rounded-[6px] bg-carbon border-none text-white cursor-pointer flex items-center justify-center text-[14px]">+</button>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px]" style={{ color: C.muted }}>$</span>
                    <input
                      value={item.customPrice ?? item.price}
                      onChange={e => setCustomPrice(item.name, e.target.value)}
                      className="w-[52px] text-right rounded-[6px] px-[6px] py-[2px] text-[12px] outline-none"
                      style={{
                        background: C.border,
                        border: `1px solid ${item.customPrice ? C.orange : C.border}`,
                        color: item.customPrice ? C.orange : C.white,
                      }}
                    />
                  </div>
                  <span className="text-[13px] font-bold text-brand-orange">
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
              className="w-full mt-[10px] bg-[#141312] border border-carbon rounded-lg px-[10px] py-[6px] text-[11px] outline-none box-border"
              style={{ color: C.faint }}
            />
          )}
        </div>

        {/* Cart footer */}
        <div className="px-[18px] py-[14px] border-t border-carbon bg-[#141312] shrink-0">
          {cart.length > 0 && (
            <>
              {/* Totals */}
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-[12px]" style={{ color: C.faint }}>Subtotal</span>
                  <span className="text-[12px] text-white">${subtotal.toFixed(2)}</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between mb-1">
                    <span className="text-[12px] text-[#2D8A4E] flex items-center gap-1">
                      <Tag size={10} />{appliedDiscount.label}
                    </span>
                    <span className="text-[12px] text-[#2D8A4E]">−${discountAmt.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between mb-2">
                  <span className="text-[12px]" style={{ color: C.faint }}>Tax (8%)</span>
                  <span className="text-[12px] text-white">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-carbon">
                  <span className="text-[16px] font-bold text-white">Total</span>
                  <span className="text-[20px] font-bold text-brand-orange">${total.toFixed(2)}</span>
                </div>
                {customer && (
                  <div className="mt-[6px] bg-pos-surface rounded-lg px-[10px] py-[6px] flex justify-between">
                    <span className="text-[11px] flex items-center gap-1" style={{ color: C.faint }}><User size={10} />{customer.name}</span>
                    <span className="text-[11px] text-brand-orange">+{Math.floor(total)} pts</span>
                  </div>
                )}
              </div>

              {/* Payment methods */}
              <div className="grid grid-cols-4 gap-[6px] mb-[10px]">
                {([['card', CreditCard, 'Card'],['cash', Banknote, 'Cash'],['tap', Smartphone, 'Tap'],['split', Zap, 'Split']] as [PaymentMethod, LucideIcon, string][]).map(([id, IconComp, label]) => (
                  <button
                    key={id}
                    onClick={() => setPaymentMethod(id)}
                    className="px-1 py-2 rounded-lg cursor-pointer flex flex-col items-center gap-[3px]"
                    style={{
                      border: `1px solid ${paymentMethod === id ? C.orange : 'transparent'}`,
                      background: paymentMethod === id ? '#B95A3A' : C.border,
                    }}
                  >
                    <IconComp size={14} style={{ color: paymentMethod === id ? C.white : C.faint }} />
                    <span className="text-[10px] font-medium" style={{ color: paymentMethod === id ? C.white : C.faint }}>{label}</span>
                  </button>
                ))}
              </div>

              {/* Cash tendered */}
              {paymentMethod === 'cash' && (
                <div className="bg-pos-surface rounded-lg p-3 mb-[10px]">
                  <p className="text-[11px] mb-[6px]" style={{ color: C.faint }}>Cash tendered</p>
                  <div className="flex gap-[6px] mb-[6px]">
                    <input
                      value={cashGiven}
                      onChange={e => setCashGiven(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 bg-carbon border-none rounded-lg px-[10px] py-[6px] text-[13px] text-white outline-none"
                    />
                    {[20, 50, 100].map(amt => (
                      <button key={amt} onClick={() => setCashGiven(amt.toString())} className="px-[10px] py-[6px] bg-carbon border-none rounded-lg text-[11px] text-white cursor-pointer">${amt}</button>
                    ))}
                  </div>
                  {cashGiven && parseFloat(cashGiven) >= total && (
                    <div className="flex justify-between">
                      <span className="text-[12px]" style={{ color: C.faint }}>Change due</span>
                      <span className="text-[14px] font-bold text-[#2D8A4E]">${cashChange.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Charge button */}
          <button
            onClick={() => cart.length > 0 && setPosView('receipt')}
            className="w-full rounded-[10px] py-[13px] text-center text-[15px] font-bold text-white border-none flex items-center justify-center gap-[6px]"
            style={{
              cursor: cart.length === 0 ? 'default' : 'pointer',
              background: cart.length === 0 ? C.border : C.orange,
              opacity: cart.length === 0 ? 0.4 : 1,
            }}
          >
            {cart.length === 0 ? 'Charge $0.00' : <>Charge ${total.toFixed(2)}</>}
          </button>

          {/* Clear / Hold / Print */}
          {cart.length > 0 && (
            <div className="flex gap-2 mt-2">
              {[['× Clear', null, resetSale], ['Hold', Pause, () => {}], ['Print', Printer, () => {}]].map(([label, Icon, handler]: any) => (
                <button
                  key={label as string}
                  onClick={handler}
                  className="flex-1 py-[7px] bg-pos-surface border border-carbon rounded-lg cursor-pointer flex items-center justify-center gap-1"
                >
                  {Icon && <Icon size={11} style={{ color: C.muted }} />}
                  <span className="text-[11px]" style={{ color: C.muted }}>{label as string}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Receipt overlay */}
        {posView === 'receipt' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85 z-20">
            <div className="bg-pos-surface border border-carbon rounded-2xl p-6 w-[320px]">
              <div className="text-center mb-5">
                <CheckCircle size={48} className="text-[#2D8A4E] mx-auto mb-2" />
                <p className="text-[18px] font-bold text-white">Payment Complete</p>
                <p className="text-[28px] font-bold text-brand-orange my-2">${total.toFixed(2)}</p>
                <p className="text-[12px]" style={{ color: C.faint }}>{new Date().toLocaleTimeString()} · {paymentMethod}</p>
              </div>
              {paymentMethod === 'cash' && cashChange > 0 && (
                <div className="bg-[#2D8A4E20] border border-[#2D8A4E] rounded-[10px] p-3 mb-4 text-center">
                  <p className="text-[12px] mb-1" style={{ color: C.faint }}>Change due</p>
                  <p className="text-[22px] font-bold text-[#2D8A4E]">${cashChange.toFixed(2)}</p>
                </div>
              )}
              <div className="mb-4">
                {cart.map(item => (
                  <div key={item.name} className="flex justify-between py-1 border-b border-carbon">
                    <span className="text-[11px] text-[#8C8A82]">{item.qty}× {item.name}</span>
                    <span className="text-[11px] text-white">${((item.customPrice ?? item.price) * item.qty).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-[6px]">
                  <span className="text-[12px]" style={{ color: C.faint }}>Total paid</span>
                  <span className="text-[12px] font-semibold text-white">${total.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {[[Mail, 'Email Receipt'],[Printer, 'Print Receipt']].map(([Icon, label]: any) => (
                  <button key={label} className="bg-carbon border-none rounded-lg py-[10px] text-[12px] text-white cursor-pointer flex items-center justify-center gap-[6px]">
                    <Icon size={13} />{label}
                  </button>
                ))}
                <button onClick={resetSale} className="bg-brand-orange border-none rounded-lg py-3 text-[13px] font-bold text-white cursor-pointer flex items-center justify-center gap-[6px]">
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
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex gap-[14px] mb-5">
        {[["Today's Sales","$842.50","14 transactions"],["Avg Ticket","$60.18","↑ vs yesterday"],["Top Item","Ceramic Mug","8 sold today"],["Cash in Drawer","$340.00","Expected"]].map(([label,value,sub]) => (
          <div key={label} className="flex-1 bg-pos-surface border border-carbon rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: C.muted }}>{label}</p>
            <p className="text-[20px] font-bold text-white">{value}</p>
            <p className="text-[11px] mt-[2px]" style={{ color: C.muted }}>{sub}</p>
          </div>
        ))}
      </div>
      <div className="bg-pos-surface border border-carbon rounded-xl overflow-hidden">
        <div className="flex items-center gap-[10px] px-4 py-[14px] border-b border-carbon">
          <p className="text-[14px] font-semibold text-white flex-1">Recent Transactions</p>
          <input placeholder="Search..." className="bg-carbon border-none rounded-lg px-3 py-[6px] text-[12px] text-white outline-none" />
          <button className="bg-carbon border-none rounded-lg px-3 py-[6px] text-[11px] cursor-pointer" style={{ color: C.faint }}>Export</button>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>{['Order','Customer','Items','Total','Method','Time','Actions'].map(h => (
              <th key={h} className="text-left px-4 py-[10px] text-[10px] font-semibold uppercase tracking-[0.07em] bg-[#141312] border-b border-carbon" style={{ color: C.muted }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {RECENT_SALES.map(s => (
              <tr key={s.id} className="border-b border-pos-surface">
                <td className="px-4 py-3"><span className="text-[12px] font-bold text-brand-orange">{s.id}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={s.customer === 'Walk-in' ? 'WI' : s.customer} size={24} variant="pos" />
                    <span className="text-[12px] text-white">{s.customer}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><span className="text-[12px]" style={{ color: C.faint }}>{s.items}</span></td>
                <td className="px-4 py-3"><span className="text-[13px] font-semibold text-white">${s.total.toFixed(2)}</span></td>
                <td className="px-4 py-3"><Badge color={s.method === 'Card' ? 'blue' : s.method === 'Cash' ? 'green' : 'orange'}>{s.method}</Badge></td>
                <td className="px-4 py-3"><span className="text-[11px]" style={{ color: C.muted }}>{s.time}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-[6px]">
                    {['Receipt','Refund'].map((a, i) => (
                      <button key={a} className="px-[10px] py-1 bg-carbon border-none rounded-[6px] text-[11px] cursor-pointer" style={{ color: i === 1 ? '#C13030' : C.faint }}>{a}</button>
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
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center gap-[10px] mb-5">
        <p className="text-[16px] font-bold text-white flex-1">Product Catalog</p>
        <input placeholder="Search SKU or name..." className="bg-pos-surface border border-carbon rounded-lg px-[14px] py-2 text-[13px] text-white outline-none" />
        <button className="px-4 py-2 bg-brand-orange border-none rounded-lg text-[12px] font-semibold text-white cursor-pointer">+ Add Product</button>
      </div>
      <div className="bg-pos-surface border border-carbon rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>{['SKU','Product','Category','Price','Stock','Status','Actions'].map(h => (
              <th key={h} className="text-left px-4 py-[10px] text-[10px] font-semibold uppercase tracking-[0.07em] bg-[#141312] border-b border-carbon" style={{ color: C.muted }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {POS_PRODUCTS.map(p => (
              <tr key={p.sku} className="border-b border-carbon">
                <td className="px-4 py-[10px]"><span className="text-[11px] font-mono" style={{ color: C.muted }}>{p.sku}</span></td>
                <td className="px-4 py-[10px]">
                  <div className="flex items-center gap-2">
                    <p.icon size={18} className="text-brand-orange shrink-0" />
                    <span className="text-[12px] font-medium text-white">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-[10px]"><Badge color="gray">{p.category}</Badge></td>
                <td className="px-4 py-[10px]"><span className="text-[13px] font-semibold text-brand-orange">${p.price.toFixed(2)}</span></td>
                <td className="px-4 py-[10px]"><span className="text-[12px]" style={{ color: p.stock === 0 ? '#C13030' : p.stock <= 8 ? '#C08B1E' : C.faint }}>{p.stock === 0 ? 'Out of stock' : `${p.stock} units`}</span></td>
                <td className="px-4 py-[10px]"><Badge color={p.stock === 0 ? 'red' : p.stock <= 8 ? 'yellow' : 'green'}>{p.stock === 0 ? 'Out of Stock' : p.stock <= 8 ? 'Low Stock' : 'In Stock'}</Badge></td>
                <td className="px-4 py-[10px]">
                  <div className="flex gap-[6px]">
                    <button className="px-[10px] py-1 bg-carbon border-none rounded-[6px] text-[11px] cursor-pointer" style={{ color: C.faint }}>Edit</button>
                    {p.stock <= 8 && <button className="px-[10px] py-1 bg-carbon border-none rounded-[6px] text-[11px] text-brand-orange cursor-pointer">Restock</button>}
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
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center gap-[10px] mb-6">
        <p className="text-[18px] font-bold text-white flex-1">Shift Summary</p>
        <p className="text-[12px]" style={{ color: C.muted }}>Opened 9:00 AM · May 22, 2026</p>
        <button className="px-4 py-2 bg-[#C1303020] border border-[#C13030] rounded-lg text-[12px] font-semibold text-[#C13030] cursor-pointer">Close Shift</button>
      </div>
      <div className="grid grid-cols-3 gap-[14px] mb-6">
        {[["Total Sales","$842.50","14 transactions"],["Cash Sales","$340.00","5 transactions"],["Card Sales","$502.50","9 transactions"],["Avg Transaction","$60.18","+$4.20 vs yesterday"],["Items Sold","38 units","Across 16 products"],["Refunds","$0.00","0 refunds today"]].map(([label,value,sub]) => (
          <div key={label} className="bg-pos-surface border border-carbon rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: C.muted }}>{label}</p>
            <p className="text-[22px] font-bold text-white">{value}</p>
            <p className="text-[11px] mt-[2px]" style={{ color: C.muted }}>{sub}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-pos-surface border border-carbon rounded-xl p-4">
          <p className="text-[13px] font-semibold text-white mb-[14px]">Top Sellers Today</p>
          {[['Ceramic Mug',8,'$224.00'],['Scented Candle',6,'$144.00'],['Bamboo Pen Set',5,'$110.00'],['Linen Tote',4,'$168.00']].map(([name,qty,revenue]) => (
            <div key={name as string} className="flex items-center gap-[10px] mb-[10px]">
              <span className="text-[12px] text-white flex-1">{name as string}</span>
              <span className="text-[11px]" style={{ color: C.muted }}>{qty} sold</span>
              <span className="text-[12px] font-semibold text-brand-orange">{revenue}</span>
            </div>
          ))}
        </div>
        <div className="bg-pos-surface border border-carbon rounded-xl p-4">
          <p className="text-[13px] font-semibold text-white mb-[14px]">Cash Drawer Reconciliation</p>
          {[['Opening Float','$200.00'],['Cash Sales','$340.00'],['Payouts','−$0.00'],['Expected','$540.00'],['Actual (counted)','$538.50'],['Variance','−$1.50']].map(([label,val],i) => (
            <div key={label} className="flex justify-between pb-2 mb-2 border-b border-carbon">
              <span className="text-[12px]" style={{ color: C.faint }}>{label}</span>
              <span className="text-[12px] font-medium" style={{ color: i === 5 ? '#C08B1E' : C.white }}>{val}</span>
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
    <div className="flex flex-col h-screen bg-pos-bg">
      <POSTopBar activeTab={activeTab} setActiveTab={setActiveTab} navigate={navigate} />
      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'sale'     && <SaleTab />}
        {activeTab === 'orders'   && <OrdersTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'summary'  && <SummaryTab />}
      </div>
    </div>
  );
}
