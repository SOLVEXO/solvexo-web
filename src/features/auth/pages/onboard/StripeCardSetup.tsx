import { useState, type FormEvent, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { loadStripe, type Stripe, type StripeElementChangeEvent } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/comman/ui/Button';
import { AlertTriangle, ChevronsUpDown, ShieldCheck } from 'lucide-react';
import { COUNTRY_OPTIONS } from '@/utils/countries';

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

// Loaded once and reused — same convention as StripeCardPayment.tsx.
let stripePromise: Promise<Stripe | null> | null = null;
function getStripe() {
  if (!PUBLISHABLE_KEY) return null;
  if (!stripePromise) stripePromise = loadStripe(PUBLISHABLE_KEY);
  return stripePromise;
}

export function isStripeConfigured() {
  return !!PUBLISHABLE_KEY;
}

interface StripeCardSetupProps {
  clientSecret: string;
  /** Called once Stripe confirms the SetupIntent client-side, with the
   *  SetupIntent id — the parent still needs to call
   *  apiConfirmOnboardingPaymentMethod(setupIntentId) to have the backend
   *  verify it and flip Seller.hasPlatformPaymentMethod. */
  onConfirmed: (setupIntentId: string) => void;
  /** Overrides the submit button label (default "Save Card & Continue"). */
  submitLabel?: string;
  /** Overrides the reassurance line under the button. */
  footnote?: string;
}

// Stripe's separate Card Number / Expiry / CVC elements (not the all-in-one
// PaymentElement) — lays out like Shopify's own card form (number on top,
// MM / YY + CVV beside each other, then address fields) and never shows
// Stripe Link's "save my information" upsell, which PaymentElement injects.
const ELEMENT_STYLE = {
  base: {
    fontSize: '15px',
    color: '#2C2A28',
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
    '::placeholder': { color: 'transparent' },
  },
  invalid: { color: '#C13030' },
};

const defaultCountry = () => {
  try {
    const region = new Intl.Locale(navigator.language).region;
    if (region && COUNTRY_OPTIONS.some(c => c.code === region)) return region;
  } catch { /* fall through */ }
  return 'US';
};

// ── Floating-label shell ──────────────────────────────────────────────────────
// Shopify's field behaviour: the label sits inside the box like a placeholder,
// and once the field is focused or holds a value it shrinks to the top while
// the value drops below it. `bare` drops the box border so several cells can
// share one outer border (the card number / MM-YY / CVV block).
function FloatBox({ label, floated, focused, bare, className, children }: {
  label: string; floated: boolean; focused: boolean; bare?: boolean; className?: string; children: ReactNode;
}) {
  return (
    <div className={clsx(
      'relative h-[46px] bg-white transition-[border-color,box-shadow] duration-150',
      !bare && 'rounded-xl border',
      !bare && (focused ? 'border-brand-orange ring-2 ring-brand-orange/15' : 'border-bone'),
      className,
    )}>
      <span className={clsx(
        'pointer-events-none absolute left-4 text-slate transition-all duration-150 ease-out',
        floated ? 'top-[6px] text-[11px]' : 'top-1/2 -translate-y-1/2 text-[15px]',
      )}>
        {label}
      </span>
      <div className="absolute inset-x-4 bottom-[5px] top-[20px] flex items-end">{children}</div>
    </div>
  );
}

function FloatInput({ label, value, onChange, autoComplete }: {
  label: string; value: string; onChange: (v: string) => void; autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <FloatBox label={label} floated={focused || value !== ''} focused={focused}>
      <input
        value={value} autoComplete={autoComplete}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="w-full bg-transparent border-0 outline-none text-[15px] text-carbon p-0 leading-[1.2]"
      />
    </FloatBox>
  );
}

function FloatSelect({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <FloatBox label={label} floated focused={focused}>
      <select
        aria-label={label} value={value} autoComplete="country"
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="w-full appearance-none bg-transparent border-0 outline-none text-[15px] text-carbon p-0 pr-7 leading-[1.2] cursor-pointer truncate"
      >
        {children}
      </select>
      <ChevronsUpDown size={16} className="pointer-events-none absolute right-0 bottom-[2px] text-carbon" />
    </FloatBox>
  );
}

// The accepted-card badges shown at the right of the number field (Shopify's
// layout) — plain inline markup, no image assets.
function CardBrands() {
  const chip = 'h-[22px] w-[34px] rounded-[4px] flex items-center justify-center shrink-0';
  return (
    <div className="absolute right-4 top-[12px] flex items-center gap-[5px]" aria-hidden="true">
      <span className={`${chip} bg-[#1a1f71] text-white text-[10px] font-extrabold italic tracking-tight`}>VISA</span>
      <span className={`${chip} bg-white border border-bone`}>
        <span className="size-[11px] rounded-full bg-[#eb001b]" />
        <span className="size-[11px] rounded-full bg-[#f79e1b] -ml-[5px] opacity-90" />
      </span>
      <span className={`${chip} bg-[#2e77bc] text-white text-[8px] font-extrabold leading-none`}>AMEX</span>
      <span className={`${chip} bg-white border border-bone text-[7px] font-extrabold text-[#2b2b2b] relative overflow-hidden`}>
        DISCOVER
        <span className="absolute -right-1 -bottom-1 size-[10px] rounded-full bg-[#f58220]" />
      </span>
    </div>
  );
}

type CardKey = 'number' | 'expiry' | 'cvc';

function SetupForm({ clientSecret, onConfirmed, submitLabel, footnote }: StripeCardSetupProps) {
  const stripe   = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [done, setDone]       = useState<Record<CardKey, boolean>>({ number: false, expiry: false, cvc: false });
  const [empty, setEmpty]     = useState<Record<CardKey, boolean>>({ number: true, expiry: true, cvc: true });
  const [focus, setFocus]     = useState<CardKey | null>(null);
  const [fieldError, setFieldError] = useState('');
  const [address, setAddress] = useState('');
  const [postal, setPostal]   = useState('');
  const [country, setCountry] = useState(defaultCountry);
  const [city, setCity]       = useState('');

  const cardProps = (key: CardKey) => ({
    onChange: (e: StripeElementChangeEvent) => {
      setDone(d => ({ ...d, [key]: e.complete }));
      setEmpty(d => ({ ...d, [key]: e.empty }));
      setFieldError(e.error?.message ?? '');
    },
    onFocus: () => setFocus(key),
    onBlur: () => setFocus(f => (f === key ? null : f)),
  });

  const cardComplete = done.number && done.expiry && done.cvc;
  const detailsComplete = address.trim() && postal.trim() && city.trim() && country;
  const canSubmit = !!stripe && !!elements && cardComplete && !!detailsComplete && !loadError;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const card = elements?.getElement(CardNumberElement);
    if (!stripe || !card || !canSubmit) return;
    setSubmitting(true);
    setError('');

    const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: {
        card,
        billing_details: {
          address: { line1: address.trim(), postal_code: postal.trim(), country, city: city.trim() },
        },
      },
    });

    if (confirmError) {
      setError(confirmError.message ?? 'Card setup failed. Please check your details and try again.');
      setSubmitting(false);
      return;
    }
    if (setupIntent && setupIntent.status === 'succeeded') {
      onConfirmed(setupIntent.id);
      return;
    }
    setError('Card setup did not complete. Please try again.');
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {/* One shared border for the whole number / MM-YY / CVV block — it (not the
          individual cells) lights up orange when any of the three is focused. */}
      <div className={clsx(
        'rounded-xl border bg-white overflow-hidden transition-[border-color,box-shadow] duration-150',
        focus ? 'border-brand-orange ring-2 ring-brand-orange/15' : 'border-bone',
      )}>
        <div className="relative">
          <FloatBox bare label="Card number" floated={focus === 'number' || !empty.number} focused={focus === 'number'}>
            <div className="w-full">
              <CardNumberElement
                options={{ style: ELEMENT_STYLE, showIcon: false, placeholder: '' }}
                onLoadError={ev => setLoadError(ev.error?.message ?? 'The card form could not be loaded.')}
                {...cardProps('number')}
              />
            </div>
          </FloatBox>
          <CardBrands />
        </div>
        <div className={clsx('grid grid-cols-2 border-t transition-colors duration-150', focus ? 'border-brand-orange/40' : 'border-bone')}>
          <div className={clsx('border-r transition-colors duration-150', focus ? 'border-brand-orange/40' : 'border-bone')}>
            <FloatBox bare label="MM / YY" floated={focus === 'expiry' || !empty.expiry} focused={focus === 'expiry'}>
              <div className="w-full"><CardExpiryElement options={{ style: ELEMENT_STYLE, placeholder: '' }} {...cardProps('expiry')} /></div>
            </FloatBox>
          </div>
          <FloatBox bare label="CVV" floated={focus === 'cvc' || !empty.cvc} focused={focus === 'cvc'}>
            <div className="w-full"><CardCvcElement options={{ style: ELEMENT_STYLE, placeholder: '' }} {...cardProps('cvc')} /></div>
          </FloatBox>
        </div>
      </div>

      <FloatInput label="Address" autoComplete="address-line1" value={address} onChange={setAddress} />
      <div className="grid grid-cols-2 gap-3">
        <FloatInput label="Postal code" autoComplete="postal-code" value={postal} onChange={setPostal} />
        <FloatSelect label="Country/region" value={country} onChange={setCountry}>
          {COUNTRY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
        </FloatSelect>
      </div>
      <FloatInput label="City" autoComplete="address-level2" value={city} onChange={setCity} />

      {(fieldError || loadError || error) && (
        <div className="flex items-start gap-2 rounded-lg bg-error-bg px-[14px] py-[10px] text-[13px] text-error">
          <AlertTriangle size={14} className="shrink-0 mt-[2px]" />
          <span>{loadError ? `Card form failed to load: ${loadError}` : error || fieldError}</span>
        </div>
      )}

      <Button variant="primary" size="lg" fullWidth type="submit" loading={submitting} disabled={!canSubmit}>
        {submitLabel ?? 'Save Card & Continue'}
      </Button>

      <p className="flex items-center justify-center gap-[6px] text-[11px] text-slate">
        <ShieldCheck size={12} className="text-success shrink-0" /> {footnote ?? "Your card is encrypted and secured by Stripe — you won't be charged today"}
      </p>
    </form>
  );
}

/** Real Stripe card-setup form (SetupIntent, not a charge) — renders nothing
 *  if VITE_STRIPE_PUBLISHABLE_KEY isn't set. Callers should check
 *  isStripeConfigured() first and show a fallback state instead of mounting
 *  this. */
export function StripeCardSetup({ clientSecret, onConfirmed, submitLabel, footnote }: StripeCardSetupProps) {
  const promise = getStripe();
  if (!promise) return null;

  return (
    <Elements stripe={promise}>
      <SetupForm clientSecret={clientSecret} onConfirmed={onConfirmed} submitLabel={submitLabel} footnote={footnote} />
    </Elements>
  );
}
