import { useEffect } from 'react';
import { ts } from '@/utils/tStatic';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { TOAST_DURATION_MS, useToastList, type ToastVariant } from '@/contexts/ToastContext';
import { useCartDrawer } from '../../cartDrawerContext';
import { fashionTheme as t, relativeLuminance } from '../theme.config';

const ICON = { success: CheckCircle2, error: AlertCircle, info: Info } as const;

const onFill = (fill: string) => (relativeLuminance(fill) < 0.5 ? '#FFFFFF' : '#09090B');

/** Where the stack sits. Phones: always centred (bottom, or top for a top position). */
const POSITION = {
  'bottom-right': 'bottom-4 sm:bottom-6 sm:inset-x-auto sm:right-6 sm:items-end',
  'bottom-center': 'bottom-4 sm:bottom-6 sm:items-center',
  'top-right': 'top-4 sm:top-6 sm:inset-x-auto sm:right-6 sm:items-end',
  'top-center': 'top-4 sm:top-6 sm:items-center',
} as const;

/** Icon chip colours. The seller's colour wins; otherwise the accent, unless it would vanish on the card (a black accent on a black card). */
function tone(variant: ToastVariant, dark: boolean): { fill: string; ink: string } {
  if (variant === 'error') return { fill: t.colors.danger, ink: '#FFFFFF' };
  const fill = t.toast.color ?? t.colors.accent;
  const card = dark ? t.colors.ink : t.colors.bg;
  if (!t.toast.color && Math.abs(relativeLuminance(fill) - relativeLuminance(card)) <= 0.3) {
    return dark ? { fill: t.colors.bg, ink: t.colors.ink } : { fill: t.colors.ink, ink: t.colors.bg };
  }
  return { fill, ink: onFill(fill) };
}

/** Maison's own toast stack (look, colour and position come from Theme settings -> Pop-up messages). Claims the toast host so the platform's default container stays hidden. */
export function FashionToaster() {
  const { toasts, dismiss, pause, resume, claimHost } = useToastList();
  useEffect(() => claimHost(), [claimHost]);
  // With the cart drawer open the toast would cover its Check out / View cart buttons (the drawer already shows the result).
  const { open: drawerOpen } = useCartDrawer();
  const dark = t.toast.style === 'dark';
  const cardBg = dark ? t.colors.ink : t.colors.bg;
  const cardInk = dark ? t.colors.bg : t.colors.ink;

  return (
    <div role="status" aria-live="polite" aria-atomic="false"
      className={`pointer-events-none fixed inset-x-0 ${POSITION[t.toast.position]} ${drawerOpen ? 'z-[9000]' : 'z-[10050]'} flex flex-col items-center gap-2.5 px-4 sm:px-0`}>
      {toasts.map(toast => {
        const Icon = ICON[toast.variant];
        const { fill, ink } = tone(toast.variant, dark);
        return (
          <div key={toast.id} data-leaving={toast.leaving} role={toast.variant === 'error' ? 'alert' : undefined}
            onMouseEnter={() => pause(toast.id)} onMouseLeave={() => resume(toast.id)} onFocus={() => pause(toast.id)} onBlur={() => resume(toast.id)}
            className="fx-toast pointer-events-auto relative w-full max-w-[400px] overflow-hidden"
            style={{ background: cardBg, color: cardInk, fontFamily: t.fonts.body, borderRadius: `min(${t.buttonRadiusPx}, 28px)`, border: dark ? 'none' : `1px solid ${t.colors.border}`, boxShadow: '0 18px 48px rgba(0,0,0,.22)' }}>
            <div className="flex items-center gap-3 py-2.5 pl-2.5 pr-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full" style={{ background: fill, color: ink }}>
                <Icon size={18} aria-hidden />
              </span>
              <p className="m-0 min-w-0 flex-1 text-[15px] font-medium leading-snug" style={{ fontFamily: t.fonts.display }}>{toast.message}</p>
              <button type="button" onClick={() => dismiss(toast.id)} aria-label={ts('pg.dismiss_notification', 'Dismiss notification')}
                className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 transition-colors hover:bg-[color-mix(in_srgb,currentColor_14%,transparent)]" style={{ color: cardInk, opacity: 0.7 }}>
                <X size={15} />
              </button>
            </div>
            {t.toast.progress && (
              <div className="absolute inset-x-0 bottom-0 h-[3px]" aria-hidden>
                <div className="fx-toast-bar h-full w-full" style={{ background: fill, opacity: 0.9, animationDuration: `${TOAST_DURATION_MS}ms`, animationPlayState: toast.paused || toast.leaving ? 'paused' : 'running' }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
