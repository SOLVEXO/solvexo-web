import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useCartContext } from '@/contexts/CartContext';
import { useShippingZones } from '@/hooks/shipping/useShippingZones';
import { apiGetMyAddresses, type Address } from '@/api/commerce/address';
import { apiCreateCheckout, type Checkout, type CheckoutSummary } from '@/api/commerce/checkout';
import { Button } from '@/components/comman/ui/Button';
import {
  ArrowLeft, MapPin, Truck, CreditCard, CheckCircle2,
  ChevronRight, Loader2, AlertCircle, PackageCheck,
  Banknote, ShieldCheck, ArrowDownCircle,
} from 'lucide-react';
import { clsx } from 'clsx';

// ── Logo ──────────────────────────────────────────────────────────────────────
function SolvexoIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#D97757" />
      <text x="4" y="26" fontFamily="'Poppins',sans-serif" fontWeight="800" fontSize="26" fill="white">s</text>
      <rect x="16.5" y="2" width="13" height="13" rx="3.5" fill="#C8694E" fillOpacity="0.7" />
      <path d="M23 11.5V5.5M23 5.5L20 8.5M23 5.5L26 8.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Step badge ────────────────────────────────────────────────────────────────
function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={clsx(
      'w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 transition-colors',
      done ? 'bg-success text-white' :
        active ? 'bg-brand-orange text-white' :
          'bg-bone text-[#8C8A82]',
    )}>
      {done ? <CheckCircle2 size={14} /> : n}
    </div>
  );
}

// ── Payment method labels ─────────────────────────────────────────────────────
const PAYMENT_LABELS: Record<string, { label: string; desc: string; Icon: React.ElementType }> = {
  stripe: { label: 'Credit / Debit Card', desc: 'Secure payment via Stripe', Icon: CreditCard },
  cash_on_delivery: { label: 'Cash on Delivery', desc: 'Pay when your order arrives', Icon: Banknote },
};

