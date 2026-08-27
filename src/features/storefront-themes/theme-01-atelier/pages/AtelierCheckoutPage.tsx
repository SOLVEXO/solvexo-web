import { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
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
import { currencySymbol, fmt2 } from '@/utils/currency';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { AtelierButton } from '../components/AtelierButton';
import { atelierTheme as t } from '../theme.config';

const EMPTY_ADDR: AddressPayload = {
  label: 'Home', recipientName: '', phoneNumber: '',
  addressLine1: '', addressLine2: '', state: '', city: '', zipCode: '', isDefault: true,
};

const inputStyle = { fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.ink, border: `1px solid ${t.colors.border}`, padding: '10px 12px', width: '100%', outline: 'none' as const, background: '#FFFFFF' };

function SectionCard({ step, title, done, children }: { step: number; title: string; done?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${t.colors.border}` }}>
      <div className="flex items-center gap-2.5" style={{ padding: '16px 20px', borderBottom: `1px solid ${t.colors.border}` }}>
        <span
          className="flex items-center justify-center shrink-0"
          style={{ width: '24px', height: '24px', borderRadius: '50%', background: done ? t.colors.success : t.colors.ink, color: '#FFFFFF', fontSize: '11px', fontWeight: 700 }}
        >
          {done ? <CheckCircle2 size={13} /> : step}
        </span>
        <p style={{ fontFamily: t.fonts.display, fontSize: '15px', fontWeight: 600, color: t.colors.ink }}>{title}</p>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

/** Theme 01's own checkout — same real backend flow as the legacy
 *  `StorefrontCheckoutPage` (address, shipping zones, coupon/gift-card,
 *  Stripe or Cash on Delivery, payment-status polling) — the commerce logic
 *  is legitimate shared infra and is NOT reimplemented, only its
 *  presentation. Also fixes a real bug carried in the legacy page: the
 *  shipping zone price was hardcoded to display "PKR" regardless of the
 *  store's actual checkout currency. */
export function AtelierCheckoutPage() {
  usePageTitle('Checkout');
  const navigate = useNavigate();
  // Computed once per render rather than early-returning before the hooks
  // below — an early return here would violate the Rules of Hooks (every
  // hook in this component must run unconditionally on every render).
  const loggedIn = TokenStorage.isLoggedIn();

  const { store } = useStorefront();
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
    if (!loggedIn || isDigital) { setAddrLoading(false); return; }
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
  }, [isDigital, loggedIn]);

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
    if (!loggedIn || !readyToCreateCheckout || checkout || creatingCheckout) return;
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
      setCouponMsg(`Applied — you saved ${currencySymbol(checkout.currency)}${fmt2(res.data.couponDiscountUSD)}.`);
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
      setGiftCardMsg(`Applied — ${currencySymbol(checkout.currency)}${fmt2(res.data.giftCardDiscountUSD)} used.`);
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
  const currency = checkout?.currency ?? store.baseCurrency ?? 'USD';
  const symbol = currencySymbol(currency);

  if (!loggedIn) {
    return <Navigate to={`/login?redirect=${encodeURIComponent('/checkout')}`} replace />;
  }

  if (placedOrders) {
    return (
      <div className="mx-auto text-center" style={{ maxWidth: '560px', padding: '72px 20px' }}>
        <div className="flex items-center justify-center mx-auto" style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#E5EFE8', marginBottom: '20px' }}>
          <CheckCircle2 size={28} style={{ color: t.colors.success }} />
        </div>
        <h1 style={{ fontFamily: t.fonts.display, fontSize: '24px', fontWeight: 600, color: t.colors.ink, marginBottom: '8px' }}>Thank you for your order!</h1>
        <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.inkMuted, marginBottom: '28px' }}>Your order at {store.name} has been placed successfully.</p>
        <div style={{ border: `1px solid ${t.colors.border}`, marginBottom: '32px', textAlign: 'left' }}>
          {placedOrders.map((o, i) => (
            <div key={o.orderId} className="flex justify-between items-center" style={{ padding: '14px 18px', borderTop: i > 0 ? `1px solid ${t.colors.border}` : undefined, fontSize: '13px' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: t.colors.accent }}>{o.orderNumber}</span>
              <span style={{ fontFamily: t.fonts.body, color: t.colors.inkMuted }}>{currencySymbol(o.currency)}{fmt2(o.summary.total)}</span>
            </div>
          ))}
        </div>
        <AtelierButton onClick={() => navigate('/')}>Continue Shopping <ChevronRight size={14} style={{ marginLeft: '4px' }} /></AtelierButton>
      </div>
    );
  }

  return (
    <main className="mx-auto atelier-form" style={{ maxWidth: t.layout.maxWidth, padding: `48px ${t.layout.containerPadX}` }}>
      <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 600, color: t.colors.ink, marginBottom: '28px' }}>Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
        <div className="flex flex-col gap-5">
          {!isDigital && (
            <SectionCard step={1} title="Delivery Address" done={!!selectedAddrId && !addingAddr}>
              {addrLoading ? (
                <Loader2 size={16} className="animate-spin" style={{ color: t.colors.inkMuted }} />
              ) : addingAddr ? (
                <div className="flex flex-col gap-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input style={inputStyle} placeholder="Recipient name" value={newAddr.recipientName} onChange={e => setNewAddr(a => ({ ...a, recipientName: e.target.value }))} />
                    <input style={inputStyle} placeholder="Phone number" value={newAddr.phoneNumber} onChange={e => setNewAddr(a => ({ ...a, phoneNumber: e.target.value }))} />
                  </div>
                  <input style={inputStyle} placeholder="Address line 1" value={newAddr.addressLine1} onChange={e => setNewAddr(a => ({ ...a, addressLine1: e.target.value }))} />
                  <input style={inputStyle} placeholder="Address line 2 (optional)" value={newAddr.addressLine2 ?? ''} onChange={e => setNewAddr(a => ({ ...a, addressLine2: e.target.value }))} />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input style={inputStyle} placeholder="City" value={newAddr.city} onChange={e => setNewAddr(a => ({ ...a, city: e.target.value }))} />
                    <input style={inputStyle} placeholder="State/Province" value={newAddr.state} onChange={e => setNewAddr(a => ({ ...a, state: e.target.value }))} />
                    <input style={inputStyle} placeholder="Zip code" value={newAddr.zipCode} onChange={e => setNewAddr(a => ({ ...a, zipCode: e.target.value }))} />
                  </div>
                  {addrError && <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.danger }}>{addrError}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    <AtelierButton onClick={handleAddAddress} loading={savingAddr}>Save Address</AtelierButton>
                    {addresses.length > 0 && (
                      <button type="button" onClick={() => setAddingAddr(false)} className="bg-transparent border-0 cursor-pointer" style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted }}>Cancel</button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {addresses.map(a => (
                    <label
                      key={a._id}
                      className="flex items-start gap-3 cursor-pointer"
                      style={{ padding: '12px 14px', border: `1px solid ${selectedAddrId === a._id ? t.colors.ink : t.colors.border}` }}
                    >
                      <input
                        type="radio" className="mt-1" checked={selectedAddrId === a._id} onChange={() => setSelectedAddrId(a._id)}
                        aria-label={`${a.recipientName}, ${a.addressLine1}, ${a.city}`}
                      />
                      <div style={{ fontFamily: t.fonts.body, fontSize: '12.5px' }}>
                        <p style={{ fontWeight: 600, color: t.colors.ink }}>{a.recipientName} · {a.phoneNumber}</p>
                        <p style={{ color: t.colors.inkMuted }}>{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}, {a.city}, {a.state} {a.zipCode}</p>
                      </div>
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAddingAddr(true)}
                    className="flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                    style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 600, color: t.colors.accent }}
                  >
                    <Plus size={13} /> Add a new address
                  </button>
                </div>
              )}
            </SectionCard>
          )}

          {!isDigital && (
            <SectionCard step={2} title="Shipping Method" done={!!selectedZoneId}>
              {zonesLoading ? (
                <Loader2 size={16} className="animate-spin" style={{ color: t.colors.inkMuted }} />
              ) : effectiveZones.length === 0 ? (
                <p style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.inkMuted }}>No shipping methods are available yet.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {effectiveZones.map(z => (
                    <label
                      key={z._id}
                      className="flex items-center justify-between gap-2.5 cursor-pointer"
                      style={{ padding: '12px 14px', border: `1px solid ${selectedZoneId === z._id ? t.colors.ink : t.colors.border}` }}
                    >
                      <span className="flex items-center gap-2" style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.ink }}>
                        <input type="radio" checked={selectedZoneId === z._id} onChange={() => setSelectedZoneId(z._id)} />
                        <Truck size={14} style={{ color: t.colors.inkMuted }} /> {z.city}, {z.province}
                        {z.estimatedDeliveryTime && <span style={{ color: t.colors.inkMuted }}>· {z.estimatedDeliveryTime}</span>}
                      </span>
                      <span style={{ fontFamily: t.fonts.body, fontSize: '12.5px', fontWeight: 600, color: t.colors.ink }}>{symbol}{fmt2(z.shippingPrice)}</span>
                    </label>
                  ))}
                </div>
              )}
            </SectionCard>
          )}

          <SectionCard step={isDigital ? 1 : 3} title="Payment Method">
            {checkoutError ? (
              <div className="flex items-start gap-2" style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.danger, border: `1px solid ${t.colors.danger}`, padding: '10px 12px' }}>
                <AlertCircle size={13} className="mt-[1px] shrink-0" /> {checkoutError}
              </div>
            ) : creatingCheckout || !checkout ? (
              <Loader2 size={16} className="animate-spin" style={{ color: t.colors.inkMuted }} />
            ) : allowedMethods.length === 0 ? (
              <p style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.inkMuted }}>No payment methods are available for this order yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {allowedMethods.length > 1 && (
                  <div className="flex flex-col gap-2.5">
                    {allowedMethods.map(m => (
                      <label
                        key={m}
                        className="flex items-center gap-2.5 cursor-pointer"
                        style={{ padding: '12px 14px', border: `1px solid ${selectedMethod === m ? t.colors.ink : t.colors.border}` }}
                      >
                        <input type="radio" checked={selectedMethod === m} onChange={() => setSelectedMethod(m)} />
                        {m === 'stripe' ? <CreditCard size={15} style={{ color: t.colors.inkMuted }} /> : <Banknote size={15} style={{ color: t.colors.inkMuted }} />}
                        <span style={{ fontFamily: t.fonts.body, fontSize: '12.5px', fontWeight: 500, color: t.colors.ink }}>{m === 'stripe' ? 'Credit / Debit Card' : 'Cash on Delivery'}</span>
                      </label>
                    ))}
                  </div>
                )}

                {placeError && (
                  <div className="flex items-start gap-2" style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.danger, border: `1px solid ${t.colors.danger}`, padding: '10px 12px' }}>
                    <AlertCircle size={13} className="mt-[1px] shrink-0" /> {placeError}
                  </div>
                )}

                {selectedMethod === 'stripe' && (
                  !isStripeConfigured() ? (
                    <p style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.inkMuted }}>Card payments aren't configured for this store yet.</p>
                  ) : polling ? (
                    <div className="flex flex-col items-center gap-2 text-center" style={{ padding: '24px 0' }}>
                      <Loader2 size={20} className="animate-spin" style={{ color: t.colors.accent }} />
                      <p style={{ fontFamily: t.fonts.body, fontSize: '13px', fontWeight: 500, color: t.colors.ink }}>Confirming your payment…</p>
                    </div>
                  ) : initiating || !clientSecret ? (
                    <Loader2 size={16} className="animate-spin" style={{ color: t.colors.inkMuted }} />
                  ) : initiateErr ? (
                    <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.danger }}>{initiateErr}</p>
                  ) : (
                    <StripeCardPayment clientSecret={clientSecret} amount={chargeAmount ?? total} currency={currency} onConfirmed={handleStripeConfirmed} />
                  )
                )}

                {selectedMethod === 'cash_on_delivery' && (
                  <AtelierButton style={{ width: '100%', justifyContent: 'center' }} loading={placing} onClick={handlePlaceCod}>
                    {!placing && <PackageCheck size={14} style={{ marginRight: '4px' }} />}
                    {placing ? 'Placing order…' : 'Place Order'}
                  </AtelierButton>
                )}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="flex flex-col gap-4" style={{ border: `1px solid ${t.colors.border}`, padding: '22px' }}>
          <p style={{ fontFamily: t.fonts.display, fontSize: '16px', fontWeight: 600, color: t.colors.ink }}>Order Summary</p>
          <div className="flex flex-col gap-2">
            {cartItems.map(item => (
              <div key={item.productVariantId} className="flex justify-between gap-2" style={{ fontFamily: t.fonts.body, fontSize: '12.5px' }}>
                <span className="truncate" style={{ color: t.colors.inkMuted }}>{item.name} ×{item.quantity}</span>
                <span className="shrink-0" style={{ color: t.colors.ink }}>{currencySymbol(item.currency)}{fmt2(item.itemTotal ?? (item.unitPrice ?? item.price ?? 0) * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div style={{ height: '1px', background: t.colors.border }} />
          <div className="flex flex-col gap-2" style={{ fontFamily: t.fonts.body, fontSize: '12.5px' }}>
            <div className="flex justify-between"><span style={{ color: t.colors.inkMuted }}>Subtotal</span><span style={{ color: t.colors.ink }}>{symbol}{fmt2(orderSubtotal)}</span></div>
            {!isDigital && <div className="flex justify-between"><span style={{ color: t.colors.inkMuted }}>Shipping</span><span style={{ color: t.colors.ink }}>{symbol}{fmt2(shipping)}</span></div>}
            {tax > 0 && <div className="flex justify-between"><span style={{ color: t.colors.inkMuted }}>Tax</span><span style={{ color: t.colors.ink }}>{symbol}{fmt2(tax)}</span></div>}
            {couponDiscount > 0 && <div className="flex justify-between"><span style={{ color: t.colors.inkMuted }}>Coupon</span><span style={{ color: t.colors.success }}>-{symbol}{fmt2(couponDiscount)}</span></div>}
            {giftCardDiscount > 0 && <div className="flex justify-between"><span style={{ color: t.colors.inkMuted }}>Gift card</span><span style={{ color: t.colors.success }}>-{symbol}{fmt2(giftCardDiscount)}</span></div>}
          </div>

          {checkout && (
            <div className="flex flex-col gap-2.5 pt-1">
              {checkout.couponCode ? (
                <div className="flex items-center justify-between" style={{ fontFamily: t.fonts.body, fontSize: '11.5px' }}>
                  <span style={{ color: t.colors.ink }}>Coupon <strong>{checkout.couponCode}</strong> applied</span>
                  <button type="button" onClick={handleRemoveCoupon} disabled={couponBusy} className="bg-transparent border-0 cursor-pointer" style={{ color: t.colors.danger }}>Remove</button>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <input style={inputStyle} placeholder="Coupon code" value={couponInput} onChange={e => setCouponInput(e.target.value)} />
                  <button type="button" onClick={handleApplyCoupon} disabled={couponBusy || !couponInput.trim()} className="shrink-0 cursor-pointer bg-transparent" style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 600, padding: '0 14px', border: `1px solid ${t.colors.border}`, color: t.colors.ink }}>Apply</button>
                </div>
              )}
              {couponMsg && <p style={{ fontFamily: t.fonts.body, fontSize: '11px', color: t.colors.inkMuted }}>{couponMsg}</p>}

              {checkout.giftCardCode ? (
                <div className="flex items-center justify-between" style={{ fontFamily: t.fonts.body, fontSize: '11.5px' }}>
                  <span style={{ color: t.colors.ink }}>Gift card <strong>{checkout.giftCardCode}</strong> applied</span>
                  <button type="button" onClick={handleRemoveGiftCard} disabled={giftCardBusy} className="bg-transparent border-0 cursor-pointer" style={{ color: t.colors.danger }}>Remove</button>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <input style={inputStyle} placeholder="Gift card code" value={giftCardInput} onChange={e => setGiftCardInput(e.target.value)} />
                  <button type="button" onClick={handleApplyGiftCard} disabled={giftCardBusy || !giftCardInput.trim()} className="shrink-0 cursor-pointer bg-transparent" style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 600, padding: '0 14px', border: `1px solid ${t.colors.border}`, color: t.colors.ink }}>Apply</button>
                </div>
              )}
              {giftCardMsg && <p style={{ fontFamily: t.fonts.body, fontSize: '11px', color: t.colors.inkMuted }}>{giftCardMsg}</p>}
            </div>
          )}

          <div style={{ height: '1px', background: t.colors.border }} />
          <div className="flex justify-between items-baseline">
            <span style={{ fontFamily: t.fonts.body, fontSize: '15px', color: t.colors.ink }}>Total</span>
            <span style={{ fontFamily: t.fonts.display, fontSize: '20px', fontWeight: 600, color: t.colors.ink }}>{symbol}{fmt2(total)}</span>
          </div>
          <p className="flex items-center gap-1" style={{ fontFamily: t.fonts.body, fontSize: '11px', color: t.colors.inkMuted }}>
            <MapPin size={11} /> {cartCount} item{cartCount !== 1 ? 's' : ''} from {store.name}
          </p>
        </div>
      </div>
    </main>
  );
}
