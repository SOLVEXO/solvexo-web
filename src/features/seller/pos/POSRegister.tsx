import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { SolvexoIcon } from '@/components/ui/SolvexoLogo';
import { ArrowRight, ShoppingCart, ClipboardList, Package, BarChart2, Coffee, ShoppingBag, Image, Flame, Circle, Droplets, Pencil, Camera, Ribbon, BookOpen, FlaskConical, Key, UtensilsCrossed, Wind, CreditCard, Banknote, Smartphone, Zap, CheckCircle, User, Tag, Printer, Mail, Star, Pause } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PaymentMethod, DiscountType, AppliedDiscount } from '@/types';

// ── Data ─────────────────────────────────────────────────────────────────────
const POS_PRODUCTS: { name: string; price: number; Icon: LucideIcon; sku: string; category: string; stock: number }[] = [
  { name: 'Ceramic Mug',       price: 28, Icon: Coffee,          sku: 'MUG-001', category: 'Ceramics',     stock: 34 },
  { name: 'Linen Tote',        price: 42, Icon: ShoppingBag,     sku: 'TOT-002', category: 'Accessories',  stock: 18 },
  { name: 'Wall Print A3',     price: 18, Icon: Image,           sku: 'PRT-003', category: 'Prints',       stock: 52 },
  { name: 'Scented Candle',    price: 24, Icon: Flame,           sku: 'CND-004', category: 'Candles',      stock: 0  },
  { name: 'Cork Coasters 4pk', price: 16, Icon: Circle,          sku: 'CST-005', category: 'Accessories',  stock: 29 },
  { name: 'Hand Lotion 100ml', price: 14, Icon: Droplets,        sku: 'LOT-006', category: 'Accessories',  stock: 45 },
  { name: 'Bamboo Pen Set',    price: 22, Icon: Pencil,          sku: 'PEN-007', category: 'Accessories',  stock: 12 },
  { name: 'Photo Book S',      price: 36, Icon: Camera,          sku: 'PHO-008', category: 'Prints',       stock: 8  },
  { name: 'Silk Scrunchie 3pk',price: 12, Icon: Ribbon,          sku: 'SCR-009', category: 'Accessories',  stock: 67 },
  { name: 'Travel Journal',    price: 20, Icon: BookOpen,        sku: 'JRN-010', category: 'Stationery',   stock: 23 },
  { name: 'Essential Oil 30ml',price: 19, Icon: FlaskConical,    sku: 'OIL-011', category: 'Candles',      stock: 31 },
  { name: 'Macrame Keyring',   price: 10, Icon: Key,             sku: 'KEY-012', category: 'Accessories',  stock: 44 },
  { name: 'Ceramic Bowl Set',  price: 55, Icon: UtensilsCrossed, sku: 'BWL-013', category: 'Ceramics',     stock: 7  },
  { name: 'Beeswax Candle',    price: 18, Icon: Wind,            sku: 'BCN-014', category: 'Candles',      stock: 19 },
  { name: 'Washi Tape Set',    price: 9,  Icon: Ribbon,          sku: 'WSH-015', category: 'Stationery',   stock: 88 },
  { name: 'Linen Napkins 4pk', price: 32, Icon: UtensilsCrossed, sku: 'NAP-016', category: 'Accessories',  stock: 14 },
];

const HELD_SALES = [
  { id: 'H-001', customer: 'Walk-in', items: 3, total: 74.00, time: '2:14 PM' },
  { id: 'H-002', customer: 'Sarah M.', items: 1, total: 42.00, time: '2:31 PM' },
];

const RECENT_SALES = [
  { id: 'POS-8841', customer: 'David R.', items: 2, total: 52.00, method: 'Card', time: '3:05 PM' },
  { id: 'POS-8840', customer: 'Walk-in',  items: 4, total: 86.00, method: 'Cash', time: '2:48 PM' },
  { id: 'POS-8839', customer: 'Lena K.',  items: 1, total: 24.00, method: 'Tap',  time: '2:31 PM' },
  { id: 'POS-8838', customer: 'Walk-in',  items: 3, total: 61.50, method: 'Card', time: '1:59 PM' },
  { id: 'POS-8837', customer: 'Tom B.',   items: 6, total: 118.00,method: 'Cash', time: '1:22 PM' },
];

const POS_CUSTOMERS = [
  { name: 'Sarah Mitchell', email: 'sarah@email.com', points: 420, segment: 'VIP'   },
  { name: 'David Reynolds', email: 'david@email.com', points: 180, segment: 'Loyal' },
  { name: 'Lena Kowalski',  email: 'lena@email.com',  points: 60,  segment: 'New'   },
];

