import { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  MapPin, Truck, CreditCard, Banknote, Loader2, AlertCircle,
  CheckCircle2, PackageCheck, ChevronRight, Plus,
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useCartContext } from '@/contexts/CartContext';
import { TokenStorage } from '@/api/services/auth';
import { useShippingZones } from '@/hooks/shipping/useShippingZones';
import { apiGetMyAddresses, apiAddAddress, type Address, type AddressPayload } from '@/api/services/address';
import {
  apiCreateCheckout, apiApplyCoupon, apiRemoveCoupon, apiApplyGiftCard, apiRemoveGiftCard,
  type Checkout, type CheckoutSummary,
} from '@/api/services/checkout';
import { apiPlaceCodOrder, apiInitiatePayment, apiGetPaymentStatus, type PlacedOrder } from '@/api/services/payment';
import { StripeCardPayment, isStripeConfigured } from '@/features/buyer/components/StripeCardPayment';
import { currencySymbol } from '@/utils/currency';
import { useStorefront } from './StorefrontContext';
import { ThemedButton } from './ThemedButton';

const inp = 'w-full px-3 py-2.5 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white';
const EMPTY_ADDR: AddressPayload = {
  label: 'Home', recipientName: '', phoneNumber: '',
  addressLine1: '', addressLine2: '', state: '', city: '', zipCode: '', isDefault: true,
};

