import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { ShieldCheck, ShieldAlert, Clock, ArrowRight, X } from 'lucide-react';
import type { SellerVerification } from '@/api/services/store';
import { bannerState } from './verificationForm';
import { useStoreVerification } from './useStoreVerification';

const TONE = {
  soft:    { box: 'bg-white border-bone', icon: 'bg-brand-pale-orange text-brand-orange', title: 'text-charcoal', body: 'text-slate', Icon: ShieldCheck },
  info:    { box: 'bg-info-bg border-info/15', icon: 'bg-white text-info', title: 'text-charcoal', body: 'text-charcoal/80', Icon: Clock },
  warning: { box: 'bg-brand-pale-orange border-brand-orange/25', icon: 'bg-white text-brand-deep-orange', title: 'text-brand-deep-orange', body: 'text-charcoal/80', Icon: ShieldAlert },
  error:   { box: 'bg-error-bg border-error/15', icon: 'bg-white text-error', title: 'text-error', body: 'text-charcoal/80', Icon: ShieldAlert },
} as const;

const dismissKey = (storeId: string) => `solvexo:verify-badge-prompt:${storeId}:dismissed`;

/** Verification nudge: deadline / limits / admin request, or a soft "get the badge" prompt before enforcement. */
export function VerificationBanner({ storeId, verification, onPage = false }: {
  storeId: string;
  verification: SellerVerification | null;
  /** On the verification page itself: no "Verify now" button, no dismiss. */
  onPage?: boolean;
}) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(dismissKey(storeId)) === '1'; } catch { return false; }
  });
  if (!verification) return null;
  const state = bannerState(verification);
  if (!state) return null;
  if (state.dismissible && (dismissed || onPage)) return null;
  const t = TONE[state.tone];

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(dismissKey(storeId), '1'); } catch { /* per-viewer convenience only */ }
  };

  return (
    <div role={state.tone === 'error' ? 'alert' : 'status'} className={clsx('dash-section-enter flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border px-4 py-3.5', t.box)}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <span aria-hidden className={clsx('size-8 rounded-[9px] flex items-center justify-center shrink-0', t.icon)}>
          <t.Icon size={15} />
        </span>
        <div className="min-w-0">
          <p className={clsx('text-[13px] font-semibold leading-[1.4]', t.title)}>{state.title}</p>
          <p className={clsx('text-[12px] leading-relaxed mt-[2px]', t.body)}>{state.body}</p>
        </div>
      </div>
      {!onPage && state.cta && (
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => navigate(`/store/${storeId}/settings/verification`)}
            className={clsx(
              'inline-flex items-center gap-1.5 px-3.5 py-[7px] pointer-coarse:py-2.5 rounded-md text-[12px] font-semibold border-0 cursor-pointer transition-colors',
              state.tone === 'soft' || state.tone === 'info' ? 'bg-cream text-charcoal border border-bone hover:bg-brand-pale-orange' : 'bg-brand-orange text-white hover:bg-brand-deep-orange',
            )}
          >
            {state.cta} <ArrowRight size={12} />
          </button>
          {state.dismissible && (
            <button type="button" onClick={dismiss} aria-label="Dismiss" className="p-1.5 rounded-md text-slate hover:text-charcoal bg-transparent border-0 cursor-pointer">
              <X size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Store dashboard: loads the store's verification in the background and shows the banner (seller only — the caller hides it for staff). */
export function DashboardVerificationBanner({ storeId }: { storeId: string }) {
  const { data } = useStoreVerification(storeId, { quiet: true });
  return <VerificationBanner storeId={storeId} verification={data} />;
}
