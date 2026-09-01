import { useState, type FormEvent } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from './Button';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

// Loaded once and reused — same convention as StripeCardSetup.tsx.
let stripePromise: Promise<Stripe | null> | null = null;
function getStripe() {
  if (!PUBLISHABLE_KEY) return null;
  if (!stripePromise) stripePromise = loadStripe(PUBLISHABLE_KEY);
  return stripePromise;
}

export function isStripeConfigured() {
  return !!PUBLISHABLE_KEY;
}

interface StripeCardPaymentProps {
  clientSecret: string;
  /** Label on the submit button, e.g. "Pay $9.99". */
  submitLabel: string;
  /** Called once Stripe confirms the PaymentIntent client-side. The parent
   *  still needs to call its own backend confirm endpoint to have the
   *  server verify the charge and flip whatever it gates before trusting it. */
  onConfirmed: () => void;
}

function PayForm({ submitLabel, onConfirmed }: Omit<StripeCardPaymentProps, 'clientSecret'>) {
  const stripe   = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError('');

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed. Please check your details and try again.');
      setSubmitting(false);
      return;
    }
    if (paymentIntent && paymentIntent.status === 'succeeded') {
      onConfirmed();
      return;
    }
    setError('Payment did not complete. Please try again.');
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement />

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-error-bg px-[14px] py-[10px] text-[13px] text-error">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button variant="primary" size="lg" fullWidth type="submit" loading={submitting} disabled={!stripe || !elements}>
        {submitLabel}
      </Button>

      <p className="flex items-center justify-center gap-[6px] text-[11px] text-slate">
        <ShieldCheck size={12} className="text-success shrink-0" /> Payments are encrypted and processed securely by Stripe
      </p>
    </form>
  );
}

/** Real Stripe Elements payment form (charges a PaymentIntent) — renders
 *  nothing if VITE_STRIPE_PUBLISHABLE_KEY isn't set. Callers should check
 *  isStripeConfigured() first and show a fallback state instead of mounting
 *  this. */
export function StripeCardPayment({ clientSecret, submitLabel, onConfirmed }: StripeCardPaymentProps) {
  const promise = getStripe();
  if (!promise) return null;

  return (
    <Elements
      stripe={promise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#D97757',
            colorText: '#2C2A28',
            colorDanger: '#C13030',
            fontFamily: 'Poppins, system-ui, sans-serif',
            borderRadius: '8px',
            fontSizeBase: '13px',
          },
        },
      }}
    >
      <PayForm submitLabel={submitLabel} onConfirmed={onConfirmed} />
    </Elements>
  );
}