type CartItem = { name: string; price: number; Icon: LucideIcon; sku: string; qty: number; customPrice: number | null };
type PosView = 'charge' | 'customer' | 'discount' | 'receipt';
type ActiveTab = 'sale' | 'orders' | 'products' | 'summary';

// ── POS Top Bar ───────────────────────────────────────────────────────────────
function POSTopBar({ activeTab, setActiveTab, navigate }: { activeTab: ActiveTab; setActiveTab: (t: ActiveTab) => void; navigate: ReturnType<typeof useNavigate> }) {
  return (
    <div className="flex-shrink-0 flex items-center gap-4 px-5 h-[52px] border-b" style={{ background: '#1A1918', borderColor: '#2C2A28' }}>
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <SolvexoIcon size={26} />
        <span className="text-[13px] font-bold text-white">POS Register</span>
        <div className="rounded-md px-2 py-0.5" style={{ background: '#2C2A28' }}>
          <span className="text-[10px] text-[#D97757]">● Live</span>
        </div>
      </div>
      <div className="flex gap-0.5 rounded-lg p-0.5" style={{ background: '#2C2A28' }}>
        {(['sale', 'orders', 'products', 'summary'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-3.5 py-1.5 rounded-md text-[12px] font-medium capitalize cursor-pointer transition-all"
            style={{ background: activeTab === tab ? '#D97757' : 'transparent', color: activeTab === tab ? '#fff' : '#6A6866' }}
          >
            {tab === 'sale' ? <><ShoppingCart size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Sale</> : tab === 'orders' ? <><ClipboardList size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Orders</> : tab === 'products' ? <><Package size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Products</> : <><BarChart2 size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Summary</>}
          </button>
        ))}
      </div>
      <div className="flex-1" />
      <div className="text-right mr-2">
        <p className="text-[11px]" style={{ color: '#5C5A58' }}>Shift: 9:00 AM • Open</p>
        <p className="text-[11px] font-medium" style={{ color: '#D97757' }}>Alex Chen · Register 1</p>
      </div>
      <Avatar name="Alex Chen" size={30} variant="pos" />
      <button
        onClick={() => navigate('/seller/dashboard')}
        className="px-3 py-1.5 rounded-lg text-[11px] cursor-pointer border transition-colors hover:opacity-80"
        style={{ color: 'rgba(255,255,255,0.5)', borderColor: '#2C2A28', background: 'transparent' }}
      >
        ← Dashboard
      </button>
    </div>
  );
}

