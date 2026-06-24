import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  CheckCircle2, MapPin, Package, ShoppingBag, Download,
  Loader2, ArrowRight, Home, Truck, Box, BadgeCheck,
} from 'lucide-react';
import type { PlacedOrder, OrderItem, OrderDeliveryAddress } from '@/api/commerce/payment';
import { apiGetDownloadUrl } from '@/api/commerce/orders';
import { clsx } from 'clsx';

// ─────────────────────────────────────────────────────────────────────────────
// Logo
// ─────────────────────────────────────────────────────────────────────────────
function SolvexoLogo({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#D97757" />
        <text x="4" y="26" fontFamily="'Poppins',sans-serif" fontWeight="800" fontSize="26" fill="white">s</text>
        <rect x="16.5" y="2" width="13" height="13" rx="3.5" fill="#C8694E" fillOpacity="0.7" />
        <path d="M23 11.5V5.5M23 5.5L20 8.5M23 5.5L26 8.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-bold text-[15px] text-[#141413]">Solvex<span className="text-brand-orange">o</span></span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DownloadBtn
// ─────────────────────────────────────────────────────────────────────────────
function DownloadBtn({ orderId, productId }: { orderId: string; productId: string }) {
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState('');

  const fetch = async () => {
    setBusy(true); setErr('');
    try {
      const res = await apiGetDownloadUrl(orderId, productId);
      window.open(res.data.downloadUrl, '_blank', 'noopener noreferrer');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-[3px]">
      <button
        onClick={fetch}
        disabled={busy}
        className={clsx(
          'flex items-center gap-[5px] px-3 py-[5px] rounded-[7px] text-[11px] font-semibold border-none transition-opacity',
          busy ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
          'bg-[#EEF0FF] text-[#3851D1]',
        )}
      >
        {busy ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
        {busy ? 'Fetching…' : 'Download'}
      </button>
      {err && <p className="text-[10px] text-error leading-tight max-w-[140px] text-right">{err}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OrderItemRow
// ─────────────────────────────────────────────────────────────────────────────
function OrderItemRow({ item, orderId }: { item: OrderItem; orderId: string }) {
  const isDigital = item.type === 'digital';
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-bone last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className={clsx(
          'w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0',
          isDigital ? 'bg-[#EEF0FF]' : 'bg-brand-pale-orange',
        )}>
          {isDigital
            ? <Download size={14} className="text-[#3851D1]" />
            : <Package  size={14} className="text-brand-orange" />
          }
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-[2px]">
            <p className="text-[13px] font-semibold text-charcoal leading-tight truncate">{item.name}</p>
            {isDigital && (
              <span className="shrink-0 text-[9px] font-bold px-1.5 py-[1px] rounded-full bg-[#EEF0FF] text-[#3851D1] uppercase tracking-wide">
                Digital
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate">
            SKU: {item.sku} · Qty: {item.quantity}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <p className="text-[13px] font-bold text-charcoal">Rs {item.totalPrice.toLocaleString()}</p>
        {isDigital && item.productId && (
          <DownloadBtn orderId={orderId} productId={item.productId} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OrderItemsSection
// ─────────────────────────────────────────────────────────────────────────────
function OrderItemsSection({ items, orderId }: { items: OrderItem[]; orderId: string }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-1">
        <Box size={13} className="text-slate" />
        <h3 className="text-[11px] font-bold text-slate uppercase tracking-[0.07em]">
          Items ({items.length})
        </h3>
      </div>
      <div>
        {items.map((item, i) => (
          <OrderItemRow key={i} item={item} orderId={orderId} />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AddressSection
// ─────────────────────────────────────────────────────────────────────────────
function AddressSection({ addr }: { addr: OrderDeliveryAddress }) {
  return (
    <section className="pt-4 mt-1 border-t border-bone">
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={13} className="text-slate" />
        <h3 className="text-[11px] font-bold text-slate uppercase tracking-[0.07em]">Delivery Address</h3>
      </div>
      <div className="bg-cream rounded-[10px] px-4 py-3 flex flex-col gap-[3px]">
        <p className="text-[13px] font-semibold text-charcoal">{addr.recipientName}</p>
        <p className="text-[12px] text-slate">{addr.phoneNumber}</p>
        <p className="text-[12px] text-charcoal">
          {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
        </p>
        <p className="text-[12px] text-charcoal">{addr.city}, {addr.state} {addr.zipCode}</p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OrderTimeline — shows status flow for physical orders
// ─────────────────────────────────────────────────────────────────────────────
const TIMELINE_STEPS = [
  { icon: BadgeCheck, label: 'Confirmed' },
  { icon: Box,        label: 'Processing' },
  { icon: Truck,      label: 'Shipped' },
  { icon: Home,       label: 'Delivered' },
];

function OrderTimeline({ currentStatus }: { currentStatus: string }) {
  const activeIdx = currentStatus === 'completed' ? 3
    : currentStatus === 'shipped'    ? 2
    : currentStatus === 'processing' ? 1
    : 0;

  return (
    <section className="pt-4 mt-1 border-t border-bone">
      <h3 className="text-[11px] font-bold text-slate uppercase tracking-[0.07em] mb-4">Order Progress</h3>
      <div className="relative flex items-start justify-between">
        {/* track line */}
        <div className="absolute top-[13px] left-[13px] right-[13px] h-[2px] bg-bone rounded-full" />
        <div
          className="absolute top-[13px] left-[13px] h-[2px] bg-success rounded-full transition-all duration-500"
          style={{ width: `${(activeIdx / (TIMELINE_STEPS.length - 1)) * 100}%` }}
        />
        {TIMELINE_STEPS.map(({ icon: Icon, label }, i) => {
          const done   = i < activeIdx;
          const active = i === activeIdx;
          return (
            <div key={label} className="relative z-10 flex flex-col items-center gap-[6px]">
              <div className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center transition-all',
                done   ? 'bg-success text-white'
                : active ? 'bg-brand-orange text-white ring-4 ring-brand-pale-orange'
                : 'bg-bone text-slate',
              )}>
                <Icon size={13} />
              </div>
              <span className={clsx(
                'text-[10px] font-semibold whitespace-nowrap',
                done ? 'text-success' : active ? 'text-brand-orange' : 'text-slate',
              )}>{label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OrderCard
// ─────────────────────────────────────────────────────────────────────────────
function OrderCard({ order }: { order: PlacedOrder }) {
  const allDigital = order.items.every(i => i.type === 'digital');

  return (
    <article className="bg-white rounded-[14px] border border-bone overflow-hidden">

      {/* Card header */}
      <header className="px-5 py-4 border-b border-bone flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10px] font-semibold text-slate uppercase tracking-[0.08em] mb-[3px]">Order</p>
          <p className="text-[16px] font-bold text-brand-deep-orange font-mono leading-none">
            {order.orderNumber}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={clsx(
            'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide',
            order.orderStatus === 'completed' ? 'bg-[#E3F4EA] text-[#1A6B35]'
            : order.orderStatus === 'cancelled' ? 'bg-[#FFF0F0] text-error'
            : 'bg-[#FFF4DC] text-[#B36200]',
          )}>
            {order.orderStatus}
          </span>
          <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-bone text-slate capitalize">
            {order.paymentMethod.replace(/_/g, ' ')}
          </span>
          {order.isPaid && (
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#E3F4EA] text-[#1A6B35]">
              Paid
            </span>
          )}
        </div>
      </header>

      {/* Card body */}
      <div className="px-5 py-4 flex flex-col gap-0">
        <OrderItemsSection items={order.items} orderId={order.orderId} />
        {!allDigital && <AddressSection addr={order.deliveryAddress} />}
        {!allDigital && <OrderTimeline currentStatus={order.orderStatus} />}
      </div>

      {/* Price footer */}
      <footer className="px-5 py-4 bg-cream border-t border-bone">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[12px]">
            <span className="text-slate">Subtotal</span>
            <span className="font-medium text-charcoal">Rs {order.summary.subtotal.toLocaleString()}</span>
          </div>
          {!allDigital && (
            <div className="flex justify-between text-[12px]">
              <span className="text-slate">Shipping</span>
              <span className="font-medium text-charcoal">
                {order.summary.shipping === 0 ? 'Free' : `Rs ${order.summary.shipping.toLocaleString()}`}
              </span>
            </div>
          )}
          <div className="flex justify-between text-[14px] font-bold pt-2 border-t border-bone">
            <span className="text-charcoal">Total</span>
            <span className="text-charcoal">Rs {order.summary.total.toLocaleString()}</span>
          </div>
        </div>
      </footer>

    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SuccessHero
// ─────────────────────────────────────────────────────────────────────────────
function SuccessHero({ orders }: { orders: PlacedOrder[] }) {
  const firstDate   = orders[0]?.orderDate;
  const totalItems  = orders.reduce((s, o) => s + o.items.length, 0);
  const hasDigital  = orders.some(o => o.items.some(i => i.type === 'digital'));
  const hasPhysical = orders.some(o => o.items.some(i => i.type === 'physical'));

  return (
    <div className="bg-white rounded-[16px] border border-bone px-4 md:px-8 py-6 md:py-8 flex flex-col items-center text-center">

      {/* Icon */}
      <div className="relative mb-5">
        <div className="w-[72px] h-[72px] rounded-full bg-[#EBF7EF] flex items-center justify-center">
          <CheckCircle2 size={38} className="text-success" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-brand-orange flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">{orders.length}</span>
        </div>
      </div>

      {/* Text */}
      <h1 className="text-[24px] font-bold text-carbon leading-tight mb-2">
        Order Confirmed!
      </h1>
      <p className="text-[13px] text-slate leading-[1.7] max-w-[360px] mb-5">
        {hasPhysical && hasDigital
          ? "Your physical items will be shipped and digital products are ready to download."
          : hasDigital
          ? "Your digital products are ready — download them from the cards below."
          : "We'll notify you once your order is packed and on its way."
        }
      </p>

      {/* Meta chips */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {firstDate && (
          <div className="flex items-center gap-1.5 px-4 py-[7px] bg-cream rounded-[8px] border border-bone">
            <span className="text-[11px] text-slate">Placed</span>
            <span className="text-[11px] font-semibold text-charcoal">
              {new Date(firstDate).toLocaleDateString('en-PK', {
                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5 px-4 py-[7px] bg-cream rounded-[8px] border border-bone">
          <Package size={11} className="text-slate" />
          <span className="text-[11px] font-semibold text-charcoal">
            {totalItems} item{totalItems !== 1 ? 's' : ''}
          </span>
        </div>
        {hasDigital && (
          <div className="flex items-center gap-1.5 px-4 py-[7px] bg-[#EEF0FF] rounded-[8px] border border-[#C7CEFF]">
            <Download size={11} className="text-[#3851D1]" />
            <span className="text-[11px] font-semibold text-[#3851D1]">Ready to download</span>
          </div>
        )}
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SummaryPanel — sticky right sidebar
// ─────────────────────────────────────────────────────────────────────────────
function SummaryPanel({ orders, navigate }: { orders: PlacedOrder[]; navigate: (p: string) => void }) {
  const grandTotal = orders.reduce((s, o) => s + o.summary.total, 0);

  return (
    <aside className="bg-white rounded-[14px] border border-bone overflow-hidden lg:sticky top-[76px]">

      <div className="px-5 py-4 border-b border-bone">
        <p className="text-[13px] font-bold text-charcoal">Order Summary</p>
        <p className="text-[11px] text-slate mt-[2px]">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
      </div>

      <div className="px-5 py-4 flex flex-col gap-3 border-b border-bone">
        {orders.map(order => (
          <div key={order.orderId} className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-brand-deep-orange font-mono leading-tight">{order.orderNumber}</p>
              <p className="text-[10px] text-slate mt-[1px]">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
            </div>
            <p className="text-[12px] font-semibold text-charcoal shrink-0">Rs {order.summary.total.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="px-5 py-4 flex justify-between items-center border-b border-bone">
        <span className="text-[13px] font-bold text-charcoal">Grand Total</span>
        <span className="text-[15px] font-bold text-carbon">Rs {grandTotal.toLocaleString()}</span>
      </div>

      <div className="px-5 py-4 flex flex-col gap-2">
        <button
          onClick={() => navigate('/marketplace')}
          className="w-full flex items-center justify-center gap-2 bg-brand-orange text-white rounded-[10px] px-4 py-[11px] text-[13px] font-semibold border-none cursor-pointer"
        >
          <ShoppingBag size={14} /> Continue Shopping
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 bg-cream text-charcoal border border-bone rounded-[10px] px-4 py-[11px] text-[13px] font-medium cursor-pointer"
        >
          Back to Home <ArrowRight size={13} />
        </button>
      </div>

    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export function OrderSuccessPage() {
  usePageTitle('Order Confirmed');
  const navigate = useNavigate();
  const location = useLocation();
  const orders   = (location.state as { orders: PlacedOrder[] } | null)?.orders ?? [];

  if (orders.length === 0) {
    navigate('/marketplace', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-cream">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-bone h-[60px] flex items-center px-4 md:px-10">
        <SolvexoLogo onClick={() => navigate('/')} />
      </nav>

      {/* Content */}
      <div className="max-w-[1040px] mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

          {/* Left — hero + order cards */}
          <div className="flex flex-col gap-5">
            <SuccessHero orders={orders} />
            {orders.map(order => (
              <OrderCard key={order.orderId} order={order} />
            ))}
          </div>

          {/* Right — sticky summary */}
          <SummaryPanel orders={orders} navigate={navigate} />

        </div>
      </div>

    </div>
  );
}
