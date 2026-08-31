import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Package, MapPin, User, CreditCard, Truck, AlertCircle,
  CheckCheck, RefreshCw,
} from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import {
  apiGetSellerOrderDetail,
  type SellerOrderDetail,
} from '@/api/services/product';
import { apiMarkOrderPaid, apiUpdateOrderStatus } from '@/api/services/orders';
import {
  SkeletonBox, StatusBadge, Button, Modal, Field, Input,
} from '@/components/comman/ui';
import { currencySymbol } from '@/utils/currency';
import { ConfirmDialog } from '@/features/seller/store/Dashboard/OnlineStore/builder/ConfirmDialog';

type OrderAction = 'paid' | 'processing' | 'shipping' | 'completed' | null;

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

  const load = () => {
    setLoading(true);
    setError('');
    apiGetSellerOrderDetail(storeId, orderId)
      .then(res => setDetail(res.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load order.'))
      .finally(() => setLoading(false));
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
            </Card>

            <Card title="Actions">
              <div className="flex flex-col gap-2">
                {!detail.isPaid && (
                  <Button size="sm" variant="outline" onClick={handleMarkPaid} loading={busyAction === 'paid'} disabled={busy && busyAction !== 'paid'}>
                    <CheckCheck size={13} /> Mark as Paid
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
                {!canProcess && !canShip && !canComplete && detail.isPaid && (
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
          <p className="text-[12.5px] text-slate mb-4">Add the shipment's tracking details so the customer can follow their delivery.</p>
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