function SectionCard({ step, title, done, children }: { step: number; title: string; done?: boolean; children: React.ReactNode }) {
  const { cfg } = useStorefront();
  return (
    <div className="bg-white rounded-xl border border-bone overflow-hidden">
      <div className="px-5 py-3.5 border-b border-bone flex items-center gap-2.5">
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
          style={{ background: done ? '#16a34a' : cfg.primaryColor, color: '#fff' }}
        >
          {done ? <CheckCircle2 size={13} /> : step}
        </span>
        <p className="text-[14px] font-bold" style={{ color: cfg.textColor }}>{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// A real, functioning checkout scoped to this one store — deliberately
// leaner than the marketplace `CheckoutPage.tsx` (no split payment, no
// manual bank-transfer upload flow, no multi-step wizard chrome): Stripe
// card and Cash on Delivery cover the golden path end-to-end using the same
// backend checkout/payment endpoints, which is what actually matters for a
// buyer completing a real purchase on a seller's own subdomain.
export function StorefrontCheckoutPage() {
  usePageTitle('Checkout');
  const navigate = useNavigate();

  if (!TokenStorage.isLoggedIn()) {
    return <Navigate to={`/login?redirect=${encodeURIComponent('/checkout')}`} replace />;
  }

  const { cfg, store } = useStorefront();
  const { cart, cartCount, clearCart } = useCartContext();
  const cartItems = cart?.items ?? [];
  const isDigital = cartItems.length > 0 && cartItems.every(i => i.type === 'digital');

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null);
  const [addingAddr, setAddingAddr] = useState(false);
  const [newAddr, setNewAddr] = useState<AddressPayload>(EMPTY_ADDR);
  const [savingAddr, setSavingAddr] = useState(false);
  const [addrError, setAddrError] = useState('');

  const { zones, loading: zonesLoading } = useShippingZones();
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [allowedMethods, setAllowedMethods] = useState<('stripe' | 'cash_on_delivery')[]>([]);
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const [couponInput, setCouponInput] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponMsg, setCouponMsg] = useState('');
  const [giftCardInput, setGiftCardInput] = useState('');
  const [giftCardBusy, setGiftCardBusy] = useState(false);
  const [giftCardMsg, setGiftCardMsg] = useState('');

  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'cash_on_delivery' | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [chargeAmount, setChargeAmount] = useState<number | null>(null);
  const [initiating, setInitiating] = useState(false);
  const [initiateErr, setInitiateErr] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState('');
  const [polling, setPolling] = useState(false);
  const [placedOrders, setPlacedOrders] = useState<PlacedOrder[] | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isDigital) { setAddrLoading(false); return; }
    let cancelled = false;
    apiGetMyAddresses()
      .then(res => {
        if (cancelled) return;
        const list = res.data ?? [];
        setAddresses(list);
        const def = list.find(a => a.isDefault) ?? list[0] ?? null;
        setSelectedAddrId(def?._id ?? null);
        if (list.length === 0) setAddingAddr(true);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setAddrLoading(false); });
    return () => { cancelled = true; };
  }, [isDigital]);

  const selectedAddr = addresses.find(a => a._id === selectedAddrId) ?? null;
  const matchingZones = selectedAddr
    ? zones.filter(z => z.city.toLowerCase() === selectedAddr.city.toLowerCase() || z.province.toLowerCase() === selectedAddr.state.toLowerCase())
    : zones;
  const effectiveZones = matchingZones.length > 0 ? matchingZones : zones;
  useEffect(() => {
    if (!selectedZoneId && effectiveZones.length > 0) setSelectedZoneId(effectiveZones[0]._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveZones.length, selectedAddrId]);

  const readyToCreateCheckout = isDigital || (!!selectedAddrId && !!selectedZoneId);

  useEffect(() => {
    if (!readyToCreateCheckout || checkout || creatingCheckout) return;
    setCreatingCheckout(true);
    setCheckoutError('');
    apiCreateCheckout({
      addressId: isDigital ? undefined : (selectedAddrId ?? undefined),
      shippingZoneId: isDigital ? undefined : (selectedZoneId ?? undefined),
      storeId: cart?.storeId,
    })
      .then(res => {
        setCheckout(res.data.checkout);
        setSummary(res.data.summary);
        const methods = (res.data.allowedPaymentMethods ?? []).filter((m): m is 'stripe' | 'cash_on_delivery' => m === 'stripe' || m === 'cash_on_delivery');
        setAllowedMethods(isDigital ? methods.filter(m => m === 'stripe') : methods);
      })
      .catch(err => setCheckoutError(err instanceof Error ? err.message : 'Failed to initialize checkout.'))
      .finally(() => setCreatingCheckout(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToCreateCheckout, selectedAddrId, selectedZoneId]);

  // Re-create the checkout if the buyer changes address/shipping after one
  // already exists (a fresh id/shipping combo needs a fresh Checkout doc).
  useEffect(() => {
    if (checkout) { setCheckout(null); setSummary(null); setSelectedMethod(null); setClientSecret(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddrId, selectedZoneId]);

  useEffect(() => {
    if (allowedMethods.length === 1) setSelectedMethod(allowedMethods[0]);
  }, [allowedMethods]);

  useEffect(() => {
    if (selectedMethod !== 'stripe' || !checkout || !isStripeConfigured() || clientSecret) return;
    let cancelled = false;
    setInitiating(true);
    setInitiateErr('');
    apiInitiatePayment({ checkoutId: checkout._id, paymentMode: 'full' })
      .then(res => { if (!cancelled) { setClientSecret(res.data.clientSecret); setChargeAmount(res.data.amount); } })
      .catch(err => { if (!cancelled) setInitiateErr(err instanceof Error ? err.message : 'Failed to start card payment.'); })
      .finally(() => { if (!cancelled) setInitiating(false); });
    return () => { cancelled = true; };
  }, [selectedMethod, checkout, clientSecret]);

  useEffect(() => () => { if (pollTimer.current) clearTimeout(pollTimer.current); }, []);

  const handleAddAddress = async () => {
    if (!newAddr.recipientName || !newAddr.phoneNumber || !newAddr.addressLine1 || !newAddr.city || !newAddr.state || !newAddr.zipCode) {
      setAddrError('Please fill in every field.');
      return;
    }
    setSavingAddr(true);
    setAddrError('');
    try {
      const res = await apiAddAddress(newAddr);
      setAddresses(prev => [...prev, res.data]);
      setSelectedAddrId(res.data._id);
      setAddingAddr(false);
      setNewAddr(EMPTY_ADDR);
    } catch (err) {
      setAddrError(err instanceof Error ? err.message : 'Failed to save address.');
    } finally {
      setSavingAddr(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!checkout || !couponInput.trim()) return;
    setCouponBusy(true); setCouponMsg('');
    try {
      const res = await apiApplyCoupon({ checkoutId: checkout._id, code: couponInput.trim() });
      setCheckout(c => c && { ...c, couponCode: res.data.couponCode, couponDiscountUSD: res.data.couponDiscountUSD, totalAmount: res.data.totalAmount });
      setCouponMsg(`Applied — you saved ${currencySymbol(checkout.currency)}${res.data.couponDiscountUSD.toFixed(2)}.`);
      setCouponInput('');
    } catch (err) {
      setCouponMsg(err instanceof Error ? err.message : 'Invalid coupon code.');
    } finally { setCouponBusy(false); }
  };

  const handleRemoveCoupon = async () => {
    if (!checkout) return;
    setCouponBusy(true);
    try {
      const res = await apiRemoveCoupon(checkout._id);
      setCheckout(c => c && { ...c, couponCode: null, couponDiscountUSD: 0, giftCardCode: null, giftCardDiscountUSD: 0, totalAmount: res.data.totalAmount });
      setCouponMsg('');
    } finally { setCouponBusy(false); }
  };

  const handleApplyGiftCard = async () => {
    if (!checkout || !giftCardInput.trim()) return;
    setGiftCardBusy(true); setGiftCardMsg('');
    try {
      const res = await apiApplyGiftCard({ checkoutId: checkout._id, code: giftCardInput.trim() });
      setCheckout(c => c && { ...c, giftCardCode: res.data.giftCardCode, giftCardDiscountUSD: res.data.giftCardDiscountUSD, totalAmount: res.data.totalAmount });
      setGiftCardMsg(`Applied — ${currencySymbol(checkout.currency)}${res.data.giftCardDiscountUSD.toFixed(2)} used.`);
      setGiftCardInput('');
    } catch (err) {
      setGiftCardMsg(err instanceof Error ? err.message : 'Invalid gift card code.');
    } finally { setGiftCardBusy(false); }
  };

  const handleRemoveGiftCard = async () => {
    if (!checkout) return;
    setGiftCardBusy(true);
    try {
      const res = await apiRemoveGiftCard(checkout._id);
      setCheckout(c => c && { ...c, giftCardCode: null, giftCardDiscountUSD: 0, couponCode: null, couponDiscountUSD: 0, totalAmount: res.data.totalAmount });
      setGiftCardMsg('');
    } finally { setGiftCardBusy(false); }
  };

  const handleStripeConfirmed = () => {
    if (!checkout) return;
    setPolling(true);
    setPlaceError('');
    let stopped = false;
    const poll = async () => {
      if (stopped) return;
      try {
        const res = await apiGetPaymentStatus(checkout._id);
        if (stopped) return;
        if (res.data.status === 'completed') {
          setPolling(false);
          await clearCart();
          setPlacedOrders(res.data.orders);
          return;
        }
        if (res.data.status === 'failed') {
          setPolling(false);
          setPlaceError('Payment could not be confirmed. Please try again.');
          return;
        }
      } catch { /* transient — keep polling */ }
      if (!stopped) pollTimer.current = setTimeout(poll, 1500);
    };
    poll();
    setTimeout(() => {
      if (!stopped) { stopped = true; if (pollTimer.current) clearTimeout(pollTimer.current); setPolling(false); setPlaceError('Your payment was received and is being confirmed — check your orders in a moment.'); }
    }, 30_000);
  };

  const handlePlaceCod = async () => {
    if (!checkout || selectedMethod !== 'cash_on_delivery') return;
    setPlacing(true); setPlaceError('');
    try {
      const res = await apiPlaceCodOrder({ checkoutId: checkout._id });
      await clearCart();
      setPlacedOrders(res.data.orders);
    } catch (err) {
      setPlaceError(err instanceof Error ? err.message : 'Failed to place order.');
    } finally { setPlacing(false); }
  };

  const orderSubtotal = checkout ? checkout.items.reduce((s, i) => s + i.totalPrice, 0) : cartItems.reduce((s, i) => s + (i.itemTotal ?? (i.unitPrice ?? i.price ?? 0) * i.quantity), 0);
  const shipping = summary?.shippingFee ?? 0;
  const tax = summary?.taxAmount ?? 0;
  const couponDiscount = checkout?.couponDiscountUSD ?? 0;
  const giftCardDiscount = checkout?.giftCardDiscountUSD ?? 0;
  const total = Math.max(0, orderSubtotal + (isDigital ? 0 : shipping) + tax - couponDiscount - giftCardDiscount);
  const currency = checkout?.currency ?? 'USD';

  if (placedOrders) {
    return (
      <div className="max-w-[560px] mx-auto px-4 py-14 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: '#dcfce7' }}>
          <CheckCircle2 size={28} className="text-[#16a34a]" />
        </div>
        <h1 className="text-[20px] font-bold mb-2" style={{ color: cfg.textColor }}>Thank you for your order!</h1>
        <p className="text-[13px] text-slate mb-6">Your order at {store.name} has been placed successfully.</p>
        <div className="bg-white border border-bone rounded-[10px] divide-y divide-bone text-left mb-8">
          {placedOrders.map(o => (
            <div key={o.orderId} className="flex justify-between items-center px-4 py-3 text-[13px]">
              <span className="font-mono font-semibold" style={{ color: cfg.primaryColor }}>{o.orderNumber}</span>
              <span className="text-slate">{currencySymbol(o.currency)}{o.summary.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <ThemedButton onClick={() => navigate('/')}>Continue Shopping <ChevronRight size={14} className="inline ml-1" /></ThemedButton>
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto px-4 md:px-6 py-6 md:py-8">
      <h1 className="text-[20px] font-bold mb-5" style={{ color: cfg.textColor }}>Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        <div className="flex flex-col gap-4">
          {!isDigital && (
            <SectionCard step={1} title="Delivery Address" done={!!selectedAddrId && !addingAddr}>
              {addrLoading ? (
                <Loader2 size={16} className="animate-spin text-slate" />
              ) : addingAddr ? (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input className={inp} placeholder="Recipient name" value={newAddr.recipientName} onChange={e => setNewAddr(a => ({ ...a, recipientName: e.target.value }))} />
                    <input className={inp} placeholder="Phone number" value={newAddr.phoneNumber} onChange={e => setNewAddr(a => ({ ...a, phoneNumber: e.target.value }))} />
                  </div>
                  <input className={inp} placeholder="Address line 1" value={newAddr.addressLine1} onChange={e => setNewAddr(a => ({ ...a, addressLine1: e.target.value }))} />
                  <input className={inp} placeholder="Address line 2 (optional)" value={newAddr.addressLine2 ?? ''} onChange={e => setNewAddr(a => ({ ...a, addressLine2: e.target.value }))} />
                  <div className="grid grid-cols-3 gap-2">
                    <input className={inp} placeholder="City" value={newAddr.city} onChange={e => setNewAddr(a => ({ ...a, city: e.target.value }))} />
                    <input className={inp} placeholder="State/Province" value={newAddr.state} onChange={e => setNewAddr(a => ({ ...a, state: e.target.value }))} />
                    <input className={inp} placeholder="Zip code" value={newAddr.zipCode} onChange={e => setNewAddr(a => ({ ...a, zipCode: e.target.value }))} />
                  </div>
                  {addrError && <p className="text-[12px] text-error">{addrError}</p>}
                  <div className="flex gap-2 mt-1">
                    <ThemedButton onClick={handleAddAddress}>{savingAddr ? <Loader2 size={13} className="animate-spin" /> : 'Save Address'}</ThemedButton>
                    {addresses.length > 0 && (
                      <button type="button" onClick={() => setAddingAddr(false)} className="text-[12px] text-slate bg-transparent border-none cursor-pointer">Cancel</button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {addresses.map(a => (
                    <label key={a._id} className={clsx('flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer', selectedAddrId === a._id ? 'border-2' : 'border-bone')}
                      style={selectedAddrId === a._id ? { borderColor: cfg.primaryColor, background: `${cfg.primaryColor}0A` } : undefined}>
                      <input type="radio" className="mt-1" checked={selectedAddrId === a._id} onChange={() => setSelectedAddrId(a._id)} />
                      <div className="text-[12.5px]">
                        <p className="font-semibold" style={{ color: cfg.textColor }}>{a.recipientName} · {a.phoneNumber}</p>
                        <p className="text-slate">{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}, {a.city}, {a.state} {a.zipCode}</p>
                      </div>
                    </label>
                  ))}
                  <button type="button" onClick={() => setAddingAddr(true)} className="text-[12px] font-semibold flex items-center gap-1 bg-transparent border-none cursor-pointer" style={{ color: cfg.primaryColor }}>
                    <Plus size={13} /> Add a new address
                  </button>
                </div>
              )}
            </SectionCard>
          )}

          {!isDigital && (
            <SectionCard step={2} title="Shipping Method" done={!!selectedZoneId}>
              {zonesLoading ? (
                <Loader2 size={16} className="animate-spin text-slate" />
              ) : effectiveZones.length === 0 ? (
                <p className="text-[12.5px] text-slate">No shipping methods are available yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {effectiveZones.map(z => (
                    <label key={z._id} className={clsx('flex items-center justify-between gap-2.5 p-3 rounded-lg border cursor-pointer', selectedZoneId === z._id ? 'border-2' : 'border-bone')}
                      style={selectedZoneId === z._id ? { borderColor: cfg.primaryColor, background: `${cfg.primaryColor}0A` } : undefined}>
                      <span className="flex items-center gap-2 text-[12.5px]" style={{ color: cfg.textColor }}>
                        <input type="radio" checked={selectedZoneId === z._id} onChange={() => setSelectedZoneId(z._id)} />
                        <Truck size={14} className="text-slate" /> {z.city}, {z.province}
                        {z.estimatedDeliveryTime && <span className="text-slate">· {z.estimatedDeliveryTime}</span>}
                      </span>
                      <span className="text-[12.5px] font-semibold" style={{ color: cfg.textColor }}>PKR {z.shippingPrice}</span>
                    </label>
                  ))}
                </div>
              )}
            </SectionCard>
          )}

          <SectionCard step={isDigital ? 1 : 3} title="Payment Method">
            {checkoutError ? (
              <div className="flex items-start gap-2 text-[12px] text-error bg-error-bg border border-error-border rounded-[8px] px-3 py-2">
                <AlertCircle size={13} className="mt-[1px] shrink-0" /> {checkoutError}
              </div>
            ) : creatingCheckout || !checkout ? (
              <Loader2 size={16} className="animate-spin text-slate" />
            ) : allowedMethods.length === 0 ? (
              <p className="text-[12.5px] text-slate">No payment methods are available for this order yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {allowedMethods.length > 1 && (
                  <div className="flex flex-col gap-2">
                    {allowedMethods.map(m => (
                      <label key={m} className={clsx('flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer', selectedMethod === m ? 'border-2' : 'border-bone')}
                        style={selectedMethod === m ? { borderColor: cfg.primaryColor, background: `${cfg.primaryColor}0A` } : undefined}>
                        <input type="radio" checked={selectedMethod === m} onChange={() => setSelectedMethod(m)} />
                        {m === 'stripe' ? <CreditCard size={15} className="text-slate" /> : <Banknote size={15} className="text-slate" />}
                        <span className="text-[12.5px] font-medium" style={{ color: cfg.textColor }}>{m === 'stripe' ? 'Credit / Debit Card' : 'Cash on Delivery'}</span>
                      </label>
                    ))}
                  </div>
                )}

                {placeError && (
                  <div className="flex items-start gap-2 text-[12px] text-error bg-error-bg border border-error-border rounded-[8px] px-3 py-2">
                    <AlertCircle size={13} className="mt-[1px] shrink-0" /> {placeError}
                  </div>
                )}

                {selectedMethod === 'stripe' && (
                  !isStripeConfigured() ? (
                    <p className="text-[12.5px] text-slate">Card payments aren't configured for this store yet.</p>
                  ) : polling ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                      <Loader2 size={20} className="animate-spin" style={{ color: cfg.primaryColor }} />
                      <p className="text-[13px] font-medium" style={{ color: cfg.textColor }}>Confirming your payment…</p>
                    </div>
                  ) : initiating || !clientSecret ? (
                    <Loader2 size={16} className="animate-spin text-slate" />
                  ) : initiateErr ? (
                    <p className="text-[12px] text-error">{initiateErr}</p>
                  ) : (
                    <StripeCardPayment clientSecret={clientSecret} amount={chargeAmount ?? total} currency={currency} onConfirmed={handleStripeConfirmed} />
                  )
                )}

                {selectedMethod === 'cash_on_delivery' && (
                  <ThemedButton className="w-full text-center flex items-center justify-center gap-2" onClick={handlePlaceCod}>
                    {placing ? <Loader2 size={13} className="animate-spin" /> : <PackageCheck size={14} />}
                    {placing ? 'Placing order…' : 'Place Order'}
                  </ThemedButton>
                )}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="bg-white rounded-xl border border-bone p-5 lg:sticky top-20 flex flex-col gap-4">
          <p className="text-[14px] font-bold" style={{ color: cfg.textColor }}>Order Summary</p>
          <div className="flex flex-col gap-1.5">
            {cartItems.map(item => (
              <div key={item.productVariantId} className="flex justify-between text-[12px] gap-2">
                <span className="truncate" style={{ color: cfg.textColor }}>{item.name}<span className="text-slate ml-1">×{item.quantity}</span></span>
                <span className="font-medium shrink-0" style={{ color: cfg.textColor }}>{currencySymbol(item.currency)}{(item.itemTotal ?? (item.unitPrice ?? item.price ?? 0) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="h-px bg-bone" />
          <div className="flex flex-col gap-1.5 text-[12px]">
            <div className="flex justify-between"><span className="text-slate">Subtotal</span><span style={{ color: cfg.textColor }}>{currencySymbol(currency)}{orderSubtotal.toFixed(2)}</span></div>
            {!isDigital && <div className="flex justify-between"><span className="text-slate">Shipping</span><span style={{ color: cfg.textColor }}>{currencySymbol(currency)}{shipping.toFixed(2)}</span></div>}
            {tax > 0 && <div className="flex justify-between"><span className="text-slate">Tax</span><span style={{ color: cfg.textColor }}>{currencySymbol(currency)}{tax.toFixed(2)}</span></div>}
            {couponDiscount > 0 && <div className="flex justify-between"><span className="text-slate">Coupon</span><span className="text-[#16a34a]">-{currencySymbol(currency)}{couponDiscount.toFixed(2)}</span></div>}
            {giftCardDiscount > 0 && <div className="flex justify-between"><span className="text-slate">Gift card</span><span className="text-[#16a34a]">-{currencySymbol(currency)}{giftCardDiscount.toFixed(2)}</span></div>}
          </div>

          {checkout && (
            <div className="flex flex-col gap-2 pt-1">
              {checkout.couponCode ? (
                <div className="flex items-center justify-between text-[11.5px]">
                  <span style={{ color: cfg.textColor }}>Coupon <strong>{checkout.couponCode}</strong> applied</span>
                  <button type="button" onClick={handleRemoveCoupon} disabled={couponBusy} className="text-error bg-transparent border-none cursor-pointer">Remove</button>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <input className={inp} placeholder="Coupon code" value={couponInput} onChange={e => setCouponInput(e.target.value)} />
                  <button type="button" onClick={handleApplyCoupon} disabled={couponBusy || !couponInput.trim()} className="text-[12px] font-semibold px-3 rounded-lg border border-bone bg-transparent cursor-pointer shrink-0">Apply</button>
                </div>
              )}
              {couponMsg && <p className="text-[11px] text-slate">{couponMsg}</p>}

              {checkout.giftCardCode ? (
                <div className="flex items-center justify-between text-[11.5px]">
                  <span style={{ color: cfg.textColor }}>Gift card <strong>{checkout.giftCardCode}</strong> applied</span>
                  <button type="button" onClick={handleRemoveGiftCard} disabled={giftCardBusy} className="text-error bg-transparent border-none cursor-pointer">Remove</button>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <input className={inp} placeholder="Gift card code" value={giftCardInput} onChange={e => setGiftCardInput(e.target.value)} />
                  <button type="button" onClick={handleApplyGiftCard} disabled={giftCardBusy || !giftCardInput.trim()} className="text-[12px] font-semibold px-3 rounded-lg border border-bone bg-transparent cursor-pointer shrink-0">Apply</button>
                </div>
              )}
              {giftCardMsg && <p className="text-[11px] text-slate">{giftCardMsg}</p>}
            </div>
          )}

          <div className="h-px bg-bone" />
          <div className="flex justify-between text-[16px] font-bold">
            <span style={{ color: cfg.textColor }}>Total</span>
            <span style={{ color: cfg.textColor }}>{currencySymbol(currency)}{total.toFixed(2)}</span>
          </div>
          <p className="flex items-center gap-1 text-[11px] text-slate"><MapPin size={11} /> {cartCount} item{cartCount !== 1 ? 's' : ''} from {store.name}</p>
        </div>
      </div>
    </div>
  );
}