// ── Main ──────────────────────────────────────────────────────────────────────
export function CheckoutPage() {
  usePageTitle('Checkout');
  const navigate = useNavigate();
  const { cart, loading: cartLoading, cartCount } = useCartContext();

  // Step: 1 = address, 2 = shipping, 3 = payment
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Address dropdown open state
  const [addrDropOpen, setAddrDropOpen] = useState(false);

  // Address
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [selectedAddr, setSelectedAddr] = useState<Address | null>(null);

  // Shipping
  const { zones, loading: zonesLoading } = useShippingZones();
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [shippingDropOpen, setShippingDropOpen] = useState(false);

  // Checkout creation (step 2 → 3)
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [allowedMethods, setAllowedMethods] = useState<string[]>([]);

  // Payment
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  // Fetch addresses
  useEffect(() => {
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
  }, []);


  const matchingZones = selectedAddr
    ? zones.filter(z =>
      z.city.toLowerCase() === selectedAddr.city.toLowerCase() ||
      z.province.toLowerCase() === selectedAddr.state.toLowerCase()
    )
    : zones;

  const selectedZone = zones.find(z => z._id === selectedZoneId) ?? null;

  // Totals: prefer backend summary once checkout created
  const subtotal = summary?.subtotal ?? cart?.totalPrice ?? 0;
  const shipping = summary?.shippingFee ?? selectedZone?.shippingPrice ?? 0;
  const tax = summary?.taxAmount ?? 0;
  const total = summary?.totalAmount ?? (subtotal + shipping + tax);

  // ── Handlers ─────────────────────────────────────────────────────────────
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
      setAllowedMethods(res.data.allowedPaymentMethods);
      setStep(3);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Failed to create checkout. Please try again.');
    } finally {
      setCreatingCheckout(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedMethod || !checkout) return;
    setPlacing(true);
    try {
      // TODO: wire to payment/order-confirm API using checkout._id + selectedMethod
      alert(`Order placed!\nCheckout ID: ${checkout._id}\nPayment: ${selectedMethod}`);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-bone h-[60px] flex items-center px-10 gap-4">
        <div className="flex-1 flex items-center gap-2">
          <SolvexoIcon size={28} />
          <span className="font-bold text-[15px] text-[#141413]">Solvex</span>
          <span className="font-bold text-[15px] text-brand-orange">o</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/cart')}>
          <ArrowLeft size={14} className="inline align-middle mr-1" />
          Back to Cart
        </Button>
      </nav>

      <div className="max-w-[960px] mx-auto px-6 py-8">

        <div className="grid gap-6 items-start" style={{ gridTemplateColumns: '1fr 300px' }}>

          {/* ── Left: Steps ────────────────────────────────────────────── */}
          <div className="bg-white rounded-[12px] border border-bone overflow-hidden">

            {/* ── Card Header ───────────────────────────────────────────── */}
            <div className="px-6 pt-5 pb-4 border-b border-bone">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-[20px] font-bold text-[#141413] leading-tight">Checkout</h1>
                  <p className="text-[12px] text-[#8C8A82] mt-[2px]">
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
                          'bg-bone text-[#8C8A82]',
                    )}>
                      {step > n ? <CheckCircle2 size={12} /> : n}
                    </div>
                    <span className={clsx(
                      'text-[10px] font-semibold whitespace-nowrap',
                      step === n ? 'text-brand-orange' : step > n ? 'text-[#1E7A3C]' : 'text-[#8C8A82]',
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
                <span className="font-semibold text-[14px] text-[#141413]">Delivery Address</span>
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
                    <div className="flex items-center gap-2 text-[13px] text-[#8C8A82]">
                      <Loader2 size={14} className="animate-spin" /> Loading addresses…
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-2 text-[13px] text-[#8C8A82]">
                        <AlertCircle size={14} className="mt-[2px] flex-shrink-0" />
                        No saved addresses. Please add one from your profile.
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/account/profile')}>
                        Go to Profile
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {/* Dropdown trigger */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setAddrDropOpen(o => !o)}
                          className={clsx(
                            'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-[10px] border bg-cream text-left transition-colors',
                            addrDropOpen ? 'border-brand-orange ring-2 ring-brand-pale-orange' : 'border-bone hover:border-[#c5c4bc]',
                          )}
                        >
                          {selectedAddr ? (
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-[2px]">
                                <span className="text-[13px] font-semibold text-[#141413]">{selectedAddr.recipientName}</span>
                                <span className="text-[11px] text-[#8C8A82] bg-bone rounded-full px-2 py-[1px]">{selectedAddr.label}</span>
                                {selectedAddr.isDefault && (
                                  <span className="text-[11px] text-brand-orange bg-brand-pale-orange rounded-full px-2 py-[1px] font-medium">Default</span>
                                )}
                              </div>
                              <p className="text-[12px] text-[#8C8A82] truncate">
                                {selectedAddr.addressLine1}, {selectedAddr.city}, {selectedAddr.state} {selectedAddr.zipCode}
                              </p>
                            </div>
                          ) : (
                            <span className="text-[13px] text-[#8C8A82]">Select a delivery address…</span>
                          )}
                          <ChevronRight size={15} className={clsx('flex-shrink-0 text-[#8C8A82] transition-transform', addrDropOpen && 'rotate-90')} />
                        </button>

                        {/* Dropdown list */}
                        {addrDropOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-bone rounded-[10px] shadow-[0_4px_20px_rgba(0,0,0,0.10)] z-20 overflow-hidden">
                            {addresses.map((addr, i) => (
                              <button
                                key={addr._id}
                                type="button"
                                onClick={() => selectAddress(addr)}
                                className={clsx(
                                  'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
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
                                    <span className="text-[13px] font-semibold text-[#141413]">{addr.recipientName}</span>
                                    <span className="text-[11px] text-[#8C8A82] bg-bone rounded-full px-2 py-[1px]">{addr.label}</span>
                                    {addr.isDefault && (
                                      <span className="text-[11px] text-brand-orange bg-brand-pale-orange rounded-full px-2 py-[1px] font-medium">Default</span>
                                    )}
                                  </div>
                                  <p className="text-[12px] text-[#8C8A82]">{addr.phoneNumber}</p>
                                  <p className="text-[12px] text-[#141413] mt-[1px]">
                                    {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}, {addr.state} {addr.zipCode}
                                  </p>
                                </div>
                              </button>
                            ))}
                            <div className="border-t border-bone px-4 py-2">
                              <button
                                type="button"
                                onClick={() => navigate('/account/profile')}
                                className="text-[12px] text-brand-orange font-medium cursor-pointer"
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
                <div className="px-5 py-3 text-[13px] text-[#141413]">
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
                <span className="font-semibold text-[14px] text-[#141413]">Shipping Method</span>
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
                    <div className="flex items-center gap-2 text-[13px] text-[#8C8A82]">
                      <Loader2 size={14} className="animate-spin" /> Loading shipping options…
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {/* Dropdown trigger */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShippingDropOpen(o => !o)}
                          className={clsx(
                            'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-[10px] border bg-cream text-left transition-colors',
                            shippingDropOpen ? 'border-brand-orange ring-2 ring-brand-pale-orange' : 'border-bone hover:border-[#c5c4bc]',
                          )}
                        >
                          {selectedZone ? (
                            <div className="flex-1 min-w-0 flex items-center justify-between">
                              <div>
                                <p className="text-[13px] font-semibold text-[#141413]">
                                  {selectedZone.city}, {selectedZone.province}
                                </p>
                                <p className="text-[12px] text-[#8C8A82] mt-[1px]">
                                  Estimated delivery: {selectedZone.estimatedDeliveryTime}
                                </p>
                              </div>
                              <span className="text-[13px] font-bold text-[#141413] ml-4 flex-shrink-0">
                                Rs. {selectedZone.shippingPrice.toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[13px] text-[#8C8A82]">Select a shipping method…</span>
                          )}
                          <ChevronRight size={15} className={clsx('flex-shrink-0 text-[#8C8A82] transition-transform ml-2', shippingDropOpen && 'rotate-90')} />
                        </button>

                        {/* Dropdown list */}
                        {shippingDropOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-bone rounded-[10px] shadow-[0_4px_20px_rgba(0,0,0,0.10)] z-20 overflow-hidden">
                            {(matchingZones.length > 0 ? matchingZones : zones).map((zone, i) => (
                              <button
                                key={zone._id}
                                type="button"
                                onClick={() => { setSelectedZoneId(zone._id); setShippingDropOpen(false); }}
                                className={clsx(
                                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
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
                                  <p className="text-[13px] font-semibold text-[#141413]">
                                    {zone.city}, {zone.province}
                                  </p>
                                  <p className="text-[12px] text-[#8C8A82] mt-[1px]">
                                    Estimated delivery: {zone.estimatedDeliveryTime}
                                  </p>
                                </div>
                                <span className="text-[13px] font-bold text-[#141413] flex-shrink-0">
                                  Rs. {zone.shippingPrice.toLocaleString()}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {checkoutError && (
                        <div className="flex items-start gap-2 text-[12px] text-[#C13030] bg-[#FFF0F0] border border-[#FECACA] rounded-[8px] px-3 py-2">
                          <AlertCircle size={13} className="mt-[1px] flex-shrink-0" />
                          {checkoutError}
                        </div>
                      )}

                      <div>
                        <Button
                          variant="primary" size="sm"
                          disabled={!selectedZoneId || creatingCheckout}
                          onClick={handleContinueToPayment}
                          className="gap-1"
                        >
                          {creatingCheckout
                            ? <><Loader2 size={13} className="animate-spin" /> Creating checkout…</>
                            : <>Continue to Payment <ChevronRight size={14} /></>
                          }
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step > 2 && selectedZone && (
                <div className="px-5 py-3 text-[13px] text-[#141413]">
                  <span className="font-medium">{selectedZone.city}, {selectedZone.province}</span>
                  {' — '}
                  Rs. {selectedZone.shippingPrice.toLocaleString()} · {selectedZone.estimatedDeliveryTime}
                </div>
              )}
            </div>

            <div className="h-px bg-bone" />

            {/* Step 3: Payment */}
            <div className={clsx('transition-opacity', step < 3 && 'opacity-50 pointer-events-none')}>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-bone">
                <StepBadge n={3} active={step === 3} done={false} />
                <CreditCard size={16} className="text-brand-orange" />
                <span className="font-semibold text-[14px] text-[#141413]">Payment Method</span>
              </div>

              {step === 3 && (
                <div className="p-5">
                  <div className="flex flex-col gap-3 mb-4">
                    {allowedMethods.map(method => {
                      const meta = PAYMENT_LABELS[method] ?? { label: method, desc: '', Icon: CreditCard };
                      const { label, desc, Icon } = meta;
                      return (
                        <label
                          key={method}
                          className={clsx(
                            'flex gap-3 p-4 rounded-[10px] border cursor-pointer transition-colors',
                            selectedMethod === method
                              ? 'border-brand-orange bg-brand-pale-orange'
                              : 'border-bone bg-cream hover:border-[#c5c4bc]',
                          )}
                        >
                          <input
                            type="radio" name="payment"
                            className="mt-[3px] accent-brand-orange flex-shrink-0"
                            checked={selectedMethod === method}
                            onChange={() => setSelectedMethod(method)}
                          />
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-9 h-9 rounded-[8px] bg-bone flex items-center justify-center flex-shrink-0">
                              <Icon size={17} className="text-[#4A4945]" />
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-[#141413]">{label}</p>
                              <p className="text-[11px] text-[#8C8A82]">{desc}</p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-[#8C8A82] mb-4">
                    <ShieldCheck size={12} className="text-success" />
                    Your payment info is secure and encrypted
                  </div>

                  <Button
                    variant="primary" size="lg"
                    disabled={!selectedMethod || placing}
                    onClick={handlePlaceOrder}
                    className="gap-2 w-full justify-center"
                  >
                    {placing
                      ? <><Loader2 size={15} className="animate-spin" /> Placing Order…</>
                      : <><PackageCheck size={16} /> Place Order</>
                    }
                  </Button>
                </div>
              )}
            </div>

          </div>

          {/* ── Right: Order Summary ──────────────────────────────────── */}
          <div className="bg-white rounded-[12px] border border-bone p-6 sticky top-20">
            <p className="text-[15px] font-bold text-[#141413] mb-[18px]">Order Summary</p>

            {/* Items — prefer checkout items once created, else cart */}
            <div className="flex flex-col gap-2 mb-5">
              {checkout
                ? checkout.items.map(item => (
                  <div key={item.variantId} className="flex justify-between text-[12px]">
                    <span className="text-[#141413] truncate max-w-[150px]">
                      {item.name}
                      <span className="text-[#8C8A82] ml-1">×{item.quantity}</span>
                    </span>
                    <span className="font-medium text-[#141413] flex-shrink-0">
                      Rs. {item.totalPrice.toLocaleString()}
                    </span>
                  </div>
                ))
                : !cartLoading && cart?.items.map(item => {
                  const price = item.unitPrice ?? item.price ?? 0;
                  const ttl = item.itemTotal ?? price * item.quantity;
                  return (
                    <div key={item.productVariantId} className="flex justify-between text-[12px]">
                      <span className="text-[#141413] truncate max-w-[150px]">
                        {item.name}
                        <span className="text-[#8C8A82] ml-1">×{item.quantity}</span>
                      </span>
                      <span className="font-medium text-[#141413] flex-shrink-0">${ttl.toLocaleString()}</span>
                    </div>
                  );
                })
              }
            </div>

            <div className="h-px bg-bone mb-4" />

            <div className="flex flex-col gap-3 mb-5">
              <div className="flex justify-between text-[13px]">
                <span className="text-[#8C8A82]">Subtotal</span>
                <span className="font-semibold text-[#141413]">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[#8C8A82]">Shipping</span>
                {selectedZone || summary
                  ? <span className="font-semibold text-[#141413]">Rs. {shipping.toLocaleString()}</span>
                  : <span className="text-success font-medium">Select method</span>
                }
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#8C8A82]">Tax</span>
                  <span className="font-semibold text-[#141413]">Rs. {tax.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="h-px bg-bone mb-4" />

            <div className="flex justify-between text-[16px] font-bold">
              <span className="text-[#141413]">Total</span>
              <span className="text-[#141413]">Rs. {total.toLocaleString()}</span>
            </div>

            {checkout && (
              <p className="text-[11px] text-[#8C8A82] mt-2 text-right">
                Checkout ID: {checkout._id.slice(-8).toUpperCase()}
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
