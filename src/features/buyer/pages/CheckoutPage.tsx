import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useCartContext } from '@/contexts/CartContext';
import { useShippingZones } from '@/hooks/shipping/useShippingZones';
import { apiGetMyAddresses, type Address } from '@/api/services/address';
import { apiCreateCheckout, apiApplyCoupon, apiRemoveCoupon, type Checkout, type CheckoutSummary, type SubscriptionSavingsHint } from '@/api/services/checkout';
import { apiPlaceCodOrder, apiInitiatePayment, apiGetPaymentStatus } from '@/api/services/payment';
import { Button } from '@/components/comman/ui/Button';
import { SkeletonBox, BuyerNavbar, Breadcrumb } from '@/components/comman/ui';
import { StripeCardPayment, isStripeConfigured } from '@/features/buyer/components/StripeCardPayment';
import {
  MapPin, Truck, CreditCard, CheckCircle2,
  ChevronRight, AlertCircle, PackageCheck,
  Banknote, ShieldCheck, ArrowDownCircle, Download, Clock, Loader2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { currencySymbol } from '@/utils/currency';

// ── Step badge ────────────────────────────────────────────────────────────────
function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={clsx(
      'w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 transition-colors',
      done ? 'bg-success text-white' :
        active ? 'bg-brand-orange text-white' :
          'bg-bone text-slate',
    )}>
      {done ? <CheckCircle2 size={14} /> : n}
    </div>
  );
}

// ── Card payment slot — shows the real Stripe form once configured, a clear
// "coming soon" notice otherwise. Never a dead-end silent button. ─────────────
function CardPaymentSlot({
  checkoutReady, clientSecret, initiating, initiateError, polling, amount, currency, onConfirmed,
}: {
  checkoutReady:  boolean;
  clientSecret:   string | null;
  initiating:     boolean;
  initiateError:  string;
  polling:        boolean;
  amount:         number;
  currency:       string;
  onConfirmed:    () => void;
}) {
  if (!isStripeConfigured()) {
    return (
      <div className="flex items-start gap-2 text-[12px] text-charcoal bg-cream border border-bone rounded-[8px] px-3 py-3">
        <Clock size={14} className="mt-[1px] flex-shrink-0 text-slate" />
        <div>
          <p className="font-semibold text-carbon mb-[2px]">Card payments are coming soon</p>
          <p className="text-slate">We're finishing setup for online card payments — please check back shortly to complete this order.</p>
        </div>
      </div>
    );
  }

  if (polling) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <Loader2 size={22} className="animate-spin text-brand-orange" />
        <p className="text-[13px] font-medium text-carbon">Confirming your payment…</p>
        <p className="text-[11px] text-slate">This only takes a moment.</p>
      </div>
    );
  }

  if (!checkoutReady || initiating) {
    return (
      <div className="flex flex-col gap-3">
        <SkeletonBox height={44} rounded="8px" />
        <SkeletonBox height={48} rounded="12px" />
      </div>
    );
  }

  if (initiateError) {
    return (
      <div className="flex items-start gap-2 text-[12px] text-error bg-error-bg border border-[#FECACA] rounded-[8px] px-3 py-2">
        <AlertCircle size={13} className="mt-[1px] flex-shrink-0" />
        {initiateError}
      </div>
    );
  }

  if (!clientSecret) return null;

  return <StripeCardPayment clientSecret={clientSecret} amount={amount} currency={currency} onConfirmed={onConfirmed} />;
}

// ── Payment method labels ─────────────────────────────────────────────────────
const PAYMENT_LABELS: Record<string, { label: string; desc: string; Icon: React.ElementType }> = {
  stripe:           { label: 'Credit / Debit Card',  desc: 'Secure payment via Stripe',       Icon: CreditCard },
  cash_on_delivery: { label: 'Cash on Delivery',     desc: 'Pay when your order arrives',     Icon: Banknote   },
};

