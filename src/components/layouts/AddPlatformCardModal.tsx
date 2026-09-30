import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Modal } from '@/components/comman/ui/Modal';
import { apiConfirmOnboardingPaymentMethod, apiCreateOnboardingSetupIntent } from '@/api/services/platformPlans';
import { StripeCardSetup, isStripeConfigured } from '@/features/auth/pages/onboard/StripeCardSetup';

/** Saves a card for the seller's Solvexo billing (same Stripe customer the plan
 *  checkout uses) — for things that charge "the card on file", like add-ons,
 *  when there isn't one yet. Calls `onSaved` once Stripe and our backend agree. */
export function AddPlatformCardModal({ onSaved, onClose, reason }: {
  onSaved: () => void; onClose: () => void;
  /** One line under the title, e.g. "Add a card to buy 500 AI credits." */
  reason?: string;
}) {
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const stripeReady = isStripeConfigured();

  useEffect(() => {
    if (!stripeReady) return;
    let cancelled = false;
    apiCreateOnboardingSetupIntent()
      .then(res => { if (!cancelled) setClientSecret(res.data.clientSecret); })
      .catch(() => { if (!cancelled) setError('Could not load the card form right now — please try again.'); });
    return () => { cancelled = true; };
  }, [stripeReady]);

  const handleConfirmed = async (setupIntentId: string) => {
    setSaving(true); setError('');
    try {
      await apiConfirmOnboardingPaymentMethod(setupIntentId);
      onSaved();
    } catch {
      setError('We saved your card with Stripe, but could not confirm it on our side — please try again.');
      setSaving(false);
    }
  };

  return (
    <Modal title="Add a card" width={460} onClose={onClose}>
      {reason && <p className="text-[13px] text-slate mb-4">{reason}</p>}
      {!stripeReady ? (
        <div className="flex items-center gap-2 rounded-lg bg-cream px-[14px] py-[10px] text-[12.5px] text-slate">
          <AlertTriangle size={14} className="shrink-0" /> Card payments aren't available right now — please try again later.
        </div>
      ) : clientSecret ? (
        <div>
          <StripeCardSetup
            clientSecret={clientSecret}
            submitLabel="Save card"
            footnote="Secured by Stripe — used for your Solvexo plan and add-ons"
            onConfirmed={handleConfirmed}
          />
          {saving && <p className="text-[11px] text-slate mt-2 text-center">Saving your card…</p>}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-error-bg px-[14px] py-[10px] text-[12.5px] text-error mt-3">
              <AlertTriangle size={14} className="shrink-0 mt-[2px]" /> {error}
            </div>
          )}
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-lg bg-error-bg px-[14px] py-[10px] text-[12.5px] text-error">
          <AlertTriangle size={14} className="shrink-0 mt-[2px]" /> {error}
        </div>
      ) : (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={20} className="text-brand-orange animate-spin" />
        </div>
      )}
    </Modal>
  );
}
