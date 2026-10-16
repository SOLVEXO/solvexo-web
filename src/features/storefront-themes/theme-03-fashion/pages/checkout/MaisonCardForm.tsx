import { useRef, useState, type FormEvent } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { Appearance } from '@stripe/stripe-js';
import { ShieldCheck } from 'lucide-react';
import { fashionTheme as t } from '../../theme.config';
import { Notice, PillButton } from '../../ui/primitives';
import { getStripe } from '../../../core/checkout/stripeLoader';

interface Props {
  clientSecret: string;
  /** Pre-formatted amount for the button ("$42.00"). */
  amountText: string;
  /** Where Stripe sends the buyer back if a payment method needs a redirect (the return page then polls the status). */
  returnUrl: string;
  /** Stripe accepted the payment client-side; the caller now polls the order status. */
  onConfirmed: () => void;
}

function CardFields({ amountText, returnUrl, onConfirmed }: Omit<Props, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || locked.current) return;
    locked.current = true; setSubmitting(true); setError('');
    try {
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({ elements, confirmParams: { return_url: returnUrl }, redirect: 'if_required' });
      if (confirmError) { setError(confirmError.message ?? 'Payment failed. Please check your details and try again.'); return; }
      if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) { onConfirmed(); return; }
      setError('Payment did not complete. Please try again.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      locked.current = false; setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" aria-label="Card payment">
      <PaymentElement />
      {error && <Notice tone="error">{error}</Notice>}
      <PillButton type="submit" full loading={submitting} disabled={!stripe || !elements}>Pay {amountText}</PillButton>
      <p className="m-0 flex items-center justify-center gap-1.5 text-xs" style={{ color: t.colors.inkMuted }}>
        <ShieldCheck size={13} aria-hidden /> Payments are encrypted and processed securely by Stripe
      </p>
    </form>
  );
}

/** Stripe Elements card form dressed in the Maison tokens (colors, radius, font follow merchant customization). */
export function MaisonCardForm({ clientSecret, ...rest }: Props) {
  const promise = getStripe();
  if (!promise) return <Notice tone="error">Card payments are not configured for this store yet.</Notice>;
  const appearance: Appearance = {
    theme: 'flat',
    variables: {
      colorPrimary: t.colors.accent, colorBackground: t.colors.bg, colorText: t.colors.ink, colorDanger: t.colors.danger,
      fontFamily: t.fonts.body, borderRadius: '14px', spacingUnit: '4px',
    },
    rules: {
      '.Input': { border: `1px solid ${t.colors.border}`, boxShadow: 'none', padding: '13px 16px' },
      '.Input:focus': { border: `1px solid ${t.colors.ink}`, boxShadow: 'none' },
      '.Label': { fontWeight: '500' },
    },
  };
  return (
    <Elements key={clientSecret} stripe={promise} options={{ clientSecret, appearance }}>
      <CardFields {...rest} />
    </Elements>
  );
}
