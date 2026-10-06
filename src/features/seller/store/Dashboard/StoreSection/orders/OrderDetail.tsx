import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Package, MapPin, User, CreditCard, Truck, AlertCircle,
  CheckCheck, RefreshCw, XCircle, Undo2, Store as StoreIcon, Printer, Pencil, RotateCcw,
} from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import {
  apiGetSellerOrderDetail,
  type SellerOrderDetail,
} from '@/api/services/product';
import {
  apiMarkOrderPaid, apiUpdateOrderStatus, apiCancelOrderAsSeller, apiRefundOrderAsSeller,
  apiRecordOrderPayment, apiListOrderPayments, apiMarkShipmentDelivered, type OrderPaymentRecordRow,
} from '@/api/services/orders';
import { apiCaptureOrderPayment } from '@/api/services/payment';
import {
  SkeletonBox, StatusBadge, Button, Modal, Field, Input, Select,
} from '@/components/comman/ui';
import { currencySymbol } from '@/utils/currency';
import { ConfirmDialog } from '@/features/seller/store/Dashboard/OnlineStore/builder/ConfirmDialog';
import { hasNavPermission } from '@/components/layouts/StoreLayout';
import { TokenStorage } from '@/api/services/auth';
import { OrderTimelineCard } from './OrderTimelineCard';
import { OrderNotesCard } from './OrderNotesCard';
import { EditOrderModal } from './EditOrderModal';
import { ExchangeModal } from './ExchangeModal';
import { EditShippingAddressModal } from './EditShippingAddressModal';
import { BuyShippingLabelModal } from './BuyShippingLabelModal';
import { EditTrackingModal } from './EditTrackingModal';
import { ReturnLabelModal } from './ReturnLabelModal';
import { ReturnLinesPanel } from './ReturnLinesPanel';
import { openPackingSlips, toPackingSlipOrder } from '@/utils/packingSlip';
import { FulfilItemsModal } from './FulfilItemsModal';
import { shippedQuantities, isShippableLine } from './fulfilment';

type OrderAction = 'paid' | 'processing' | 'ready' | 'delivered' | 'completed' | 'capture' | 'cancel' | 'refund' | 'record-payment' | 'shipment' | null;

/** Statuses from which more units may still be fulfilled (mirrors the backend's FULFILLABLE_STATUSES). */
const FULFILLABLE = ['pending', 'processing', 'partially_shipped', 'partially_cancelled', 'partially_refunded'];

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function Card({ title, icon: Icon, action, children }: { title: string; icon?: React.ElementType; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-bone flex items-center gap-2">
        {Icon && <Icon size={14} className="text-brand-orange shrink-0" />}
        <p className="text-[12px] font-bold text-charcoal uppercase tracking-[0.06em] flex-1">{title}</p>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-bone last:border-b-0">
      <span className="text-[12px] text-slate shrink-0">{label}</span>
      <span className="text-[12px] font-medium text-charcoal text-right">{value ?? '—'}</span>
    </div>
  );
}

