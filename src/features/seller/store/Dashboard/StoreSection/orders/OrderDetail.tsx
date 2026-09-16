import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Package, MapPin, User, CreditCard, Truck, AlertCircle,
  CheckCheck, RefreshCw, XCircle, Undo2,
} from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import {
  apiGetSellerOrderDetail,
  type SellerOrderDetail,
} from '@/api/services/product';
import {
  apiMarkOrderPaid, apiUpdateOrderStatus, apiPurchaseShippingLabel, apiCancelOrderAsSeller, apiRefundOrderAsSeller,
  apiRecordOrderPayment, apiListOrderPayments, type OrderPaymentRecordRow,
} from '@/api/services/orders';
import { apiCaptureOrderPayment } from '@/api/services/payment';
import {
  SkeletonBox, StatusBadge, Button, Modal, Field, Input, Select,
} from '@/components/comman/ui';
import { currencySymbol } from '@/utils/currency';
import { ConfirmDialog } from '@/features/seller/store/Dashboard/OnlineStore/builder/ConfirmDialog';

type OrderAction = 'paid' | 'processing' | 'shipping' | 'completed' | 'capture' | 'cancel' | 'refund' | 'record-payment' | null;

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function Card({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: ReactNode }) {
  return (
    <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-bone flex items-center gap-2">
        {Icon && <Icon size={14} className="text-brand-orange shrink-0" />}
        <p className="text-[12px] font-bold text-charcoal uppercase tracking-[0.06em]">{title}</p>
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

  const [showShipModal, setShowShipModal] = useState(false);
  const [trackingForm, setTrackingForm] = useState({ carrier: '', trackingNumber: '', trackingUrl: '' });
  const [trackingErrors, setTrackingErrors] = useState<{ carrier?: string; trackingNumber?: string }>({});
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundError, setRefundError] = useState('');
  const [paymentRecords, setPaymentRecords] = useState<OrderPaymentRecordRow[]>([]);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'other'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentError, setPaymentError] = useState('');
  // Real one-click "buy a live carrier label" (Shippo) — a separate error
  // slot from the manual form below it, since failing here (store hasn't
  // connected Shippo, no live rate for this address, etc.) is expected to
  // happen often and should never block the always-available manual entry.
  const [liveLabelBusy, setLiveLabelBusy] = useState(false);
  const [liveLabelError, setLiveLabelError] = useState('');

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

  const changeStatus = (status: 'processing' | 'completed' | 'cancelled', action: OrderAction) => {
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
    apiMarkOrderPaid(orderId)
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

  const handleSubmitTracking = () => {
    const carrier = trackingForm.carrier.trim();
    const trackingNumber = trackingForm.trackingNumber.trim();
    const errors: { carrier?: string; trackingNumber?: string } = {};
    if (!carrier) errors.carrier = 'Carrier is required.';
    if (!trackingNumber) errors.trackingNumber = 'Tracking number is required.';
    if (Object.keys(errors).length) { setTrackingErrors(errors); return; }

    setBusyAction('shipping');
    apiUpdateOrderStatus({
      orderId, storeId, status: 'shipped',
      tracking: { carrier, trackingNumber, trackingUrl: trackingForm.trackingUrl.trim() },
    })
      .then(() => { setShowShipModal(false); load(); })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to mark order as shipped.'))
      .finally(() => setBusyAction(null));
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
    apiRefundOrderAsSeller(storeId, orderId, { amount, reason: refundReason.trim() || undefined })
      .then(() => { setShowRefundModal(false); setRefundAmount(''); setRefundReason(''); load(); })
      .catch((err: unknown) => setRefundError(err instanceof Error ? err.message : 'Failed to issue refund.'))
      .finally(() => setBusyAction(null));
  };

  const handlePurchaseLiveLabel = () => {
    setLiveLabelBusy(true);
    setLiveLabelError('');
    apiPurchaseShippingLabel(orderId, storeId)
      .then(() => { setShowShipModal(false); load(); })
      .catch((err: unknown) => setLiveLabelError(err instanceof Error ? err.message : 'Failed to buy a live shipping label.'))
      .finally(() => setLiveLabelBusy(false));
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-7 flex flex-col gap-4">
        <SkeletonBox width={240} height={22} rounded="6px" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
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
  const canProcess  = so.status === 'pending';
  const canShip     = so.status !== 'completed' && so.status !== 'cancelled' && so.status !== 'refunded' && !so.status.startsWith('partially_') && so.fulfillmentType !== 'digital';
  const canComplete = so.status !== 'completed' && so.status !== 'cancelled' && so.status !== 'refunded';
  const canCancel   = so.status !== 'completed' && so.status !== 'cancelled' && so.status !== 'refunded';
  const canRefund   = detail.isPaid;

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
            <StatusBadge status={so.status} />
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

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
          {/* Left column */}
          <div className="flex flex-col gap-4 min-w-0">
            <Card title="Items" icon={Package}>
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

            {so.tracking && (so.tracking.carrier || so.tracking.trackingNumber) && (
              <Card title="Tracking" icon={Truck}>
                <InfoRow label="Carrier" value={so.tracking.carrier} />
                <InfoRow label="Tracking Number" value={so.tracking.trackingNumber} />
                {so.tracking.trackingUrl && (
                  <InfoRow label="Tracking Link" value={<a href={so.tracking.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-brand-orange underline">Open link</a>} />
                )}
                <InfoRow label="Shipped At" value={formatDate(so.shippedAt)} />
                {so.deliveredAt && <InfoRow label="Delivered At" value={formatDate(so.deliveredAt)} />}
              </Card>
            )}
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-4">
            <Card title="Customer" icon={User}>
              <InfoRow label="Name" value={detail.buyer.name} />
              <InfoRow label="Email" value={detail.buyer.email} />
              {detail.buyer.phone && <InfoRow label="Phone" value={detail.buyer.phone} />}
            </Card>

            {detail.shippingAddress && (
              <Card title="Shipping Address" icon={MapPin}>
                <p className="text-[12.5px] text-charcoal leading-relaxed">
                  {detail.shippingAddress.recipientName}<br />
                  {detail.shippingAddress.addressLine1}
                  {detail.shippingAddress.addressLine2 ? `, ${detail.shippingAddress.addressLine2}` : ''}<br />
                  {detail.shippingAddress.city}, {detail.shippingAddress.state} {detail.shippingAddress.zipCode}<br />
                  {detail.shippingAddress.phoneNumber}
                </p>
              </Card>
            )}

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
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => { setTrackingForm({ carrier: '', trackingNumber: '', trackingUrl: '' }); setTrackingErrors({}); setShowShipModal(true); }}>
                    <Truck size={13} /> Mark Shipped
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
                    onClick={() => { setRefundAmount(''); setRefundReason(''); setRefundError(''); setShowRefundModal(true); }}
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
                {!canProcess && !canShip && !canComplete && !canCancel && !canRefund && detail.isPaid && (
                  <p className="text-[12px] text-slate">No further actions available for this order.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {showShipModal && (
        <Modal
          title={`Mark ${detail.orderNumber} as Shipped`}
          onClose={() => { if (!busy) setShowShipModal(false); }}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setShowShipModal(false)} disabled={busy}>Cancel</Button>
              <Button size="sm" onClick={handleSubmitTracking} loading={busyAction === 'shipping'}>Mark Shipped</Button>
            </>
          }
        >
          <div className="mb-4 pb-4 border-b border-bone">
            <p className="text-[12.5px] text-slate mb-2.5">
              Have a live carrier connected (Integrations → Shippo)? Buy a real label instantly instead of typing tracking details by hand.
            </p>
            <Button size="sm" variant="outline" onClick={handlePurchaseLiveLabel} loading={liveLabelBusy} disabled={busy}>
              Buy Live Shipping Label
            </Button>
            {liveLabelError && <p className="text-[11.5px] text-error mt-2">{liveLabelError}</p>}
          </div>
          <p className="text-[12.5px] text-slate mb-4">Or add the shipment's tracking details manually so the customer can follow their delivery.</p>
          <Field label="Carrier" required error={trackingErrors.carrier}>
            <Input placeholder="e.g. DHL, FedEx, Local Courier" value={trackingForm.carrier} onChange={e => setTrackingForm(f => ({ ...f, carrier: e.target.value }))} disabled={busy} />
          </Field>
          <Field label="Tracking Number" required error={trackingErrors.trackingNumber}>
            <Input placeholder="e.g. 1Z999AA10123456784" value={trackingForm.trackingNumber} onChange={e => setTrackingForm(f => ({ ...f, trackingNumber: e.target.value }))} disabled={busy} />
          </Field>
          <Field label="Tracking Link" hint="Optional — lets the customer open the carrier's tracking page directly.">
            <Input type="url" placeholder="https://…" value={trackingForm.trackingUrl} onChange={e => setTrackingForm(f => ({ ...f, trackingUrl: e.target.value }))} disabled={busy} />
          </Field>
        </Modal>
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
            Refunds this amount to the customer's original payment method and debits your store balance. This doesn't cancel or change any items on the order.
          </p>
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