// ── Sale Tab ──────────────────────────────────────────────────────────────────
function SaleTab() {
  const [cart, setCart]                     = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery]       = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [paymentMethod, setPaymentMethod]   = useState<PaymentMethod>('card');
  const [posView, setPosView]               = useState<PosView>('charge');
  const [discountType, setDiscountType]     = useState<DiscountType>('pct');
  const [discountVal, setDiscountVal]       = useState('');
  const [couponCode, setCouponCode]         = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [customer, setCustomer]             = useState<(typeof POS_CUSTOMERS)[0] | null>(null);
  const [cashGiven, setCashGiven]           = useState('');
  const [note, setNote]                     = useState('');

  const categories = useMemo(() => ['All', ...new Set(POS_PRODUCTS.map(p => p.category))], []);
  const filtered = useMemo(() => POS_PRODUCTS.filter(p =>
    (activeCategory === 'All' || p.category === activeCategory) &&
    (!searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  ), [activeCategory, searchQuery]);

  const addItem = (p: (typeof POS_PRODUCTS)[0]) => {
    if (p.stock === 0) return;
    setCart(prev => { const ex = prev.find(i => i.name === p.name); if (ex) return prev.map(i => i.name === p.name ? { ...i, qty: i.qty + 1 } : i); return [...prev, { ...p, qty: 1, customPrice: null }]; });
  };
  const removeItem = (name: string) => setCart(prev => prev.filter(i => i.name !== name));
  const updateQty = (name: string, delta: number) => setCart(prev => prev.map(i => i.name === name ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  const setCustomPrice = (name: string, price: string) => setCart(prev => prev.map(i => i.name === name ? { ...i, customPrice: parseFloat(price) || null } : i));

  const subtotal = cart.reduce((s, i) => s + (i.customPrice ?? i.price) * i.qty, 0);
  const discountAmt = appliedDiscount ? (appliedDiscount.type === 'pct' ? subtotal * (appliedDiscount.value / 100) : Math.min(appliedDiscount.value, subtotal)) : 0;
  const afterDiscount = subtotal - discountAmt;
  const tax = afterDiscount * 0.08;
  const total = afterDiscount + tax;
  const cashChange = cashGiven ? Math.max(0, parseFloat(cashGiven) - total) : 0;

  const applyDiscount = () => {
    if (discountType === 'coupon' && couponCode === 'SAVE10') { setAppliedDiscount({ type: 'pct', value: 10, label: 'Coupon SAVE10' }); setPosView('charge'); return; }
    if (discountType !== 'coupon' && discountVal) { setAppliedDiscount({ type: discountType, value: parseFloat(discountVal), label: discountType === 'pct' ? `${discountVal}% off` : `$${discountVal} off` }); setPosView('charge'); }
  };

  const resetSale = () => { setCart([]); setAppliedDiscount(null); setCustomer(null); setCashGiven(''); setNote(''); setPosView('charge'); };

  const C = { orange: '#D97757', white: '#FFFFFF', muted: '#5C5A58', faint: '#6A6866', border: '#2C2A28', surface: '#1A1918', bg: '#0F0E0D' };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col overflow-hidden border-r" style={{ borderColor: C.border }}>
        {/* Search */}
        <div className="flex gap-2.5 items-center px-4 py-2.5 border-b flex-shrink-0" style={{ background: C.surface, borderColor: C.border }}>
          <input
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products or scan barcode (SKU)..."
            className="flex-1 rounded-lg px-3.5 py-2 text-[13px] text-white outline-none border"
            style={{ fontFamily: "'Poppins',sans-serif", background: C.border, borderColor: C.border, color: C.white }}
          />
          <button className="px-3 py-2 rounded-lg text-[12px] cursor-pointer flex items-center gap-1.5" style={{ background: C.border, color: C.faint }}><Camera size={12} />Scan</button>
          <button className="px-3 py-2 rounded-lg text-[12px] cursor-pointer" style={{ background: C.border, color: C.faint }}>+ Custom Item</button>
        </div>

        {/* Categories */}
        <div className="flex gap-1.5 px-4 py-2 overflow-x-auto flex-shrink-0 border-b" style={{ background: C.surface, borderColor: C.border }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="flex-shrink-0 px-3.5 py-1 rounded-full text-[11px] font-medium cursor-pointer"
              style={{ background: activeCategory === cat ? C.orange : C.border, color: activeCategory === cat ? C.white : C.faint }}
            >{cat}</button>
          ))}
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
            {filtered.map(p => {
              const inCart = cart.find(i => i.name === p.name);
              return (
                <button key={p.name} onClick={() => addItem(p)}
                  className="relative text-center rounded-[10px] px-2.5 py-3.5 border transition-colors cursor-pointer"
                  style={{ background: C.surface, border: `1px solid ${inCart ? C.orange : C.border}`, opacity: p.stock === 0 ? 0.45 : 1, cursor: p.stock === 0 ? 'not-allowed' : 'pointer' }}
                >
                  {inCart && (
                    <div className="absolute top-1.5 right-1.5 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: C.orange }}>
                      {inCart.qty}
                    </div>
                  )}
                  <span className="flex items-center justify-center mb-1.5" style={{ height: 36 }}><p.Icon size={28} style={{ color: p.stock === 0 ? C.muted : C.orange }} /></span>
                  <span className="block text-[11px] font-medium text-white mb-0.5 leading-tight">{p.name}</span>
                  <span className="block text-[10px] mb-1" style={{ color: C.muted }}>{p.sku}</span>
                  <span className="text-[13px] font-bold" style={{ color: p.stock === 0 ? C.muted : C.orange }}>${p.price.toFixed(2)}</span>
                  {p.stock > 0 && p.stock <= 8 && <span className="block text-[9px]" style={{ color: '#C08B1E' }}>Low: {p.stock} left</span>}
                  {p.stock === 0 && <span className="block text-[9px]" style={{ color: '#C13030' }}>Out of stock</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Held sales */}
        {HELD_SALES.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 border-t" style={{ background: C.surface, borderColor: C.border }}>
            <span className="text-[11px] flex-shrink-0" style={{ color: C.muted }}>On Hold:</span>
            {HELD_SALES.map(h => (
              <button key={h.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer" style={{ background: C.border }}>
                <span className="text-[11px] font-medium text-white">{h.customer}</span>
                <span className="text-[11px]" style={{ color: C.orange }}>${h.total.toFixed(2)}</span>
                <span className="text-[10px]" style={{ color: C.muted }}>{h.time}</span>
              </button>
            ))}
            <button className="ml-auto px-3 py-1.5 rounded-lg border text-[11px] cursor-pointer" style={{ color: C.faint, borderColor: C.border, background: 'transparent' }}>
              Hold Current Sale
            </button>
          </div>
        )}
      </div>

      {/* Cart Panel */}
      <div className="w-[380px] flex-shrink-0 flex flex-col relative" style={{ background: C.surface }}>
        {/* Cart Header */}
        <div className="flex items-center justify-between px-[18px] py-3.5 border-b flex-shrink-0" style={{ borderColor: C.border }}>
          <div>
            <p className="text-[14px] font-semibold text-white">Current Sale</p>
            {cart.length > 0 && <p className="text-[11px]" style={{ color: '#8C8A82' }}>{cart.reduce((s, i) => s + i.qty, 0)} items · ${subtotal.toFixed(2)} subtotal</p>}
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => setPosView(posView === 'customer' ? 'charge' : 'customer')}
              className="px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer flex items-center gap-1"
              style={{ background: posView === 'customer' ? '#B95A3A' : C.border, color: customer ? C.orange : C.faint }}>
              <User size={11} />{customer ? customer.name.split(' ')[0] : 'Customer'}
            </button>
            <button onClick={() => setPosView(posView === 'discount' ? 'charge' : 'discount')}
              className="px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer flex items-center gap-1"
              style={{ background: posView === 'discount' ? '#B95A3A' : C.border, color: appliedDiscount ? C.orange : C.faint }}>
              <Tag size={11} />{appliedDiscount ? appliedDiscount.label : 'Discount'}
            </button>
          </div>
        </div>

        {/* Customer Panel */}
        {posView === 'customer' && (
          <div className="px-[18px] py-3.5 border-b flex-shrink-0" style={{ background: '#141312', borderColor: C.border }}>
            <p className="text-[12px] font-semibold text-white mb-2.5">Attach Customer</p>
            <input placeholder="Search by name or email..." className="w-full rounded-lg px-3 py-2 mb-2.5 text-[12px] text-white outline-none border" style={{ fontFamily: "'Poppins',sans-serif", background: C.border, borderColor: C.border }} />
            {POS_CUSTOMERS.map(c => (
              <button key={c.email} onClick={() => { setCustomer(c); setPosView('charge'); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-1 cursor-pointer text-left"
                style={{ background: customer?.email === c.email ? C.border : 'transparent' }}>
                <Avatar name={c.name} size={28} variant="pos" />
                <div className="flex-1">
                  <p className="text-[12px] font-medium text-white">{c.name}</p>
                  <p className="text-[10px]" style={{ color: C.muted }}>{c.email}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1" style={{ background: '#FBECE4', color: '#B95A3A' }}><Star size={9} style={{ fill: '#B95A3A' }} />{c.points} pts</span>
              </button>
            ))}
            <button onClick={() => { setCustomer(null); setPosView('charge'); }} className="w-full text-center py-1.5 text-[11px] cursor-pointer" style={{ color: C.muted }}>× Clear customer</button>
          </div>
        )}

        {/* Discount Panel */}
        {posView === 'discount' && (
          <div className="px-[18px] py-3.5 border-b flex-shrink-0" style={{ background: '#141312', borderColor: C.border }}>
            <p className="text-[12px] font-semibold text-white mb-3">Apply Discount</p>
            <div className="flex gap-1.5 mb-2.5">
              {(['pct', 'fixed', 'coupon'] as const).map(t => (
                <button key={t} onClick={() => setDiscountType(t)}
                  className="flex-1 py-1.5 text-center rounded-lg text-[11px] font-medium cursor-pointer border"
                  style={{ background: discountType === t ? '#B95A3A' : C.border, border: `1px solid ${discountType === t ? C.orange : 'transparent'}`, color: discountType === t ? C.white : C.faint }}>
                  {t === 'pct' ? '% Off' : t === 'fixed' ? '$ Off' : 'Coupon'}
                </button>
              ))}
            </div>
            {discountType !== 'coupon' ? (
              <input value={discountVal} onChange={e => setDiscountVal(e.target.value)} placeholder={discountType === 'pct' ? 'e.g. 10 (for 10%)' : 'e.g. 5.00'}
                className="w-full rounded-lg px-3 py-2 mb-2 text-[12px] text-white outline-none border" style={{ fontFamily: "'Poppins',sans-serif", background: C.border, borderColor: C.border, boxSizing: 'border-box' }} />
            ) : (
              <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Enter coupon code (try: SAVE10)"
                className="w-full rounded-lg px-3 py-2 mb-2 text-[12px] text-white outline-none border" style={{ fontFamily: "'Poppins',sans-serif", background: C.border, borderColor: C.border, boxSizing: 'border-box' }} />
            )}
            <div className="flex gap-2">
              <button onClick={applyDiscount} className="flex-1 rounded-lg py-2 text-center text-[12px] font-semibold text-white cursor-pointer" style={{ background: C.orange }}>Apply</button>
              {appliedDiscount && <button onClick={() => { setAppliedDiscount(null); setPosView('charge'); }} className="px-3 py-2 rounded-lg text-[12px] cursor-pointer" style={{ background: C.border, color: '#C13030' }}>Remove</button>}
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-[18px] py-2.5">
          {cart.length === 0 ? (
            <div className="text-center py-10">
              <span className="flex items-center justify-center mb-2.5"><ShoppingCart size={36} style={{ color: '#3A3836' }} /></span>
              <p className="text-[13px]" style={{ color: '#3A3836' }}>Tap a product to add it</p>
              <p className="text-[11px] mt-1" style={{ color: C.border }}>or enter a barcode / SKU</p>
            </div>
          ) : cart.map(item => (
            <div key={item.name} className="py-2.5 border-b" style={{ borderColor: C.border }}>
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5"><item.Icon size={20} style={{ color: C.orange }} /></span>
                <div className="flex-1">
                  <p className="text-[12px] font-medium text-white">{item.name}</p>
                  <p className="text-[10px]" style={{ color: C.muted }}>{item.sku}</p>
                </div>
                <button onClick={() => removeItem(item.name)} className="text-[16px] cursor-pointer -mt-0.5" style={{ color: '#3A3836' }}>×</button>
              </div>
              <div className="flex items-center justify-between mt-2 pl-[30px]">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateQty(item.name, -1)} className="w-[22px] h-[22px] rounded-md flex items-center justify-center text-white cursor-pointer" style={{ background: C.border }}>−</button>
                  <span className="text-[13px] font-semibold text-white w-5 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.name, 1)} className="w-[22px] h-[22px] rounded-md flex items-center justify-center text-white cursor-pointer" style={{ background: C.border }}>+</button>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px]" style={{ color: C.muted }}>$</span>
                  <input
                    value={item.customPrice ?? item.price}
                    onChange={e => setCustomPrice(item.name, e.target.value)}
                    className="w-14 text-right rounded-md px-1.5 py-0.5 text-[12px] outline-none border"
                    style={{ fontFamily: "'Poppins',sans-serif", background: C.border, border: `1px solid ${item.customPrice ? C.orange : C.border}`, color: item.customPrice ? C.orange : C.white }}
                  />
                </div>
                <span className="text-[13px] font-bold" style={{ color: C.orange }}>${((item.customPrice ?? item.price) * item.qty).toFixed(2)}</span>
              </div>
            </div>
          ))}
          {cart.length > 0 && (
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add order note..."
              className="w-full mt-2.5 rounded-lg px-2.5 py-1.5 text-[11px] outline-none border" style={{ fontFamily: "'Poppins',sans-serif", background: '#141312', borderColor: C.border, color: C.faint, boxSizing: 'border-box' }} />
          )}
        </div>

        {/* Cart Footer */}
        <div className="px-[18px] py-3.5 border-t flex-shrink-0" style={{ background: '#141312', borderColor: C.border }}>
          {cart.length > 0 && (
            <>
              <div className="mb-2.5">
                <div className="flex justify-between mb-1"><span className="text-[12px]" style={{ color: C.faint }}>Subtotal</span><span className="text-[12px] text-white">${subtotal.toFixed(2)}</span></div>
                {appliedDiscount && <div className="flex justify-between mb-1"><span className="text-[12px] flex items-center gap-1" style={{ color: '#2D8A4E' }}><Tag size={10} />{appliedDiscount.label}</span><span className="text-[12px]" style={{ color: '#2D8A4E' }}>−${discountAmt.toFixed(2)}</span></div>}
                <div className="flex justify-between mb-1.5"><span className="text-[12px]" style={{ color: C.faint }}>Tax (8%)</span><span className="text-[12px] text-white">${tax.toFixed(2)}</span></div>
                <div className="flex justify-between pt-2 border-t" style={{ borderColor: C.border }}>
                  <span className="text-[16px] font-bold text-white">Total</span>
                  <span className="text-[20px] font-bold" style={{ color: C.orange }}>${total.toFixed(2)}</span>
                </div>
                {customer && (
                  <div className="mt-1.5 rounded-lg px-2.5 py-1.5 flex justify-between" style={{ background: C.surface }}>
                    <span className="text-[11px] flex items-center gap-1" style={{ color: C.faint }}><User size={10} />{customer.name}</span>
                    <span className="text-[11px]" style={{ color: C.orange }}>+{Math.floor(total)} pts</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                {([['card', CreditCard, 'Card'],['cash', Banknote, 'Cash'],['tap', Smartphone, 'Tap'],['split', Zap, 'Split']] as [PaymentMethod, LucideIcon, string][]).map(([id, IconComp, label]) => (
                  <button key={id} onClick={() => setPaymentMethod(id)}
                    className="py-2 rounded-lg text-center cursor-pointer border flex flex-col items-center gap-0.5"
                    style={{ background: paymentMethod === id ? '#B95A3A' : C.border, border: `1px solid ${paymentMethod === id ? C.orange : 'transparent'}` }}>
                    <IconComp size={14} style={{ color: paymentMethod === id ? C.white : C.faint }} />
                    <span className="text-[10px] font-medium" style={{ color: paymentMethod === id ? C.white : C.faint }}>{label}</span>
                  </button>
                ))}
              </div>
              {paymentMethod === 'cash' && (
                <div className="rounded-lg p-3 mb-2.5" style={{ background: C.surface }}>
                  <p className="text-[11px] mb-1.5" style={{ color: C.faint }}>Cash tendered</p>
                  <div className="flex gap-1.5 mb-1.5">
                    <input value={cashGiven} onChange={e => setCashGiven(e.target.value)} placeholder="0.00"
                      className="flex-1 rounded-lg px-2.5 py-1.5 text-[13px] text-white outline-none border" style={{ fontFamily: "'Poppins',sans-serif", background: C.border, borderColor: C.border }} />
                    {[20, 50, 100].map(amt => (
                      <button key={amt} onClick={() => setCashGiven(amt.toString())} className="px-2.5 py-1.5 rounded-lg text-[11px] text-white cursor-pointer" style={{ background: C.border }}>${amt}</button>
                    ))}
                  </div>
                  {cashGiven && parseFloat(cashGiven) >= total && (
                    <div className="flex justify-between">
                      <span className="text-[12px]" style={{ color: C.faint }}>Change due</span>
                      <span className="text-[14px] font-bold" style={{ color: '#2D8A4E' }}>${cashChange.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          <button
            onClick={() => cart.length > 0 && setPosView('receipt')}
            className="w-full rounded-[10px] py-3.5 text-center text-[15px] font-bold text-white cursor-pointer"
            style={{ background: cart.length === 0 ? C.border : C.orange, opacity: cart.length === 0 ? 0.4 : 1 }}>
            {cart.length === 0 ? 'Charge $0.00' : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>Charge ${total.toFixed(2)} · {paymentMethod === 'card' ? <><CreditCard size={14} />Card</> : paymentMethod === 'cash' ? <><Banknote size={14} />Cash</> : paymentMethod === 'tap' ? <><Smartphone size={14} />Tap</> : <><Zap size={14} />Split</>}</span>}
          </button>
          {cart.length > 0 && (
            <div className="flex gap-2 mt-2">
              <button onClick={resetSale} className="flex-1 py-2 rounded-lg text-center border cursor-pointer" style={{ background: C.surface, borderColor: C.border }}>
                <span className="text-[11px]" style={{ color: C.muted }}>× Clear</span>
              </button>
              <button onClick={() => {}} className="flex-1 py-2 rounded-lg border cursor-pointer flex items-center justify-center gap-1" style={{ background: C.surface, borderColor: C.border }}>
                <Pause size={11} style={{ color: C.muted }} /><span className="text-[11px]" style={{ color: C.muted }}>Hold</span>
              </button>
              <button onClick={() => {}} className="flex-1 py-2 rounded-lg border cursor-pointer flex items-center justify-center gap-1" style={{ background: C.surface, borderColor: C.border }}>
                <Printer size={11} style={{ color: C.muted }} /><span className="text-[11px]" style={{ color: C.muted }}>Print</span>
              </button>
            </div>
          )}
        </div>

        {/* Receipt Overlay */}
        {posView === 'receipt' && (
          <div className="absolute inset-0 flex items-center justify-center z-20" style={{ background: 'rgba(0,0,0,0.85)' }}>
            <div className="rounded-2xl p-6 w-[340px] border" style={{ background: C.surface, borderColor: C.border }}>
              <div className="text-center mb-5">
                <div className="flex items-center justify-center mb-2"><CheckCircle size={48} style={{ color: '#2D8A4E' }} /></div>
                <p className="text-[18px] font-bold text-white">Payment Complete</p>
                <p className="text-[28px] font-bold mt-2 mb-1" style={{ color: '#D97757' }}>${total.toFixed(2)}</p>
                <p className="text-[12px]" style={{ color: C.faint }}>{new Date().toLocaleTimeString()} · {paymentMethod}</p>
              </div>
              {paymentMethod === 'cash' && cashChange > 0 && (
                <div className="rounded-[10px] p-3 mb-4 text-center border" style={{ background: '#2D8A4E20', borderColor: '#2D8A4E' }}>
                  <p className="text-[12px] mb-0.5" style={{ color: C.faint }}>Change due</p>
                  <p className="text-[22px] font-bold" style={{ color: '#2D8A4E' }}>${cashChange.toFixed(2)}</p>
                </div>
              )}
              <div className="mb-4">
                {cart.map(item => (
                  <div key={item.name} className="flex justify-between py-1 border-b" style={{ borderColor: C.border }}>
                    <span className="text-[11px]" style={{ color: '#8C8A82' }}>{item.qty}× {item.name}</span>
                    <span className="text-[11px] text-white">${((item.customPrice ?? item.price) * item.qty).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-1.5">
                  <span className="text-[12px]" style={{ color: C.faint }}>Total paid</span>
                  <span className="text-[12px] font-semibold text-white">${total.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button className="rounded-lg py-2.5 cursor-pointer text-[12px] text-white flex items-center justify-center gap-1.5" style={{ background: C.border }}><Mail size={13} />Email Receipt</button>
                <button className="rounded-lg py-2.5 cursor-pointer text-[12px] text-white flex items-center justify-center gap-1.5" style={{ background: C.border }}><Printer size={13} />Print Receipt</button>
                <button onClick={resetSale} className="rounded-lg py-3 text-center cursor-pointer text-[13px] font-bold text-white" style={{ background: '#D97757' }}>New Sale <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} /></button>
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
  const C = { orange: '#D97757', white: '#FFFFFF', muted: '#5C5A58', faint: '#6A6866', border: '#2C2A28', surface: '#1A1918', bg: '#0F0E0D' };
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex gap-3.5 mb-5">
        {[["Today's Sales","$842.50","14 transactions"],["Avg Ticket","$60.18","↑ vs yesterday"],["Top Item","Ceramic Mug","8 sold today"],["Cash in Drawer","$340.00","Expected"]].map(([label, value, sub]) => (
          <div key={label} className="flex-1 rounded-xl p-4 border" style={{ background: C.surface, borderColor: C.border }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: C.muted }}>{label}</p>
            <p className="text-[20px] font-bold text-white">{value}</p>
            <p className="text-[11px]" style={{ color: C.muted }}>{sub}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ background: C.surface, borderColor: C.border }}>
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b" style={{ borderColor: C.border }}>
          <p className="text-[14px] font-semibold text-white flex-1">Recent Transactions</p>
          <input placeholder="Search..." className="rounded-lg px-3 py-1.5 text-[12px] text-white outline-none border" style={{ fontFamily: "'Poppins',sans-serif", background: C.border, borderColor: C.border }} />
          <button className="px-3 py-1.5 rounded-lg cursor-pointer" style={{ background: C.border }}><span className="text-[11px]" style={{ color: C.faint }}>Export</span></button>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>{['Order','Customer','Items','Total','Method','Time','Actions'].map(h => (
              <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest border-b" style={{ color: C.muted, borderColor: C.border, background: '#141312' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {RECENT_SALES.map(s => (
              <tr key={s.id} style={{ borderBottom: `1px solid ${C.surface}` }}>
                <td className="px-4 py-3"><span className="text-[12px] font-bold" style={{ color: C.orange }}>{s.id}</span></td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar name={s.customer === 'Walk-in' ? 'WI' : s.customer} size={24} variant="pos" /><span className="text-[12px] text-white">{s.customer}</span></div></td>
                <td className="px-4 py-3"><span className="text-[12px]" style={{ color: C.faint }}>{s.items}</span></td>
                <td className="px-4 py-3"><span className="text-[13px] font-semibold text-white">${s.total.toFixed(2)}</span></td>
                <td className="px-4 py-3"><Badge color={s.method === 'Card' ? 'blue' : s.method === 'Cash' ? 'green' : 'orange'}>{s.method}</Badge></td>
                <td className="px-4 py-3"><span className="text-[11px]" style={{ color: C.muted }}>{s.time}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {['Receipt','Refund'].map((a, i) => (
                      <button key={a} className="px-2.5 py-1 rounded-md cursor-pointer text-[11px]" style={{ background: C.border, color: i === 1 ? '#C13030' : C.faint }}>{a}</button>
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
  const C = { orange: '#D97757', white: '#FFFFFF', muted: '#5C5A58', faint: '#6A6866', border: '#2C2A28', surface: '#1A1918', bg: '#0F0E0D' };
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <p className="text-[16px] font-bold text-white flex-1">Product Catalog</p>
        <input placeholder="Search SKU or name..." className="rounded-lg px-3.5 py-2 text-[13px] text-white outline-none border" style={{ fontFamily: "'Poppins',sans-serif", background: C.surface, borderColor: C.border }} />
        <button className="px-4 py-2 rounded-lg cursor-pointer text-[12px] font-semibold text-white" style={{ background: C.orange }}>+ Add Product</button>
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ background: C.surface, borderColor: C.border }}>
        <table className="w-full border-collapse">
          <thead>
            <tr>{['SKU','Product','Category','Price','Stock','Status','Actions'].map(h => (
              <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest border-b" style={{ color: C.muted, borderColor: C.border, background: '#141312' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {POS_PRODUCTS.map(p => (
              <tr key={p.sku} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td className="px-4 py-3"><span className="text-[11px] font-mono" style={{ color: C.muted }}>{p.sku}</span></td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><p.Icon size={18} style={{ color: C.orange, flexShrink: 0 }} /><span className="text-[12px] font-medium text-white">{p.name}</span></div></td>
                <td className="px-4 py-3"><Badge color="gray">{p.category}</Badge></td>
                <td className="px-4 py-3"><span className="text-[13px] font-semibold" style={{ color: C.orange }}>${p.price.toFixed(2)}</span></td>
                <td className="px-4 py-3"><span className="text-[12px]" style={{ color: p.stock === 0 ? '#C13030' : p.stock <= 8 ? '#C08B1E' : C.faint }}>{p.stock === 0 ? 'Out of stock' : `${p.stock} units`}</span></td>
                <td className="px-4 py-3"><Badge color={p.stock === 0 ? 'red' : p.stock <= 8 ? 'yellow' : 'green'}>{p.stock === 0 ? 'Out of Stock' : p.stock <= 8 ? 'Low Stock' : 'In Stock'}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button className="px-2.5 py-1 rounded-md cursor-pointer text-[11px]" style={{ background: C.border, color: C.faint }}>Edit</button>
                    {p.stock <= 8 && <button className="px-2.5 py-1 rounded-md cursor-pointer text-[11px]" style={{ background: C.border, color: C.orange }}>Restock</button>}
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
  const C = { orange: '#D97757', white: '#FFFFFF', muted: '#5C5A58', faint: '#6A6866', border: '#2C2A28', surface: '#1A1918' };
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center gap-2.5 mb-6">
        <p className="text-[18px] font-bold text-white flex-1">Shift Summary</p>
        <p className="text-[12px]" style={{ color: C.muted }}>Opened 9:00 AM · May 22, 2026</p>
        <button className="px-4 py-2 rounded-lg border cursor-pointer text-[12px] font-semibold" style={{ background: '#C1303020', border: '1px solid #C13030', color: '#C13030' }}>Close Shift</button>
      </div>
      <div className="grid grid-cols-3 gap-3.5 mb-6">
        {[["Total Sales","$842.50","14 transactions"],["Cash Sales","$340.00","5 transactions"],["Card Sales","$502.50","9 transactions"],["Avg Transaction","$60.18","+$4.20 vs yesterday"],["Items Sold","38 units","Across 16 products"],["Refunds","$0.00","0 refunds today"]].map(([label, value, sub]) => (
          <div key={label} className="rounded-xl p-4 border" style={{ background: C.surface, borderColor: C.border }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: C.muted }}>{label}</p>
            <p className="text-[22px] font-bold text-white">{value}</p>
            <p className="text-[11px]" style={{ color: C.muted }}>{sub}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border p-4" style={{ background: C.surface, borderColor: C.border }}>
          <p className="text-[13px] font-semibold text-white mb-3.5">Top Sellers Today</p>
          {[['Ceramic Mug',8,'$224.00'],['Scented Candle',6,'$144.00'],['Bamboo Pen Set',5,'$110.00'],['Linen Tote',4,'$168.00']].map(([name,qty,revenue]) => (
            <div key={name as string} className="flex items-center gap-2.5 mb-2.5">
              <span className="text-[12px] text-white flex-1">{name as string}</span>
              <span className="text-[11px]" style={{ color: C.muted }}>{qty} sold</span>
              <span className="text-[12px] font-semibold" style={{ color: C.orange }}>{revenue}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl border p-4" style={{ background: C.surface, borderColor: C.border }}>
          <p className="text-[13px] font-semibold text-white mb-3.5">Cash Drawer Reconciliation</p>
          {[['Opening Float','$200.00'],['Cash Sales','$340.00'],['Payouts','−$0.00'],['Expected','$540.00'],['Actual (counted)','$538.50'],['Variance','−$1.50']].map(([label, val], i) => (
            <div key={label} className="flex justify-between pb-2 mb-2 border-b" style={{ borderColor: C.border }}>
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
    <div className="flex flex-col pos-dark" style={{ height: 'calc(100vh)', background: '#0F0E0D', fontFamily: "'Poppins', sans-serif" }}>
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