export function StoreOrderDetail() {
  const navigate = useNavigate();
  const { orderId = '' } = useParams<{ orderId: string }>();
  const { storeId, store } = useStoreWorkspace();
  const symbol = currencySymbol(store?.baseCurrency);

  const [detail,  setDetail]  = useState<SellerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [busyAction, setBusyAction] = useState<OrderAction>(null);
  const busy = busyAction !== null;

  const [showFulfil, setShowFulfil] = useState(false);
  const [deliveringShipmentId, setDeliveringShipmentId] = useState<string | null>(null);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundError, setRefundError] = useState('');
  const [refundTo, setRefundTo] = useState<'original' | 'store_credit'>('original');
  const [paymentRecords, setPaymentRecords] = useState<OrderPaymentRecordRow[]>([]);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'other'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentError, setPaymentError] = useState('');
  // Shopify-style "Buy shipping label" (Shippo): its own modal (package + rate picker) so a
  // failure there never blocks the always-available "Fulfil items" tracking entry.
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showEditOrder, setShowEditOrder] = useState(false);
  const [showExchange, setShowExchange] = useState(false);
  const [exchangeIds, setExchangeIds] = useState<string[]>([]);
  const [showEditTracking, setShowEditTracking] = useState(false);
  // Return labels: approved returned lines the seller ticked, then the rate dialog.
  const [returnPick, setReturnPick] = useState<string[]>([]);
  const [showReturnLabel, setShowReturnLabel] = useState(false);
  const [slipError, setSlipError] = useState('');
  const [showEditAddress, setShowEditAddress] = useState(false);
  const currentUser = TokenStorage.getUser<{ _id?: string; id?: string }>();
  const currentUserId = currentUser?._id ?? currentUser?.id ?? null;
  const canEditOrder = hasNavPermission(currentUser as Parameters<typeof hasNavPermission>[0], 'orders.edit');
  const canFulfilPerm = hasNavPermission(currentUser as Parameters<typeof hasNavPermission>[0], 'orders.fulfill');
  const canBuyLabelPerm = hasNavPermission(currentUser as Parameters<typeof hasNavPermission>[0], 'orders.buy_shipping_label');
  const canReturnPerm = hasNavPermission(currentUser as Parameters<typeof hasNavPermission>[0], 'orders.return');
  const canComment = hasNavPermission(currentUser as Parameters<typeof hasNavPermission>[0], ['orders.view', 'orders.edit']);

  const load = () => {
    setLoading(true);
    setError('');
    apiGetSellerOrderDetail(storeId, orderId)
      .then(res => setDetail(res.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load order.'))
      .finally(() => setLoading(false));
    apiListOrderPayments(storeId, orderId)
      .then(res => setPaymentRecords(res.data))
      .catch(() => setPaymentRecords([]));
  };

  useEffect(() => { if (storeId && orderId) load(); }, [storeId, orderId]);

  const changeStatus = (status: 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled', action: OrderAction) => {
    if (busy) return;
    setBusyAction(action);
    apiUpdateOrderStatus({ orderId, storeId, status })
      .then(load)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to update status.'))
      .finally(() => setBusyAction(null));
  };

  const handleMarkPaid = () => {
    if (busy) return;
    setBusyAction('paid');
    apiMarkOrderPaid(storeId, orderId)
      .then(load)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to mark as paid.'))
      .finally(() => setBusyAction(null));
  };

  // Real Stripe capture — only ever valid while paymentStatus is
  // 'authorized' (Store.paymentCaptureMethod === 'manual'). See
  // PaymentService.captureOrderPayment; auto-captures itself if the seller
  // ships/completes the order first instead of clicking this. Opens a small
  // modal instead of firing immediately — a real Stripe partial capture
  // (Shopify supports this too) needs an amount input; the backend is the
  // authority on what's actually valid to capture, this is just the entry point.
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [captureAmount, setCaptureAmount] = useState('');
  const [captureError, setCaptureError] = useState('');

  const openCaptureModal = () => {
    setCaptureAmount(detail ? String(detail.sellerOrder.subtotal) : '');
    setCaptureError('');
    setShowCaptureModal(true);
  };

  const handleCapturePayment = (full: boolean) => {
    if (busy) return;
    const amountToCapture = full ? undefined : parseFloat(captureAmount);
    if (!full && (!amountToCapture || amountToCapture <= 0)) {
      setCaptureError('Enter a valid amount.');
      return;
    }
    setBusyAction('capture');
    apiCaptureOrderPayment(orderId, amountToCapture)
      .then(() => { setShowCaptureModal(false); load(); })
      .catch((err: unknown) => setCaptureError(err instanceof Error ? err.message : 'Failed to capture payment.'))
      .finally(() => setBusyAction(null));
  };

  const handleMarkCompleted = () => {
    const so = detail!.sellerOrder;
    // A completion that skips payment collection or shipment is unusual, not
    // impossible (e.g. a merchant honoring a manual/offline settlement) — so
    // it's confirmed rather than blocked outright.
    const needsConfirm = !detail!.isPaid || (so.fulfillmentType !== 'digital' && so.status !== 'shipped' && !so.deliveredAt);
    if (needsConfirm) { setConfirmComplete(true); return; }
    changeStatus('completed', 'completed');
  };

  const handleShipmentDelivered = (shipmentId: string) => {
    if (busy) return;
    setBusyAction('shipment');
    setDeliveringShipmentId(shipmentId);
    apiMarkShipmentDelivered(storeId, orderId, shipmentId)
      .then(load)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to mark the shipment as delivered.'))
      .finally(() => { setBusyAction(null); setDeliveringShipmentId(null); });
  };

  const handleCancelOrder = () => {
    const reason = cancelReason.trim();
    if (!reason) { setCancelError('A cancellation reason is required.'); return; }
    setBusyAction('cancel');
    setCancelError('');
    apiCancelOrderAsSeller(storeId, orderId, { reason })
      .then(() => { setShowCancelModal(false); setCancelReason(''); load(); })
      .catch((err: unknown) => setCancelError(err instanceof Error ? err.message : 'Failed to cancel order.'))
      .finally(() => setBusyAction(null));
  };

  const handleRecordPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) { setPaymentError('Enter a valid amount.'); return; }
    setBusyAction('record-payment');
    setPaymentError('');
    apiRecordOrderPayment(storeId, orderId, {
      amount, method: paymentMethod,
      reference: paymentReference.trim() || undefined,
      note: paymentNote.trim() || undefined,
    })
      .then(() => { setShowRecordPaymentModal(false); setPaymentAmount(''); setPaymentReference(''); setPaymentNote(''); load(); })
      .catch((err: unknown) => setPaymentError(err instanceof Error ? err.message : 'Failed to record payment.'))
      .finally(() => setBusyAction(null));
  };

  const handleRefund = () => {
    const amount = parseFloat(refundAmount);
    if (!amount || amount <= 0) { setRefundError('Enter a valid refund amount.'); return; }
    setBusyAction('refund');
    setRefundError('');
    apiRefundOrderAsSeller(storeId, orderId, { amount, reason: refundReason.trim() || undefined, refundTo })
      .then(() => { setShowRefundModal(false); setRefundAmount(''); setRefundReason(''); load(); })
      .catch((err: unknown) => setRefundError(err instanceof Error ? err.message : 'Failed to issue refund.'))
      .finally(() => setBusyAction(null));
  };

  const handleLabelPurchased = () => { setShowLabelModal(false); load(); };

  const handlePrintSlip = () => {
    if (!detail) return;
    setSlipError('');
    const ok = openPackingSlips([toPackingSlipOrder(detail, detail.orderNumber)], store?.name ?? 'Store');
    if (!ok) setSlipError('Your browser blocked the print window — allow pop-ups for this site and try again.');
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-7 flex flex-col gap-4">
        <SkeletonBox width={240} height={22} rounded="6px" />
        <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_320px] gap-5">
          <SkeletonBox height={320} rounded="10px" />
          <SkeletonBox height={320} rounded="10px" />
        </div>
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="p-4 lg:p-7">
        <div className="bg-error-bg border border-error-border rounded-[10px] px-4 py-3 flex items-center gap-3">
          <AlertCircle size={16} className="text-error shrink-0" />
          <span className="text-[13px] text-error flex-1">{error}</span>
          <button onClick={load} className="flex items-center gap-1 text-[12px] text-error font-semibold cursor-pointer">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!detail) return null;
  const so = detail.sellerOrder;
  const isPickup    = detail.fulfillmentMethod === 'pickup';
  const shipments   = so.shipments ?? [];
  const canProcess  = so.status === 'pending';
  // Fulfilment progress (physical, non-cancelled lines): only meaningful while the sub-order can still ship.
  const shippedQty  = shippedQuantities(shipments);
  const shippableLines = so.items.filter(isShippableLine);
  const fulfilledUnits = shippableLines.reduce((n, i) => n + (FULFILLABLE.includes(so.status) ? Math.min(i.quantity, shippedQty[i._id] ?? 0) : i.quantity), 0);
  const unfulfilledUnits = shippableLines.reduce((n, i) => n + (FULFILLABLE.includes(so.status) ? Math.max(0, i.quantity - (shippedQty[i._id] ?? 0)) : 0), 0);
  // Forward-only, mirroring the backend: nothing ships once the order is shipped/delivered/completed/cancelled.
  const canShip     = !isPickup && FULFILLABLE.includes(so.status) && so.fulfillmentType !== 'digital' && unfulfilledUnits > 0;
  const canBuyLabel = canShip && shipments.length === 0;
  const canReadyForPickup = isPickup && ['pending', 'processing'].includes(so.status);
  const canMarkPickedUp   = isPickup && so.status === 'shipped';
  // Old shipped orders (no shipments[]) keep a single editable tracking record.
  const canEditLegacyTracking = !isPickup && shipments.length === 0 && ['shipped', 'delivered', 'completed'].includes(so.status) && so.fulfillmentType !== 'digital' && canFulfilPerm;
  // Return labels: approved physical lines that have no label yet.
  const returnLabelCandidates = !isPickup ? so.items.filter(i => i.type === 'physical' && i.returnStatus === 'approved' && !i.returnLabel) : [];
  const labelledReturns = so.items.filter(i => i.returnLabel);
  const canBuyReturnLabel = canBuyLabelPerm && returnLabelCandidates.length > 0;
  // Returns (Shopify flow: requested -> approved -> received -> refunded | exchanged). Exchanges can resolve any open physical line.
  const returnLines = so.items.filter(i => i.returnStatus && i.returnStatus !== 'none');
  const exchangeCandidates = so.items.filter(i => i.type === 'physical' && ['requested', 'approved', 'received'].includes(i.returnStatus) && !i.exchangeOrderId);
  const exchangedLines = so.items.filter(i => i.exchangeOrderId);
  const canCreateExchange = canReturnPerm && exchangeCandidates.length > 0 && !detail.exchangeOf;
  const canMarkDelivered  = !isPickup && so.status === 'shipped' && shipments.length === 0;
  const canComplete = so.status !== 'completed' && so.status !== 'cancelled' && so.status !== 'refunded';
  const canCancel   = so.status !== 'completed' && so.status !== 'cancelled' && so.status !== 'refunded';
  const canRefund   = detail.isPaid;
  const isEditWindow = (so.status === 'pending' || so.status === 'processing') && shipments.length === 0;

  return (
    <>
      <StorePageHeader
        title={`Order ${detail.orderNumber}`}
        subtitle={`Placed ${formatDate(detail.createdAt)}`}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate(`/store/${storeId}/orders`)}
              className="flex items-center gap-1.5 px-3.5 py-[9px] rounded-[9px] text-[12.5px] font-semibold border border-bone bg-white text-charcoal hover:bg-cream cursor-pointer transition-colors"
            >
              <ArrowLeft size={13} /> Back to Orders
            </button>
            {isPickup && so.status === 'shipped' ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cream border border-bone text-charcoal">Ready for pickup</span>
            ) : (
              <StatusBadge status={so.status} />
            )}
          </div>
        }
      />

      <div className="px-4 lg:px-7 py-5 flex flex-col gap-4">
        {error && (
          <div className="bg-error-bg border border-error-border rounded-[10px] px-4 py-3 flex items-center gap-2">
            <AlertCircle size={15} className="text-error shrink-0" />
            <span className="text-[12.5px] text-error">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
          {/* Left column */}
          <div className="flex flex-col gap-4 min-w-0">
            <Card
              title="Items"
              icon={Package}
              action={
                <div className="flex items-center gap-2">
                  {!isPickup && shippableLines.length > 0 && (
                    <>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cream border border-bone text-charcoal">Unfulfilled {unfulfilledUnits}</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cream border border-bone text-charcoal">Fulfilled {fulfilledUnits}</span>
                    </>
                  )}
                  {canEditOrder && isEditWindow && (
                    <Button size="xs" variant="outline" onClick={() => setShowEditOrder(true)} disabled={busy}>Edit</Button>
                  )}
                </div>
              }
            >
              <div className="flex flex-col">
                {so.items.map(item => (
                  <div key={item._id} className="flex items-start gap-3 py-3 border-b border-bone last:border-b-0">
                    <div className="w-12 h-12 rounded-lg bg-cream border border-bone shrink-0 flex items-center justify-center overflow-hidden">
                      {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <Package size={18} className="text-slate" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-charcoal truncate">{item.name}</p>
                      <p className="text-[11px] text-slate mt-0.5">
                        {item.options.length > 0 ? item.options.map(o => `${o.name}: ${o.value}`).join(' · ') + ' · ' : ''}
                        {item.sku ? `SKU: ${item.sku} · ` : ''}Qty: {item.quantity}
                        {!isPickup && (shippedQty[item._id] ?? 0) > 0 ? ` · ${Math.min(item.quantity, shippedQty[item._id])} shipped` : ''}
                      </p>
                      {item.cancelReason && <p className="text-[11px] text-error mt-0.5">Cancelled — {item.cancelReason}</p>}
                      {item.returnStatus !== 'none' && <p className="text-[11px] text-warning mt-0.5">Return: {item.returnStatus.replace(/_/g, ' ')}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-bold text-charcoal">{symbol}{item.totalPrice.toLocaleString()}</p>
                      <div className="mt-1"><StatusBadge status={item.status} size="sm" /></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 mt-1 border-t border-bone">
                <span className="text-[12.5px] font-semibold text-charcoal">Subtotal (this store)</span>
                <span className="text-[14px] font-bold text-charcoal">{symbol}{so.subtotal.toLocaleString()}</span>
              </div>
            </Card>

            {!isPickup && shipments.length > 0 && (
              <Card title={`Shipments (${shipments.length})`} icon={Truck}>
                <div className="flex flex-col gap-3">
                  {shipments.map((sh, idx) => (
                    <div key={sh._id} className="border border-bone rounded-[10px] px-4 py-3">
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <p className="text-[12.5px] font-bold text-charcoal">Shipment #{idx + 1}</p>
                        {sh.deliveredAt ? (
                          <span className="text-[11px] font-semibold text-success">Delivered {formatDate(sh.deliveredAt)}</span>
                        ) : (
                          <Button
                            size="xs" variant="outline"
                            onClick={() => handleShipmentDelivered(sh._id)}
                            loading={busyAction === 'shipment' && deliveringShipmentId === sh._id}
                            disabled={busy && deliveringShipmentId !== sh._id}
                          >
                            <CheckCheck size={12} /> Mark delivered
                          </Button>
                        )}
                      </div>
                      <ul className="text-[12px] text-charcoal mb-2">
                        {sh.items.map(l => (
                          <li key={l.itemId}>{l.quantity} × {so.items.find(i => i._id === l.itemId)?.name ?? 'Item'}</li>
                        ))}
                      </ul>
                      {sh.tracking && (sh.tracking.carrier || sh.tracking.trackingNumber) ? (
                        <>
                          <InfoRow label="Carrier" value={sh.tracking.carrier} />
                          <InfoRow label="Tracking Number" value={sh.tracking.trackingNumber} />
                          {sh.tracking.trackingUrl && (
                            <InfoRow label="Tracking Link" value={<a href={sh.tracking.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-brand-orange underline">Open link</a>} />
                          )}
                          {sh.tracking.labelUrl && (
                            <InfoRow label="Shipping Label" value={<a href={sh.tracking.labelUrl} target="_blank" rel="noopener noreferrer" className="text-brand-orange underline">Print label</a>} />
                          )}
                        </>
                      ) : (
                        <p className="text-[11.5px] text-slate">No tracking information.</p>
                      )}
                      <InfoRow label="Shipped At" value={formatDate(sh.shippedAt)} />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {!isPickup && shipments.length === 0 && so.tracking && (so.tracking.carrier || so.tracking.trackingNumber) && (
              <Card
                title="Tracking"
                icon={Truck}
                action={canEditLegacyTracking ? (
                  <Button size="xs" variant="outline" onClick={() => setShowEditTracking(true)} disabled={busy}><Pencil size={12} /> Edit tracking</Button>
                ) : undefined}
              >
                <InfoRow label="Carrier" value={so.tracking.carrier} />
                <InfoRow label="Tracking Number" value={so.tracking.trackingNumber} />
                {so.tracking.labelUrl && (
                  <InfoRow label="Shipping Label" value={<a href={so.tracking.labelUrl} target="_blank" rel="noopener noreferrer" className="text-brand-orange underline">Print label</a>} />
                )}
                {so.tracking.labelCost != null && (
                  <InfoRow label="Label Cost" value={`${currencySymbol(so.tracking.labelCurrency ?? undefined)}${so.tracking.labelCost.toFixed(2)}`} />
                )}
                {so.tracking.trackingUrl && (
                  <InfoRow label="Tracking Link" value={<a href={so.tracking.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-brand-orange underline">Open link</a>} />
                )}
                <InfoRow label="Shipped At" value={formatDate(so.shippedAt)} />
                {so.deliveredAt && <InfoRow label="Delivered At" value={formatDate(so.deliveredAt)} />}
              </Card>
            )}

            {(returnLines.length > 0 || returnLabelCandidates.length > 0 || labelledReturns.length > 0 || exchangedLines.length > 0 || detail.exchangeOf) && (
              <Card title="Returns" icon={RotateCcw}>
                {detail.exchangeOf && (
                  <div className="mb-3">
                    <p className="text-[12px] text-slate">Exchange order for</p>
                    <button type="button" onClick={() => navigate(`/store/${storeId}/orders/detail/${detail.exchangeOf?.orderId}`)} className="text-[12.5px] text-brand-orange underline cursor-pointer">
                      Order {detail.exchangeOf.orderNumber}
                    </button>
                  </div>
                )}
                <ReturnLinesPanel
                  storeId={storeId}
                  orderId={orderId}
                  orderNumber={detail.orderNumber}
                  isPaid={detail.isPaid}
                  lines={returnLines}
                  canAct={canReturnPerm}
                  busy={busy}
                  canExchange={canCreateExchange}
                  onChanged={load}
                  onExchange={ids => { setExchangeIds(ids); setShowExchange(true); }}
                />
                {exchangedLines.map(i => (
                  <div key={`ex-${i._id}`} className="mb-2 text-[12.5px] text-charcoal">
                    {i.name} × {i.quantity} — exchanged for{' '}
                    <button type="button" onClick={() => navigate(`/store/${storeId}/orders/detail/${i.exchangeOrderId}`)} className="text-brand-orange underline cursor-pointer">
                      order {i.exchangeOrderNumber ?? ''}
                    </button>
                  </div>
                ))}
                {returnLabelCandidates.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[12px] text-slate mb-2">Approved returns — buy a prepaid return label (customer address to your store) and the customer is emailed it.</p>
                    <div className="flex flex-col gap-1.5 mb-2.5">
                      {returnLabelCandidates.map(i => (
                        <label key={i._id} className="flex items-center gap-2 text-[12.5px] text-charcoal cursor-pointer">
                          <input
                            type="checkbox"
                            checked={returnPick.includes(i._id)}
                            onChange={e => setReturnPick(p => e.target.checked ? [...p, i._id] : p.filter(x => x !== i._id))}
                            disabled={busy}
                          />
                          <span className="truncate">{i.name} × {i.quantity}</span>
                        </label>
                      ))}
                    </div>
                    {canBuyReturnLabel && (
                      <Button size="xs" variant="outline" disabled={busy || returnPick.length === 0} onClick={() => setShowReturnLabel(true)}>
                        <RotateCcw size={12} /> Buy return label
                      </Button>
                    )}
                  </div>
                )}
                {labelledReturns.map(i => (
                  <div key={i._id} className="border-t border-bone pt-2 mt-2 first:border-t-0 first:pt-0 first:mt-0">
                    <p className="text-[12.5px] font-semibold text-charcoal">{i.name}</p>
                    <InfoRow label="Carrier" value={i.returnLabel?.carrier} />
                    <InfoRow label="Tracking Number" value={i.returnLabel?.trackingNumber} />
                    {i.returnLabel?.labelUrl && (
                      <InfoRow label="Return Label" value={<a href={i.returnLabel.labelUrl} target="_blank" rel="noopener noreferrer" className="text-brand-orange underline">Print label</a>} />
                    )}
                    {i.returnLabel?.cost != null && (
                      <InfoRow label="Label Cost" value={`${currencySymbol(i.returnLabel.currency ?? undefined)}${i.returnLabel.cost.toFixed(2)}`} />
                    )}
                  </div>
                ))}
              </Card>
            )}

            <OrderTimelineCard
              storeId={storeId}
              orderId={orderId}
              entries={detail.timeline ?? []}
              currentUserId={currentUserId}
              canComment={canComment}
              onPosted={entry => setDetail(d => d ? { ...d, timeline: [entry, ...(d.timeline ?? [])] } : d)}
            />
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-4">
            <Card title="Customer" icon={User}>
              <InfoRow label="Name" value={detail.buyer.name} />
              <InfoRow label="Email" value={detail.buyer.email} />
              {detail.buyer.phone && <InfoRow label="Phone" value={detail.buyer.phone} />}
            </Card>

            {isPickup && (
              <Card title="Pickup location" icon={StoreIcon}>
                {detail.pickupLocation ? (
                  <p className="text-[12.5px] text-charcoal leading-relaxed">
                    {detail.pickupLocation.name && <strong>{detail.pickupLocation.name}<br /></strong>}
                    {detail.pickupLocation.address && <>{detail.pickupLocation.address}<br /></>}
                    {detail.pickupLocation.instructions && <span className="text-slate">{detail.pickupLocation.instructions}</span>}
                  </p>
                ) : (
                  <p className="text-[12px] text-slate">No pickup location recorded.</p>
                )}
                {so.pickupReadyAt && <p className="text-[11px] text-slate mt-2">Ready since {formatDate(so.pickupReadyAt)}</p>}
              </Card>
            )}

            {!isPickup && detail.shippingAddress && (
              <Card
                title="Shipping Address"
                icon={MapPin}
                action={canEditOrder && isEditWindow ? (
                  <button onClick={() => setShowEditAddress(true)} className="text-[12px] font-semibold text-brand-orange hover:underline cursor-pointer">Edit</button>
                ) : undefined}
              >
                <p className="text-[12.5px] text-charcoal leading-relaxed">
                  {detail.shippingAddress.recipientName}<br />
                  {detail.shippingAddress.addressLine1}
                  {detail.shippingAddress.addressLine2 ? `, ${detail.shippingAddress.addressLine2}` : ''}<br />
                  {detail.shippingAddress.city}, {detail.shippingAddress.state} {detail.shippingAddress.zipCode}<br />
                  {detail.shippingAddress.phoneNumber}
                </p>
              </Card>
            )}

            <OrderNotesCard
              storeId={storeId}
              orderId={orderId}
              note={detail.note ?? ''}
              canEdit={canEditOrder}
              onSaved={note => setDetail(d => d ? { ...d, note } : d)}
            />

            <Card title="Payment" icon={CreditCard}>
              <InfoRow label="Method" value={<span className="capitalize">{detail.paymentType.replace(/_/g, ' ')}</span>} />
              <InfoRow label="Status" value={<StatusBadge status={detail.paymentStatus} size="sm" />} />
              <InfoRow label="Currency" value={detail.currency} />
              {detail.paidAt && <InfoRow label="Paid At" value={formatDate(detail.paidAt)} />}
              {detail.paymentStatus === 'authorized' && (
                <p className="text-[11px] text-slate mt-2 leading-[1.4]">
                  Card authorized, not yet charged — capture it below, or it auto-captures the moment you mark this order shipped/completed.
                </p>
              )}
              {paymentRecords.length > 0 && (
                <div className="mt-3 pt-3 border-t border-bone">
                  <p className="text-[11px] font-bold text-charcoal uppercase tracking-[0.05em] mb-2">Payment History</p>
                  <div className="flex flex-col gap-2">
                    {paymentRecords.map(p => (
                      <div key={p._id} className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-charcoal capitalize">{p.method.replace(/_/g, ' ')}</p>
                          <p className="text-[11px] text-slate">
                            {formatDate(p.createdAt)}{p.reference ? ` · Ref: ${p.reference}` : ''}
                          </p>
                          {p.note && <p className="text-[11px] text-slate mt-0.5">{p.note}</p>}
                        </div>
                        <p className="text-[12.5px] font-bold text-charcoal shrink-0">{symbol}{p.amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card title="Actions">
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline" onClick={handlePrintSlip} disabled={busy}>
                  <Printer size={13} /> Print packing slip
                </Button>
                {slipError && <p role="alert" className="text-[11.5px] text-error">{slipError}</p>}
                {detail.paymentStatus === 'authorized' && (
                  <Button size="sm" onClick={openCaptureModal} disabled={busy}>
                    <CreditCard size={13} /> Capture Payment
                  </Button>
                )}
                {!detail.isPaid && detail.paymentStatus !== 'authorized' && (
                  <Button size="sm" variant="outline" onClick={handleMarkPaid} loading={busyAction === 'paid'} disabled={busy && busyAction !== 'paid'}>
                    <CheckCheck size={13} /> Mark as Paid (full amount)
                  </Button>
                )}
                {!detail.isPaid && detail.paymentStatus !== 'authorized' && (
                  <Button
                    size="sm" variant="outline"
                    onClick={() => { setPaymentAmount(''); setPaymentMethod('cash'); setPaymentReference(''); setPaymentNote(''); setPaymentError(''); setShowRecordPaymentModal(true); }}
                    disabled={busy}
                  >
                    <CreditCard size={13} /> Record a Payment
                  </Button>
                )}
                {canProcess && (
                  <Button size="sm" variant="outline" onClick={() => changeStatus('processing', 'processing')} loading={busyAction === 'processing'} disabled={busy && busyAction !== 'processing'}>
                    <RefreshCw size={13} /> Mark Processing
                  </Button>
                )}
                {canShip && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => setShowFulfil(true)}>
                    <Truck size={13} /> Fulfil items
                  </Button>
                )}
                {canBuyLabel && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => setShowLabelModal(true)}>
                    <Package size={13} /> Buy shipping label
                  </Button>
                )}
                {canReadyForPickup && (
                  <Button size="sm" variant="outline" onClick={() => changeStatus('shipped', 'ready')} loading={busyAction === 'ready'} disabled={busy && busyAction !== 'ready'}>
                    <StoreIcon size={13} /> Mark ready for pickup
                  </Button>
                )}
                {(canMarkPickedUp || canMarkDelivered) && (
                  <Button size="sm" variant="outline" onClick={() => changeStatus('delivered', 'delivered')} loading={busyAction === 'delivered'} disabled={busy && busyAction !== 'delivered'}>
                    <CheckCheck size={13} /> {isPickup ? 'Mark as picked up' : 'Mark delivered'}
                  </Button>
                )}
                {canComplete && (
                  <Button size="sm" onClick={handleMarkCompleted} loading={busyAction === 'completed'} disabled={busy && busyAction !== 'completed'}>
                    <CheckCheck size={13} /> Mark Completed
                  </Button>
                )}
                {canRefund && (
                  <Button
                    size="sm" variant="outline"
                    onClick={() => { setRefundAmount(''); setRefundReason(''); setRefundError(''); setRefundTo('original'); setShowRefundModal(true); }}
                    disabled={busy}
                  >
                    <Undo2 size={13} /> Issue Refund
                  </Button>
                )}
                {canCancel && (
                  <Button
                    size="sm" variant="outline"
                    onClick={() => { setCancelReason(''); setCancelError(''); setShowCancelModal(true); }}
                    disabled={busy}
                    className="!text-error !border-error/30 hover:!bg-error-bg"
                  >
                    <XCircle size={13} /> Cancel Order
                  </Button>
                )}
                {!canProcess && !canShip && !canReadyForPickup && !canMarkPickedUp && !canMarkDelivered && !canComplete && !canCancel && !canRefund && detail.isPaid && (
                  <p className="text-[12px] text-slate">No further actions available for this order.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {showLabelModal && (
        <BuyShippingLabelModal
          storeId={storeId}
          orderId={orderId}
          orderNumber={detail.orderNumber}
          onClose={() => setShowLabelModal(false)}
          onPurchased={handleLabelPurchased}
        />
      )}

      {showEditTracking && (
        <EditTrackingModal
          storeId={storeId}
          orderId={orderId}
          initial={so.tracking}
          onClose={() => setShowEditTracking(false)}
          onSaved={() => { setShowEditTracking(false); load(); }}
        />
      )}

      {showReturnLabel && (
        <ReturnLabelModal
          storeId={storeId}
          orderId={orderId}
          orderNumber={detail.orderNumber}
          itemIds={returnPick}
          itemNames={so.items.filter(i => returnPick.includes(i._id)).map(i => i.name)}
          onClose={() => setShowReturnLabel(false)}
          onPurchased={() => { setShowReturnLabel(false); setReturnPick([]); load(); }}
        />
      )}

      {showFulfil && (
        <FulfilItemsModal
          storeId={storeId}
          orderId={orderId}
          orderNumber={detail.orderNumber}
          items={so.items}
          shipments={shipments}
          onClose={() => setShowFulfil(false)}
          onFulfilled={() => { setShowFulfil(false); load(); }}
        />
      )}

      {showCaptureModal && detail && (
        <Modal
          title={`Capture Payment — ${detail.orderNumber}`}
          onClose={() => { if (!busy) setShowCaptureModal(false); }}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setShowCaptureModal(false)} disabled={busy}>Cancel</Button>
              <Button size="sm" onClick={() => handleCapturePayment(false)} loading={busyAction === 'capture'} disabled={busy}>
                Capture {currencySymbol(detail.currency)}{captureAmount || '0'}
              </Button>
            </>
          }
        >
          {captureError && <p className="text-[12px] text-error mb-3">{captureError}</p>}
          <p className="text-[12.5px] text-slate mb-4">
            The card is authorized but hasn't been charged yet. Capture the full amount, or a lesser amount if part of the order can't be fulfilled — the rest is released back to the buyer automatically.
          </p>
          <Field label="Amount to capture" hint={`Authorized amount: ${currencySymbol(detail.currency)}${detail.sellerOrder.subtotal.toFixed(2)}`}>
            <Input type="number" value={captureAmount} onChange={e => setCaptureAmount(e.target.value)} disabled={busy} />
          </Field>
          <button
            type="button"
            onClick={() => handleCapturePayment(true)}
            disabled={busy}
            className="text-[12px] text-brand-orange hover:underline bg-transparent border-none cursor-pointer p-0 mt-1"
          >
            Capture full authorized amount instead
          </button>
        </Modal>
      )}

      {showCancelModal && (
        <Modal
          title={`Cancel ${detail.orderNumber}`}
          onClose={() => { if (!busy) setShowCancelModal(false); }}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setShowCancelModal(false)} disabled={busy}>Keep Order</Button>
              <Button size="sm" onClick={handleCancelOrder} loading={busyAction === 'cancel'} disabled={busy}>
                Confirm Cancellation
              </Button>
            </>
          }
        >
          {cancelError && <p className="text-[12px] text-error mb-3">{cancelError}</p>}
          <p className="text-[12.5px] text-slate mb-4">
            This cancels every item on your store's part of this order, restores stock, and issues a real refund to the customer's original payment method. This cannot be undone.
          </p>
          <Field label="Cancellation reason" required error={cancelError && !cancelReason.trim() ? cancelError : undefined}>
            <Input placeholder="e.g. Out of stock, customer request" value={cancelReason} onChange={e => setCancelReason(e.target.value)} disabled={busy} />
          </Field>
        </Modal>
      )}

      {showRecordPaymentModal && (
        <Modal
          title={`Record a Payment — ${detail.orderNumber}`}
          onClose={() => { if (!busy) setShowRecordPaymentModal(false); }}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setShowRecordPaymentModal(false)} disabled={busy}>Cancel</Button>
              <Button size="sm" onClick={handleRecordPayment} loading={busyAction === 'record-payment'} disabled={busy}>
                Record Payment
              </Button>
            </>
          }
        >
          {paymentError && <p className="text-[12px] text-error mb-3">{paymentError}</p>}
          <p className="text-[12.5px] text-slate mb-4">
            Records a manually-collected payment (cash, bank transfer, etc.) against this order. Partial amounts are supported — the order is automatically marked fully paid once the total recorded reaches {symbol}{detail.sellerOrder.subtotal.toFixed(2)}.
          </p>
          <Field label="Amount" required>
            <Input type="number" placeholder="0.00" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} disabled={busy} />
          </Field>
          <Field label="Payment method" required>
            <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as 'cash' | 'bank_transfer' | 'other')} disabled={busy}>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Reference" hint="Optional — transaction/receipt number.">
            <Input value={paymentReference} onChange={e => setPaymentReference(e.target.value)} disabled={busy} />
          </Field>
          <Field label="Note" hint="Optional.">
            <Input value={paymentNote} onChange={e => setPaymentNote(e.target.value)} disabled={busy} />
          </Field>
        </Modal>
      )}

      {showEditOrder && (
        <EditOrderModal
          storeId={storeId}
          orderId={orderId}
          orderNumber={detail.orderNumber}
          items={so.items}
          symbol={symbol}
          isPaid={detail.isPaid}
          onClose={() => setShowEditOrder(false)}
          onSaved={() => { setShowEditOrder(false); load(); }}
        />
      )}

      {showExchange && (
        <ExchangeModal
          storeId={storeId}
          orderId={orderId}
          orderNumber={detail.orderNumber}
          lines={exchangeCandidates.filter(i => exchangeIds.length === 0 || exchangeIds.includes(i._id))}
          symbol={symbol}
          isPaid={detail.isPaid}
          onClose={() => { setShowExchange(false); setExchangeIds([]); }}
          onDone={() => { setShowExchange(false); setExchangeIds([]); load(); }}
        />
      )}

      {showEditAddress && detail.shippingAddress && (
        <EditShippingAddressModal
          storeId={storeId}
          orderId={orderId}
          address={detail.shippingAddress}
          onClose={() => setShowEditAddress(false)}
          onSaved={() => { setShowEditAddress(false); load(); }}
        />
      )}

      {showRefundModal && (
        <Modal
          title={`Issue Refund — ${detail.orderNumber}`}
          onClose={() => { if (!busy) setShowRefundModal(false); }}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setShowRefundModal(false)} disabled={busy}>Cancel</Button>
              <Button size="sm" onClick={handleRefund} loading={busyAction === 'refund'} disabled={busy}>
                Issue Refund
              </Button>
            </>
          }
        >
          {refundError && <p className="text-[12px] text-error mb-3">{refundError}</p>}
          <p className="text-[12.5px] text-slate mb-4">
            {refundTo === 'store_credit'
              ? 'Customer gets spendable credit in your store; no card refund is made. This doesn\'t cancel or change any items on the order.'
              : 'Refunds this amount to the customer\'s original payment method and debits your store balance. This doesn\'t cancel or change any items on the order.'}
          </p>
          <Field label="Refund to">
            <Select value={refundTo} onChange={e => setRefundTo(e.target.value as 'original' | 'store_credit')} disabled={busy}>
              <option value="original">Original payment method</option>
              <option value="store_credit">Store credit</option>
            </Select>
          </Field>
          <Field label="Refund amount" required>
            <Input type="number" placeholder="0.00" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} disabled={busy} />
          </Field>
          <Field label="Reason" hint="Optional — shown in your activity log.">
            <Input placeholder="e.g. Goodwill credit, price adjustment" value={refundReason} onChange={e => setRefundReason(e.target.value)} disabled={busy} />
          </Field>
        </Modal>
      )}

      {confirmComplete && (
        <ConfirmDialog
          title="Complete this order?"
          message={`${!detail.isPaid ? 'This order has not been marked as paid yet. ' : ''}${so.fulfillmentType !== 'digital' && so.status !== 'shipped' && !so.deliveredAt ? 'It has not been marked as shipped yet. ' : ''}Completing it now will close the order out of its normal workflow. This cannot be undone.`}
          confirmLabel="Complete Order"
          loading={busyAction === 'completed'}
          onConfirm={() => { setConfirmComplete(false); changeStatus('completed', 'completed'); }}
          onCancel={() => setConfirmComplete(false)}
        />
      )}
    </>
  );
}

export default StoreOrderDetail;