// ── Main ──────────────────────────────────────────────────────────────────────
export function CheckoutPage() {
  usePageTitle('Checkout');
  const navigate  = useNavigate();

  const { cart, loading: cartLoading, cartCount, clearCart } = useCartContext();

  // One unified checkout for the whole cart, mixed physical+digital included
  // (Amazon/Alibaba/Shopify/Daraz all check out a mixed cart as one order —
  // splitting it into two separate checkouts was the old behavior here and
  // it under-charged the displayed total while still billing the full cart
  // server-side, since the backend was never told to filter by type).
  const cartItems  = cart?.items ?? [];
  const hasDigital = cartItems.some(i => i.type === 'digital');
  // Fully-digital carts skip address/shipping entirely; a mixed cart still
  // needs both, for its physical items — so this only means "skip the
  // shipping steps", not "no digital items in this order".
  const isDigital  = cartItems.length > 0 && cartItems.every(i => i.type === 'digital');

  // Step: 1 = address, 2 = shipping, 3 = payment
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Address dropdown open state
  const [addrDropOpen, setAddrDropOpen] = useState(false);
  const addrDropRef = useRef<HTMLDivElement>(null);
  const shippingDropRef = useRef<HTMLDivElement>(null);

  // Address
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [selectedAddr, setSelectedAddr] = useState<Address | null>(null);

  // Shipping
  const { zones, loading: zonesLoading } = useShippingZones();
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [shippingDropOpen, setShippingDropOpen] = useState(false);

  // Close either dropdown on an outside click or Escape — matches the
  // click-outside/Escape convention every other dropdown in this app follows.
  useEffect(() => {
    if (!addrDropOpen && !shippingDropOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setAddrDropOpen(false); setShippingDropOpen(false); }
    };
    const onClickOutside = (e: MouseEvent) => {
      if (addrDropOpen && addrDropRef.current && !addrDropRef.current.contains(e.target as Node)) setAddrDropOpen(false);
      if (shippingDropOpen && shippingDropRef.current && !shippingDropRef.current.contains(e.target as Node)) setShippingDropOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addrDropOpen, shippingDropOpen]);

  // Checkout creation (step 2 → 3)
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [allowedMethods, setAllowedMethods] = useState<string[]>([]);
  const [savingsHints, setSavingsHints] = useState<SubscriptionSavingsHint[]>([]);

  // Payment
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [placing,     setPlacing]     = useState(false);
  const [placeError,  setPlaceError]  = useState('');

  // Card payment (Stripe) — clientSecret drives the embedded PaymentElement form;
  // pollingStatus drives the "confirming your payment…" state after the buyer submits.
  const [clientSecret,        setClientSecret]        = useState<string | null>(null);
  const [initiatingPayment,   setInitiatingPayment]   = useState(false);
  const [initiatePaymentErr,  setInitiatePaymentErr]  = useState('');
  const [pollingStatus,       setPollingStatus]       = useState(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Coupon
  const [couponInput,   setCouponInput]   = useState('');
  const [couponBusy,    setCouponBusy]    = useState(false);
  const [couponError,   setCouponError]   = useState('');

  // Cash on Delivery can't cover a digital item — it's delivered instantly, long
  // before any cash changes hands, so a buyer could take the download and then
  // refuse the COD payment at the door. Any digital item in the order (mixed
  // or pure-digital) forces card payment for the whole order instead.
  const effectiveMethods = hasDigital
    ? allowedMethods.filter(m => m !== 'cash_on_delivery')
    : allowedMethods;

  // With no COD choice to make, card is the only option — select it automatically
  // instead of making the buyer pick a "radio group" with one item in it.
  useEffect(() => {
    if (hasDigital && effectiveMethods.includes('stripe')) setSelectedMethod('stripe');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDigital, allowedMethods.length]);

  // Fetch addresses (physical only)
  useEffect(() => {
    if (isDigital) { setAddrLoading(false); return; }
    let cancelled = false;
    apiGetMyAddresses()
      .then(res => {
        if (cancelled) return;
        setAddresses(res.data ?? []);
        const def = res.data?.find(a => a.isDefault) ?? res.data?.[0] ?? null;
        setSelectedAddr(def);
      })
      .catch(() => { })
      .finally(() => { if (!cancelled) setAddrLoading(false); });
    return () => { cancelled = true; };
  }, [isDigital]);

  // Digital: auto-create checkout (no address/shipping needed) and jump to payment
  useEffect(() => {
    if (!isDigital || checkout) return;
    let cancelled = false;
    setCreatingCheckout(true);
    setCheckoutError('');
    apiCreateCheckout({})
      .then(res => {
        if (cancelled) return;
        setCheckout(res.data.checkout);
        setSummary(res.data.summary);
        setSavingsHints(res.data.subscriptionSavingsHints ?? []);
        setAllowedMethods(res.data.allowedPaymentMethods.filter(m => m !== 'cash_on_delivery'));
        setStep(3);
      })
      .catch(err => {
        if (!cancelled) setCheckoutError(err instanceof Error ? err.message : 'Failed to initialize checkout.');
      })
      .finally(() => { if (!cancelled) setCreatingCheckout(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDigital]);

  // Card selected (forced for any-digital cart, or chosen for an all-physical one)
  // → get a Stripe clientSecret for this checkout so the PaymentElement can mount.
  useEffect(() => {
    if (selectedMethod !== 'stripe' || !checkout || clientSecret || !isStripeConfigured()) return;
    let cancelled = false;
    setInitiatingPayment(true);
    setInitiatePaymentErr('');
    apiInitiatePayment({ checkoutId: checkout._id })
      .then(res => { if (!cancelled) setClientSecret(res.data.clientSecret); })
      .catch(err => {
        if (!cancelled) setInitiatePaymentErr(err instanceof Error ? err.message : 'Failed to start card payment.');
      })
      .finally(() => { if (!cancelled) setInitiatingPayment(false); });
    return () => { cancelled = true; };
  }, [selectedMethod, checkout, clientSecret]);

  // Stop any in-flight poll on unmount (e.g. buyer navigates away mid-confirmation).
  useEffect(() => () => { if (pollTimer.current) clearTimeout(pollTimer.current); }, []);

  // Stripe confirmed the PaymentIntent client-side — the order itself is created
  // server-side (webhook, or this poll acting as a fallback for local dev / slow
  // webhook delivery). Poll until the order shows up, then hand off to Order Success.
  const handleStripeConfirmed = () => {
    if (!checkout) return;
    setPollingStatus(true);
    setPlaceError('');
    let stopped = false;
    const poll = async () => {
      if (stopped) return;
      try {
        const res = await apiGetPaymentStatus(checkout._id);
        if (stopped) return;
        if (res.data.status === 'completed') {
          setPollingStatus(false);
          await clearCart();
          navigate('/order-success', { state: { orders: res.data.orders } });
          return;
        }
        if (res.data.status === 'failed') {
          setPollingStatus(false);
          setPlaceError('Payment could not be confirmed. Please try again.');
          return;
        }
      } catch {
        // transient — keep polling, a real failure will surface via the timeout below
      }
      if (!stopped) pollTimer.current = setTimeout(poll, 1500);
    };
    poll();
    // Stop waiting after ~30s so the buyer isn't stuck on a spinner forever —
    // the payment likely succeeded (Stripe already confirmed it), it just means
    // order finalization is taking unusually long; direct them to their orders.
    setTimeout(() => {
      if (!stopped) {
        stopped = true;
        if (pollTimer.current) clearTimeout(pollTimer.current);
        setPollingStatus(false);
        setPlaceError('Your payment was received and is being confirmed — check My Orders in a moment.');
      }
    }, 30_000);
  };

  const matchingZones = selectedAddr
    ? zones.filter(z =>
      z.city.toLowerCase() === selectedAddr.city.toLowerCase() ||
      z.province.toLowerCase() === selectedAddr.state.toLowerCase()
    )
    : zones;

  const selectedZone = zones.find(z => z._id === selectedZoneId) ?? null;

  // The whole cart checks out together — one order, no more splitting by type.
  const orderSubtotal = checkout
    ? checkout.items.reduce((s, i) => s + i.totalPrice, 0)
    : cartItems.reduce((s, i) => s + (i.itemTotal ?? (i.unitPrice ?? i.price ?? 0) * i.quantity), 0);

  const shipping = summary?.shippingFee ?? selectedZone?.shippingPrice ?? 0;
  const tax      = summary?.taxAmount ?? 0;
  const couponDiscount = checkout?.couponDiscountUSD ?? 0;
  const total    = Math.max(0, orderSubtotal + (isDigital ? 0 : shipping) + tax - couponDiscount);

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function handleApplyCoupon() {
    if (!checkout || !couponInput.trim()) return;
    setCouponBusy(true);
    setCouponError('');
    try {
      const res = await apiApplyCoupon({ checkoutId: checkout._id, code: couponInput.trim() });
      setCheckout(c => c && { ...c, couponCode: res.data.couponCode, couponDiscountUSD: res.data.couponDiscountUSD, totalAmount: res.data.totalAmount });
      setCouponInput('');
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Failed to apply coupon.');
    } finally {
      setCouponBusy(false);
    }
  }

  async function handleRemoveCoupon() {
    if (!checkout) return;
    setCouponBusy(true);
    setCouponError('');
    try {
      const res = await apiRemoveCoupon(checkout._id);
      setCheckout(c => c && { ...c, couponCode: null, couponDiscountUSD: 0, totalAmount: res.data.totalAmount });
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Failed to remove coupon.');
    } finally {
      setCouponBusy(false);
    }
  }

  const selectAddress = (addr: Address) => {
    setSelectedAddr(addr);
    setSelectedZoneId(null);
    setAddrDropOpen(false);
  };

  const handleContinueToShipping = () => {
    if (selectedAddr) setStep(2);
  };

  const handleContinueToPayment = async () => {
    if (!selectedAddr || !selectedZoneId) return;
    setCreatingCheckout(true);
    setCheckoutError('');
    try {
      const res = await apiCreateCheckout({
        addressId: selectedAddr._id,
        shippingZoneId: selectedZoneId,
      });
      setCheckout(res.data.checkout);
      setSummary(res.data.summary);
      setSavingsHints(res.data.subscriptionSavingsHints ?? []);
      setAllowedMethods(res.data.allowedPaymentMethods);
      setStep(3);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Failed to create checkout. Please try again.');
    } finally {
      setCreatingCheckout(false);
    }
  };

  // Cash on Delivery only — card payment is handled by StripeCardPayment +
  // handleStripeConfirmed instead, since it has its own form/submit button.
  const handlePlaceOrder = async () => {
    if (!checkout || selectedMethod !== 'cash_on_delivery') return;
    setPlacing(true);
    setPlaceError('');
    try {
      const res = await apiPlaceCodOrder({ checkoutId: checkout._id });
      await clearCart();
      navigate('/order-success', { state: { orders: res.data.orders } });
    } catch (err) {
      setPlaceError(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <BuyerNavbar variant="minimal" backTo={{ label: 'Back to Cart', path: '/cart' }} />

      <div className="max-w-[960px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <Breadcrumb className="mb-4" items={[
          { label: 'Home', path: '/' },
          { label: 'Cart', path: '/cart' },
          { label: 'Checkout' },
        ]} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

          {/* ── Left panel ─────────────────────────────────────────────── */}
          {isDigital ? (
            /* ── Digital: single-step payment ──────────────────────────── */
            <div className="bg-white rounded-xl border border-bone overflow-hidden">

              {/* Header */}
              <div className="px-6 pt-5 pb-4 border-b border-bone flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-[2px]">
                    <h1 className="text-[20px] font-bold text-carbon leading-tight">Checkout</h1>
                    <span className="flex items-center gap-1 px-2 py-[3px] rounded-full text-[10px] font-semibold bg-[#EEF0FF] text-[#3851D1]">
                      <Download size={9} /> Digital Delivery
                    </span>
                  </div>
                  <p className="text-[12px] text-slate mt-[2px]">
                    {cartLoading ? 'Loading…' : `${cartCount} item${cartCount !== 1 ? 's' : ''} in your cart`}
                  </p>
                </div>
                <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[#EEF0FF] text-[#3851D1]">
                  Instant Delivery
                </span>
              </div>

              {/* Body */}
              <div className="p-5">
                {creatingCheckout ? (
                  <div className="flex flex-col gap-4">
                    <SkeletonBox height={40} rounded="8px" />
                    <SkeletonBox height={14} width="70%" rounded="4px" />
                    <SkeletonBox height={48} rounded="12px" />
                  </div>
                ) : checkoutError ? (
                  <div className="flex items-start gap-2 text-[12px] text-error bg-error-bg border border-[#FECACA] rounded-[8px] px-3 py-2">
                    <AlertCircle size={13} className="mt-[1px] flex-shrink-0" />
                    {checkoutError}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 bg-[#EEF0FF] border border-[#C7CEFF] rounded-[8px] px-3 py-2 mb-5">
                      <Download size={13} className="text-[#3851D1] shrink-0" />
                      <p className="text-[12px] text-[#3851D1] font-medium">
                        Digital products are delivered instantly after payment — no shipping required.
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate mb-5">
                      <ShieldCheck size={12} className="text-success" />
                      Your payment info is secure and encrypted
                    </div>

                    {placeError && (
                      <div className="flex items-start gap-2 text-[12px] text-error bg-error-bg border border-[#FECACA] rounded-[8px] px-3 py-2 mb-4">
                        <AlertCircle size={13} className="mt-[1px] flex-shrink-0" />
                        {placeError}
                      </div>
                    )}

                    <CardPaymentSlot
                      checkoutReady={!!checkout}
                      clientSecret={clientSecret}
                      initiating={initiatingPayment}
                      initiateError={initiatePaymentErr}
                      polling={pollingStatus}
                      amount={total}
                      currency={checkout?.currency ?? 'USD'}
                      onConfirmed={handleStripeConfirmed}
                    />
                  </>
                )}
              </div>
            </div>
          ) : (
            /* ── Physical: 3-step flow ──────────────────────────────────── */
            <div className="bg-white rounded-xl border border-bone overflow-hidden">

            {/* ── Card Header ───────────────────────────────────────────── */}
            <div className="px-6 pt-5 pb-4 border-b border-bone">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-[20px] font-bold text-carbon leading-tight">Checkout</h1>
                  <p className="text-[12px] text-slate mt-[2px]">
                    {cartLoading ? 'Loading…' : `${cartCount} item${cartCount !== 1 ? 's' : ''} in your cart`}
                  </p>
                </div>
                <span className={clsx(
                  'text-[11px] font-semibold px-3 py-1 rounded-full',
                  step === 3 ? 'bg-[#E3F4EA] text-[#1E7A3C]' : 'bg-brand-pale-orange text-brand-orange',
                )}>
                  Step {step} of 3
                </span>
              </div>

              {/* Progress bar */}
              <div className="relative flex justify-between items-start w-full">
                {/* background line */}
                <div className="absolute top-3 left-0 right-0 h-[2px] bg-bone rounded-full" />
                {/* filled line */}
                <div
                  className="absolute top-3 left-0 h-[2px] bg-success rounded-full transition-all duration-300"
                  style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
                />
                {([
                  { n: 1, label: 'Address' },
                  { n: 2, label: 'Shipping' },
                  { n: 3, label: 'Payment' },
                ] as const).map(({ n, label }) => (
                  <div key={n} className="relative z-10 flex flex-col items-center gap-[6px]">
                    <div className={clsx(
                      'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200',
                      step > n ? 'bg-success text-white' :
                        step === n ? 'bg-brand-orange text-white ring-4 ring-brand-pale-orange' :
                          'bg-bone text-slate',
                    )}>
                      {step > n ? <CheckCircle2 size={12} /> : n}
                    </div>
                    <span className={clsx(
                      'text-[10px] font-semibold whitespace-nowrap',
                      step === n ? 'text-brand-orange' : step > n ? 'text-[#1E7A3C]' : 'text-slate',
                    )}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1: Address */}
            <div>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-bone">
                <StepBadge n={1} active={step === 1} done={step > 1} />
                <MapPin size={16} className="text-brand-orange" />
                <span className="font-semibold text-[14px] text-carbon">Delivery Address</span>
                {step > 1 && (
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => setStep(1)}
                    className="ml-auto text-[12px] text-brand-orange font-medium cursor-pointer"
                  >
                    <ArrowDownCircle size={14} className="inline align-middle mr-1" />Change Address
                  </Button>

                )}
              </div>

              {step === 1 && (
                <div className="p-5">
                  {addrLoading ? (
                    <div className="flex flex-col gap-4">
                      <SkeletonBox height={54} rounded="10px" />
                      <SkeletonBox height={32} width={180} rounded="8px" />
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-2 text-[13px] text-slate">
                        <AlertCircle size={14} className="mt-[2px] flex-shrink-0" />
                        No saved addresses. Please add one first.
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/account/addresses')}>
                        Go to Addresses
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {/* Dropdown trigger */}
                      <div className="relative" ref={addrDropRef}>
                        <button
                          type="button"
                          onClick={() => setAddrDropOpen(o => !o)}
                          className={clsx(
                            'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-[10px] border bg-cream text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange',
                            addrDropOpen ? 'border-brand-orange ring-2 ring-brand-pale-orange' : 'border-bone hover:border-[#c5c4bc]',
                          )}
                        >
                          {selectedAddr ? (
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-[2px]">
                                <span className="text-[13px] font-semibold text-carbon">{selectedAddr.recipientName}</span>
                                <span className="text-[11px] text-slate bg-bone rounded-full px-2 py-[1px]">{selectedAddr.label}</span>
                                {selectedAddr.isDefault && (
                                  <span className="text-[11px] text-brand-orange bg-brand-pale-orange rounded-full px-2 py-[1px] font-medium">Default</span>
                                )}
                              </div>
                              <p className="text-[12px] text-slate truncate">
                                {selectedAddr.addressLine1}, {selectedAddr.city}, {selectedAddr.state} {selectedAddr.zipCode}
                              </p>
                            </div>
                          ) : (
                            <span className="text-[13px] text-slate">Select a delivery address…</span>
                          )}
                          <ChevronRight size={15} className={clsx('flex-shrink-0 text-slate transition-transform', addrDropOpen && 'rotate-90')} />
                        </button>

                        {/* Dropdown list */}
                        {addrDropOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-bone rounded-[10px] z-20 overflow-hidden">
                            {addresses.map((addr, i) => (
                              <button
                                key={addr._id}
                                type="button"
                                onClick={() => selectAddress(addr)}
                                className={clsx(
                                  'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange',
                                  i > 0 && 'border-t border-bone',
                                  selectedAddr?._id === addr._id
                                    ? 'bg-brand-pale-orange'
                                    : 'hover:bg-cream',
                                )}
                              >
                                <div className={clsx(
                                  'mt-[2px] w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                                  selectedAddr?._id === addr._id ? 'border-brand-orange' : 'border-[#C5C4BC]',
                                )}>
                                  {selectedAddr?._id === addr._id && (
                                    <div className="w-2 h-2 rounded-full bg-brand-orange" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-[2px]">
                                    <span className="text-[13px] font-semibold text-carbon">{addr.recipientName}</span>
                                    <span className="text-[11px] text-slate bg-bone rounded-full px-2 py-[1px]">{addr.label}</span>
                                    {addr.isDefault && (
                                      <span className="text-[11px] text-brand-orange bg-brand-pale-orange rounded-full px-2 py-[1px] font-medium">Default</span>
                                    )}
                                  </div>
                                  <p className="text-[12px] text-slate">{addr.phoneNumber}</p>
                                  <p className="text-[12px] text-carbon mt-[1px]">
                                    {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}, {addr.state} {addr.zipCode}
                                  </p>
                                </div>
                              </button>
                            ))}
                            <div className="border-t border-bone px-4 py-2">
                              <button
                                type="button"
                                onClick={() => navigate('/account/addresses')}
                                className="text-[12px] text-brand-orange font-medium cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
                              >
                                + Add new address
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <Button
                          variant="primary" size="sm"
                          disabled={!selectedAddr}
                          onClick={handleContinueToShipping}
                          className="gap-1"
                        >
                          Continue to Shipping <ChevronRight size={14} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step > 1 && selectedAddr && (
                <div className="px-5 py-3 text-[13px] text-carbon">
                  <span className="font-medium">{selectedAddr.recipientName}</span>
                  {' — '}
                  {selectedAddr.addressLine1}, {selectedAddr.city}, {selectedAddr.state}
                </div>
              )}
            </div>

            <div className="h-px bg-bone" />

            {/* Step 2: Shipping */}
            <div className={clsx('transition-opacity', step < 2 && 'opacity-50 pointer-events-none')}>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-bone">
                <StepBadge n={2} active={step === 2} done={step > 2} />
                <Truck size={16} className="text-brand-orange" />
                <span className="font-semibold text-[14px] text-carbon">Shipping Method</span>
                {step > 2 && (
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => setStep(2)}
                    className="ml-auto text-[12px] text-brand-orange font-medium cursor-pointer"
                  >
                    <ArrowDownCircle size={14} className="inline align-middle mr-1" />Change Shipping Method

                  </Button>
                )}
              </div>

              {step === 2 && (
                <div className="p-5">
                  {zonesLoading ? (
                    <div className="flex flex-col gap-4">
                      <SkeletonBox height={54} rounded="10px" />
                      <SkeletonBox height={32} width={180} rounded="8px" />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {/* Dropdown trigger */}
                      <div className="relative" ref={shippingDropRef}>
                        <button
                          type="button"
                          onClick={() => setShippingDropOpen(o => !o)}
                          className={clsx(
                            'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-[10px] border bg-cream text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange',
                            shippingDropOpen ? 'border-brand-orange ring-2 ring-brand-pale-orange' : 'border-bone hover:border-[#c5c4bc]',
                          )}
                        >
                          {selectedZone ? (
                            <div className="flex-1 min-w-0 flex items-center justify-between">
                              <div>
                                <p className="text-[13px] font-semibold text-carbon">
                                  {selectedZone.city}, {selectedZone.province}
                                </p>
                                <p className="text-[12px] text-slate mt-[1px]">
                                  Estimated delivery: {selectedZone.estimatedDeliveryTime}
                                </p>
                              </div>
                              <span className="text-[13px] font-bold text-carbon ml-4 flex-shrink-0">
                                {currencySymbol(checkout?.currency)} {selectedZone.shippingPrice.toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[13px] text-slate">Select a shipping method…</span>
                          )}
                          <ChevronRight size={15} className={clsx('flex-shrink-0 text-slate transition-transform ml-2', shippingDropOpen && 'rotate-90')} />
                        </button>

                        {/* Dropdown list */}
                        {shippingDropOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-bone rounded-[10px] z-20 overflow-hidden">
                            {(matchingZones.length > 0 ? matchingZones : zones).length === 0 ? (
                              <div className="px-4 py-4 text-[13px] text-slate text-center">
                                No shipping methods available for this address yet.
                              </div>
                            ) : (matchingZones.length > 0 ? matchingZones : zones).map((zone, i) => (
                              <button
                                key={zone._id}
                                type="button"
                                onClick={() => { setSelectedZoneId(zone._id); setShippingDropOpen(false); }}
                                className={clsx(
                                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange',
                                  i > 0 && 'border-t border-bone',
                                  selectedZoneId === zone._id ? 'bg-brand-pale-orange' : 'hover:bg-cream',
                                )}
                              >
                                <div className={clsx(
                                  'mt-[1px] w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                                  selectedZoneId === zone._id ? 'border-brand-orange' : 'border-[#C5C4BC]',
                                )}>
                                  {selectedZoneId === zone._id && (
                                    <div className="w-2 h-2 rounded-full bg-brand-orange" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-semibold text-carbon">
                                    {zone.city}, {zone.province}
                                  </p>
                                  <p className="text-[12px] text-slate mt-[1px]">
                                    Estimated delivery: {zone.estimatedDeliveryTime}
                                  </p>
                                </div>
                                <span className="text-[13px] font-bold text-carbon flex-shrink-0">
                                  {currencySymbol(checkout?.currency)} {zone.shippingPrice.toLocaleString()}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {checkoutError && (
                        <div className="flex items-start gap-2 text-[12px] text-error bg-error-bg border border-[#FECACA] rounded-[8px] px-3 py-2">
                          <AlertCircle size={13} className="mt-[1px] flex-shrink-0" />
                          {checkoutError}
                        </div>
                      )}

                      <div>
                        <Button
                          variant="primary" size="sm"
                          disabled={!selectedZoneId}
                          loading={creatingCheckout}
                          iconRight={!creatingCheckout && <ChevronRight size={14} />}
                          onClick={handleContinueToPayment}
                          className="gap-1"
                        >
                          {creatingCheckout ? 'Creating checkout…' : 'Continue to Payment'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step > 2 && selectedZone && (
                <div className="px-5 py-3 text-[13px] text-carbon">
                  <span className="font-medium">{selectedZone.city}, {selectedZone.province}</span>
                  {' — '}
                  {currencySymbol(checkout?.currency)} {selectedZone.shippingPrice.toLocaleString()} · {selectedZone.estimatedDeliveryTime}
                </div>
              )}
            </div>

            <div className="h-px bg-bone" />

            {/* Step 3: Payment */}
            <div className={clsx('transition-opacity', step < 3 && 'opacity-50 pointer-events-none')}>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-bone">
                <StepBadge n={3} active={step === 3} done={false} />
                <CreditCard size={16} className="text-brand-orange" />
                <span className="font-semibold text-[14px] text-carbon">Payment Method</span>
              </div>

              {step === 3 && (
                <div className="p-5">
                  {effectiveMethods.length === 0 && (
                    <div className="flex items-start gap-2 text-[12px] text-error bg-error-bg border border-[#FECACA] rounded-[8px] px-3 py-3 mb-4">
                      <AlertCircle size={13} className="mt-[1px] flex-shrink-0" />
                      No payment method is available for this order right now. Please try again shortly or contact support.
                    </div>
                  )}
                  <div className="flex flex-col gap-3 mb-4">
                    {effectiveMethods.map(method => {
                      const meta = PAYMENT_LABELS[method] ?? { label: method, desc: '', Icon: CreditCard };
                      const { label, desc, Icon } = meta;
                      const unavailable = method === 'stripe' && !isStripeConfigured();
                      return (
                        <label
                          key={method}
                          className={clsx(
                            'flex gap-3 p-4 rounded-[10px] border transition-colors',
                            unavailable
                              ? 'cursor-not-allowed opacity-60 border-bone bg-cream'
                              : selectedMethod === method
                                ? 'cursor-pointer border-brand-orange bg-brand-pale-orange'
                                : 'cursor-pointer border-bone bg-cream hover:border-[#c5c4bc]',
                          )}
                        >
                          <input
                            type="radio" name="payment"
                            className="mt-[3px] accent-brand-orange flex-shrink-0 disabled:cursor-not-allowed"
                            checked={selectedMethod === method}
                            disabled={unavailable}
                            onChange={() => setSelectedMethod(method)}
                          />
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-9 h-9 rounded-[8px] bg-bone flex items-center justify-center flex-shrink-0">
                              <Icon size={17} className="text-graphite" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-[13px] font-semibold text-carbon">{label}</p>
                                {unavailable && (
                                  <span className="text-[10px] font-semibold px-2 py-[1px] rounded-full bg-bone text-slate">
                                    Coming soon
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate">{desc}</p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate mb-4">
                    <ShieldCheck size={12} className="text-success" />
                    Your payment info is secure and encrypted
                  </div>

                  {placeError && (
                    <div className="flex items-start gap-2 text-[12px] text-error bg-error-bg border border-[#FECACA] rounded-[8px] px-3 py-2 mb-4">
                      <AlertCircle size={13} className="mt-[1px] flex-shrink-0" />
                      {placeError}
                    </div>
                  )}

                  {selectedMethod === 'stripe' ? (
                    <CardPaymentSlot
                      checkoutReady={!!checkout}
                      clientSecret={clientSecret}
                      initiating={initiatingPayment}
                      initiateError={initiatePaymentErr}
                      polling={pollingStatus}
                      amount={total}
                      currency={checkout?.currency ?? 'USD'}
                      onConfirmed={handleStripeConfirmed}
                    />
                  ) : (
                    <Button
                      variant="primary" size="lg"
                      disabled={!selectedMethod}
                      loading={placing}
                      icon={!placing && <PackageCheck size={16} />}
                      onClick={handlePlaceOrder}
                      className="gap-2 w-full justify-center"
                    >
                      {placing ? 'Placing Order…' : 'Place Order'}
                    </Button>
                  )}
                </div>
              )}
            </div>

          </div>
          )} {/* end isDigital ? ... : ... */}

          {/* ── Right: Order Summary ──────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-bone p-6 lg:sticky top-20">
            <p className="text-[15px] font-bold text-carbon mb-[18px]">Order Summary</p>

            {/* Items — the whole cart, one order */}
            <div className="flex flex-col gap-2 mb-5">
              {(() => { const cur = currencySymbol(checkout?.currency); return checkout
                ? checkout.items.map(item => (
                  <div key={item.variantId} className="flex justify-between text-[12px]">
                    <span className="text-carbon truncate max-w-[150px]">
                      {item.name}
                      <span className="text-slate ml-1">×{item.quantity}</span>
                    </span>
                    <span className="font-medium text-carbon flex-shrink-0">
                      {cur} {item.totalPrice.toLocaleString()}
                    </span>
                  </div>
                ))
                : !cartLoading && cartItems.map(item => {
                  const price = item.unitPrice ?? item.price ?? 0;
                  const ttl   = item.itemTotal ?? price * item.quantity;
                  return (
                    <div key={item.productVariantId} className="flex justify-between text-[12px]">
                      <span className="text-carbon truncate max-w-[150px]">
                        {item.name}
                        <span className="text-slate ml-1">×{item.quantity}</span>
                      </span>
                      <span className="font-medium text-carbon flex-shrink-0">
                        {cur} {ttl.toLocaleString()}
                      </span>
                    </div>
                  );
                })
              })()}
            </div>

            <div className="h-px bg-bone mb-4" />

            <div className="flex flex-col gap-3 mb-5">
              <div className="flex justify-between text-[13px]">
                <span className="text-slate">Subtotal</span>
                <span className="font-semibold text-carbon">{currencySymbol(checkout?.currency)} {orderSubtotal.toLocaleString()}</span>
              </div>
              {!isDigital && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate">Shipping</span>
                  {selectedZone || summary
                    ? <span className="font-semibold text-carbon">{currencySymbol(checkout?.currency)} {shipping.toLocaleString()}</span>
                    : <span className="text-slate font-medium">Select method</span>
                  }
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate">Tax</span>
                  <span className="font-semibold text-carbon">{currencySymbol(checkout?.currency)} {tax.toLocaleString()}</span>
                </div>
              )}
              {!!summary?.subscriberSavingsUSD && summary.subscriberSavingsUSD > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-success">Member savings</span>
                  <span className="font-semibold text-success">-${summary.subscriberSavingsUSD.toFixed(2)}</span>
                </div>
              )}
              {/* Already baked into each item's totalPrice at checkout-creation
                  time (same as member savings above) — shown here purely as a
                  breakdown line, not subtracted again in the total below. */}
              {!!summary?.campaignDiscountUSD && summary.campaignDiscountUSD > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-success">Sale discount</span>
                  <span className="font-semibold text-success">-${summary.campaignDiscountUSD.toFixed(2)}</span>
                </div>
              )}
              {!!checkout?.couponCode && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-success">Coupon ({checkout.couponCode})</span>
                  <span className="font-semibold text-success">-${couponDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {checkout && (
              <div className="mb-4">
                {checkout.couponCode ? (
                  <button
                    onClick={handleRemoveCoupon}
                    disabled={couponBusy}
                    className="text-[12px] font-medium text-error bg-transparent border-none cursor-pointer p-2 -m-2 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
                  >
                    Remove coupon
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={e => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Coupon code"
                      className="flex-1 min-w-0 px-3 min-h-11 text-[12.5px] border border-bone rounded-lg outline-none text-charcoal bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponBusy || !couponInput.trim()}
                      className="px-4 min-h-11 bg-white border border-bone rounded-lg text-[12.5px] font-semibold text-graphite cursor-pointer hover:bg-cream disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
                    >
                      {couponBusy ? 'Applying…' : 'Apply'}
                    </button>
                  </div>
                )}
                {couponError && <p className="text-[11px] text-error mt-1.5">{couponError}</p>}
              </div>
            )}

            <div className="h-px bg-bone mb-4" />

            <div className="flex justify-between text-[16px] font-bold">
              <span className="text-carbon">Total</span>
              <span className="text-carbon">{currencySymbol(checkout?.currency)} {total.toLocaleString()}</span>
            </div>

            {checkout && (
              <p className="text-[11px] text-slate mt-2 text-right">
                Checkout ID: {checkout._id.slice(-8).toUpperCase()}
              </p>
            )}

            {savingsHints.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                {savingsHints.map(hint => (
                  <button
                    key={hint.storeId}
                    onClick={() => hint.storeSlug && navigate(`/store/${hint.storeSlug}`)}
                    className="w-full text-left px-3.5 py-3 rounded-lg bg-brand-pale-orange border border-brand-orange/20 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
                  >
                    <p className="text-[12.5px] font-semibold text-brand-deep-orange">
                      You could save ${hint.potentialSavingsUSD.toFixed(2)} on this order
                    </p>
                    <p className="text-[11px] text-brand-orange/80 mt-0.5">
                      Join {hint.storeName}'s {hint.planName} membership before checking out →
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
