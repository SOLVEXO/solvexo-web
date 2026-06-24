import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Download, Truck, CheckCircle2, Clock, XCircle,
  ChevronDown, MapPin, Box, ShoppingBag,
  BadgeCheck, RotateCcw, Loader2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Card, EmptyState } from '@/components/comman/ui';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

interface OrderAddress {
  recipientName: string;
  phoneNumber:   string;
  addressLine1:  string;
  addressLine2?: string | null;
  city:          string;
  state:         string;
  zipCode:       string;
}

interface OrderItem {
  name:       string;
  sku:        string;
  quantity:   number;
  price:      number;
  totalPrice: number;
  type:       'physical' | 'digital';
  productId?: string;
}

interface MyOrder {
  orderId:         string;
  orderNumber:     string;
  orderDate:       string;
  paymentMethod:   string;
  isPaid:          boolean;
  orderStatus:     OrderStatus;
  deliveryAddress: OrderAddress;
  items:           OrderItem[];
  summary: { subtotal: number; shipping: number; total: number };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data  — swap with real API call when ready
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_ORDERS: MyOrder[] = [
  {
    orderId: 'ord_001', orderNumber: 'ORD-2024-001',
    orderDate: '2024-06-20T10:30:00Z', paymentMethod: 'cash_on_delivery',
    isPaid: false, orderStatus: 'shipped',
    deliveryAddress: { recipientName: 'Ahmed Khan', phoneNumber: '0300-1234567', addressLine1: 'House 12, Street 5, F-7/2', city: 'Islamabad', state: 'ICT', zipCode: '44000' },
    items: [
      { name: 'Premium Wireless Headphones', sku: 'SKU-HP-001', quantity: 1, price: 8500, totalPrice: 8500, type: 'physical' },
      { name: 'Phone Case - Black',          sku: 'SKU-PC-002', quantity: 2, price: 850,  totalPrice: 1700, type: 'physical' },
    ],
    summary: { subtotal: 10200, shipping: 250, total: 10450 },
  },
  {
    orderId: 'ord_002', orderNumber: 'ORD-2024-002',
    orderDate: '2024-06-18T14:00:00Z', paymentMethod: 'online',
    isPaid: true, orderStatus: 'completed',
    deliveryAddress: { recipientName: 'Ahmed Khan', phoneNumber: '0300-1234567', addressLine1: 'House 12, Street 5, F-7/2', city: 'Islamabad', state: 'ICT', zipCode: '44000' },
    items: [
      { name: 'Graphic Design Course Bundle', sku: 'SKU-DIG-010', quantity: 1, price: 3500, totalPrice: 3500, type: 'digital', productId: 'prod_010' },
      { name: 'UI/UX Figma Templates Pack',   sku: 'SKU-DIG-011', quantity: 1, price: 1200, totalPrice: 1200, type: 'digital', productId: 'prod_011' },
    ],
    summary: { subtotal: 4700, shipping: 0, total: 4700 },
  },
  {
    orderId: 'ord_003', orderNumber: 'ORD-2024-003',
    orderDate: '2024-06-15T09:15:00Z', paymentMethod: 'cash_on_delivery',
    isPaid: false, orderStatus: 'pending',
    deliveryAddress: { recipientName: 'Ahmed Khan', phoneNumber: '0300-1234567', addressLine1: 'House 12, Street 5, F-7/2', city: 'Islamabad', state: 'ICT', zipCode: '44000' },
    items: [
      { name: 'Mechanical Keyboard RGB', sku: 'SKU-KB-005', quantity: 1, price: 12000, totalPrice: 12000, type: 'physical' },
    ],
    summary: { subtotal: 12000, shipping: 300, total: 12300 },
  },
  {
    orderId: 'ord_004', orderNumber: 'ORD-2024-004',
    orderDate: '2024-06-10T16:45:00Z', paymentMethod: 'online',
    isPaid: true, orderStatus: 'cancelled',
    deliveryAddress: { recipientName: 'Ahmed Khan', phoneNumber: '0300-1234567', addressLine1: 'House 12, Street 5, F-7/2', city: 'Islamabad', state: 'ICT', zipCode: '44000' },
    items: [
      { name: 'Running Shoes - Size 42', sku: 'SKU-SH-007', quantity: 1, price: 6500, totalPrice: 6500, type: 'physical' },
    ],
    summary: { subtotal: 6500, shipping: 200, total: 6700 },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: typeof Clock; bg: string; text: string; border: string }> = {
  pending:    { label: 'Pending',    icon: Clock,        bg: '#FFF4DC', text: '#B36200', border: '#FDDFA0' },
  processing: { label: 'Processing', icon: RotateCcw,    bg: '#EEF0FF', text: '#3851D1', border: '#C7CEFF' },
  shipped:    { label: 'Shipped',    icon: Truck,        bg: '#E8F5FF', text: '#1A65A8', border: '#B3D8F7' },
  completed:  { label: 'Completed',  icon: CheckCircle2, bg: '#E3F4EA', text: '#1A6B35', border: '#A3D9B5' },
  cancelled:  { label: 'Cancelled',  icon: XCircle,      bg: '#FFF0F0', text: '#C0392B', border: '#F5BCBC' },
};

const FILTER_TABS: { key: 'all' | OrderStatus; label: string }[] = [
  { key: 'all',        label: 'All'        },
  { key: 'pending',    label: 'Pending'    },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped',    label: 'Shipped'    },
  { key: 'completed',  label: 'Completed'  },
  { key: 'cancelled',  label: 'Cancelled'  },
];

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg  = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-[5px] px-2.5 py-[4px] rounded-full text-[10px] font-bold border"
      style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
    >
      <Icon size={9} />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DownloadBtn
// ─────────────────────────────────────────────────────────────────────────────
function DownloadBtn({ orderId, productId }: { orderId: string; productId: string }) {
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    setBusy(true);
    // TODO: replace with apiGetDownloadUrl(orderId, productId) when API ready
    await new Promise(r => setTimeout(r, 800));
    console.log('download', orderId, productId);
    setBusy(false);
  };

  return (
    <button
      onClick={handle}
      disabled={busy}
      className={clsx(
        'flex items-center gap-[5px] px-3 py-[5px] rounded-[7px] text-[11px] font-semibold border-none',
        busy ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        'bg-[#EEF0FF] text-[#3851D1]',
      )}
    >
      {busy ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
      {busy ? 'Fetching…' : 'Download'}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OrderTimeline
// ─────────────────────────────────────────────────────────────────────────────
const TIMELINE = [
  { icon: BadgeCheck,   label: 'Confirmed'  },
  { icon: Box,          label: 'Processing' },
  { icon: Truck,        label: 'Shipped'    },
  { icon: CheckCircle2, label: 'Delivered'  },
] as const;

function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') return null;
  const activeIdx = status === 'completed' ? 3 : status === 'shipped' ? 2 : status === 'processing' ? 1 : 0;

  return (
    <div className="relative flex items-start justify-between pt-1">
      <div className="absolute top-[13px] left-[13px] right-[13px] h-[2px] bg-bone rounded-full" />
      <div
        className="absolute top-[13px] left-[13px] h-[2px] bg-success rounded-full transition-all duration-500"
        style={{ width: `${(activeIdx / (TIMELINE.length - 1)) * 100}%` }}
      />
      {TIMELINE.map(({ icon: Icon, label }, i) => {
        const done   = i < activeIdx;
        const active = i === activeIdx;
        return (
          <div key={label} className="relative z-10 flex flex-col items-center gap-[6px]">
            <div className={clsx(
              'w-7 h-7 rounded-full flex items-center justify-center',
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
          'w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0',
          isDigital ? 'bg-[#EEF0FF]' : 'bg-brand-pale-orange',
        )}>
          {isDigital ? <Download size={13} className="text-[#3851D1]" /> : <Package size={13} className="text-brand-orange" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-[2px]">
            <p className="text-[12px] font-semibold text-charcoal truncate">{item.name}</p>
            {isDigital && (
              <span className="shrink-0 text-[9px] font-bold px-1.5 py-[1px] rounded-full bg-[#EEF0FF] text-[#3851D1]">Digital</span>
            )}
          </div>
          <p className="text-[11px] text-slate">SKU: {item.sku} · Qty: {item.quantity}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <p className="text-[12px] font-bold text-charcoal">Rs {item.totalPrice.toLocaleString()}</p>
        {isDigital && item.productId && (
          <DownloadBtn orderId={orderId} productId={item.productId} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FilterTabs
// ─────────────────────────────────────────────────────────────────────────────
function FilterTabs({
  active, counts, onChange,
}: {
  active: 'all' | OrderStatus;
  counts: Record<string, number>;
  onChange: (v: 'all' | OrderStatus) => void;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap px-3 md:px-5 py-3 border-b border-bone">
      {FILTER_TABS.map(tab => {
        const count    = tab.key === 'all' ? counts.all : (counts[tab.key] ?? 0);
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={clsx(
              'flex items-center gap-1 px-3 py-[5px] rounded-[7px] text-[11px] font-semibold border cursor-pointer transition-all',
              isActive
                ? 'bg-brand-orange text-white border-brand-orange'
                : 'bg-white text-slate border-bone',
            )}
          >
            {tab.label}
            {count > 0 && (
              <span className={clsx(
                'min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center',
                isActive ? 'bg-white/25 text-white' : 'bg-bone text-charcoal',
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OrderCard
// ─────────────────────────────────────────────────────────────────────────────
function OrderCard({ order }: { order: MyOrder }) {
  const [expanded, setExpanded] = useState(false);
  const allDigital = order.items.every(i => i.type === 'digital');
  const hasDigital = order.items.some(i => i.type === 'digital');

  return (
    <div className="border border-bone rounded-[12px] overflow-hidden bg-white">

      {/* Header — click to expand */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left px-4 md:px-5 py-4 flex items-center gap-3 flex-wrap cursor-pointer bg-transparent border-none"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-[4px]">
            <span className="text-[13px] font-bold text-brand-deep-orange font-mono">{order.orderNumber}</span>
            <StatusBadge status={order.orderStatus} />
            {order.isPaid
              ? <span className="px-2 py-[3px] rounded-full text-[9px] font-bold bg-[#E3F4EA] text-[#1A6B35] border border-[#A3D9B5]">Paid</span>
              : <span className="px-2 py-[3px] rounded-full text-[9px] font-bold bg-[#FFF0F0] text-error border border-[#F5BCBC]">Unpaid</span>
            }
            {hasDigital && (
              <span className="px-2 py-[3px] rounded-full text-[9px] font-bold bg-[#EEF0FF] text-[#3851D1] border border-[#C7CEFF]">Digital</span>
            )}
          </div>
          <p className="text-[11px] text-slate">
            {new Date(order.orderDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
            {' · '}{order.items.length} item{order.items.length !== 1 ? 's' : ''}
            {' · '}{order.paymentMethod.replace(/_/g, ' ')}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-slate mb-[1px]">Total</p>
            <p className="text-[14px] font-bold text-carbon">Rs {order.summary.total.toLocaleString()}</p>
          </div>
          <div className={clsx(
            'w-7 h-7 rounded-full flex items-center justify-center bg-cream border border-bone transition-transform',
            expanded && 'rotate-180',
          )}>
            <ChevronDown size={13} className="text-slate" />
          </div>
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-bone">

          {/* Items */}
          <div className="px-4 md:px-5 pt-4 pb-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Box size={11} className="text-slate" />
              <p className="text-[10px] font-bold text-slate uppercase tracking-[0.07em]">Items ({order.items.length})</p>
            </div>
            {order.items.map((item, i) => (
              <OrderItemRow key={i} item={item} orderId={order.orderId} />
            ))}
          </div>

          {/* Delivery address */}
          {!allDigital && (
            <div className="px-4 md:px-5 pb-4 pt-3 border-t border-bone">
              <div className="flex items-center gap-1.5 mb-3">
                <MapPin size={11} className="text-slate" />
                <p className="text-[10px] font-bold text-slate uppercase tracking-[0.07em]">Delivery Address</p>
              </div>
              <div className="bg-cream rounded-[9px] px-3 md:px-4 py-3">
                <p className="text-[12px] font-semibold text-charcoal">{order.deliveryAddress.recipientName}</p>
                <p className="text-[11px] text-slate mt-[2px]">{order.deliveryAddress.phoneNumber}</p>
                <p className="text-[11px] text-charcoal mt-[2px]">
                  {order.deliveryAddress.addressLine1}
                  {order.deliveryAddress.addressLine2 ? `, ${order.deliveryAddress.addressLine2}` : ''}
                </p>
                <p className="text-[11px] text-charcoal">
                  {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                </p>
              </div>
            </div>
          )}

          {/* Timeline */}
          {!allDigital && order.orderStatus !== 'cancelled' && (
            <div className="px-4 md:px-5 pb-4 pt-3 border-t border-bone">
              <p className="text-[10px] font-bold text-slate uppercase tracking-[0.07em] mb-4">Order Progress</p>
              <OrderTimeline status={order.orderStatus} />
            </div>
          )}

          {/* Price summary */}
          <div className="px-4 md:px-5 py-3 bg-cream border-t border-bone flex flex-col gap-[6px]">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate">Subtotal</span>
              <span className="font-medium text-charcoal">Rs {order.summary.subtotal.toLocaleString()}</span>
            </div>
            {!allDigital && (
              <div className="flex justify-between text-[11px]">
                <span className="text-slate">Shipping</span>
                <span className="font-medium text-charcoal">
                  {order.summary.shipping === 0 ? 'Free' : `Rs ${order.summary.shipping.toLocaleString()}`}
                </span>
              </div>
            )}
            <div className="flex justify-between text-[13px] font-bold pt-2 border-t border-bone">
              <span className="text-charcoal">Total</span>
              <span className="text-carbon">Rs {order.summary.total.toLocaleString()}</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OrdersTab  — embedded inside UserProfile
// ─────────────────────────────────────────────────────────────────────────────
export function OrdersTab() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'all' | OrderStatus>('all');

  // TODO: replace with real API call when ready
  const orders = MOCK_ORDERS;

  const filtered = activeFilter === 'all'
    ? orders
    : orders.filter(o => o.orderStatus === activeFilter);

  const counts = {
    all:        orders.length,
    pending:    orders.filter(o => o.orderStatus === 'pending').length,
    processing: orders.filter(o => o.orderStatus === 'processing').length,
    shipped:    orders.filter(o => o.orderStatus === 'shipped').length,
    completed:  orders.filter(o => o.orderStatus === 'completed').length,
    cancelled:  orders.filter(o => o.orderStatus === 'cancelled').length,
  };

  return (
    <Card padding="none">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-bone flex items-end justify-between">
        <div>
          <p className="text-[11px] text-slate mb-[3px]">Account / My Orders</p>
          <h1 className="text-[22px] font-bold text-charcoal leading-none">My Orders</h1>
        </div>
        <div className="text-right pb-[2px]">
          <p className="text-[13px] font-semibold text-charcoal leading-tight">Total Orders</p>
          <p className="text-[11px] text-slate mt-[2px]">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <FilterTabs active={activeFilter} counts={counts} onChange={setActiveFilter} />

      {/* Content */}
      {orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={28} className="text-brand-orange opacity-55" />}
          title="No orders yet"
          description="Your order history will appear here once you make your first purchase."
          action={{ label: 'Browse Marketplace', onClick: () => navigate('/marketplace'), icon: <ShoppingBag size={14} /> }}
          className="py-12"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Package size={28} className="text-brand-orange opacity-55" />}
          title={`No ${activeFilter} orders`}
          description="No orders match this filter."
          className="py-10"
        />
      ) : (
        <div className="p-5 flex flex-col gap-3">
          {filtered.map(order => (
            <OrderCard key={order.orderId} order={order} />
          ))}
        </div>
      )}
    </Card>
  );
}
