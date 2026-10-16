import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { TOAST_DURATION_MS, useToastList, type ToastVariant } from '@/contexts/ToastContext';
import { useCartDrawer } from '../../cartDrawerContext';
import { fashionTheme as t } from '../theme.config';

const ICON = { success: CheckCircle2, error: AlertCircle, info: Info } as const;

function tone(variant: ToastVariant): string {
  return variant === 'success' ? t.colors.success : variant === 'error' ? t.colors.danger : t.colors.ink;
}

/** Maison's own toast stack. Claims the toast host so the platform's default container stays hidden. */
export function FashionToaster() {
  const { toasts, dismiss, pause, resume, claimHost } = useToastList();
  useEffect(() => claimHost(), [claimHost]);
  // With the cart drawer open the toast would cover its Check out / View cart buttons (the drawer already shows the result).
  const { open: drawerOpen } = useCartDrawer();

  return (
    <div role="status" aria-live="polite" aria-atomic="false"
      className={`pointer-events-none fixed inset-x-0 bottom-4 ${drawerOpen ? 'z-[9000]' : 'z-[10050]'} flex flex-col items-center gap-2.5 px-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end sm:px-0`}>
      {toasts.map(toast => {
        const Icon = ICON[toast.variant];
        const color = tone(toast.variant);
        return (
          <div key={toast.id} data-leaving={toast.leaving} role={toast.variant === 'error' ? 'alert' : undefined}
            onMouseEnter={() => pause(toast.id)} onMouseLeave={() => resume(toast.id)} onFocus={() => pause(toast.id)} onBlur={() => resume(toast.id)}
            className="fx-toast pointer-events-auto relative w-full max-w-[400px] overflow-hidden"
            style={{ background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, border: `1px solid ${t.colors.border}`, borderRadius: 20, boxShadow: '0 18px 48px rgba(0,0,0,.16)' }}>
            <div className="flex items-start gap-3 py-3.5 pl-4 pr-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}>
                <Icon size={17} aria-hidden />
              </span>
              <p className="m-0 min-w-0 flex-1 self-center text-sm font-medium leading-snug">{toast.message}</p>
              <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification"
                className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 transition-colors hover:bg-black/5" style={{ color: t.colors.inkMuted }}>
                <X size={15} />
              </button>
            </div>
            <div className="h-[3px] w-full" style={{ background: t.colors.bgAlt }} aria-hidden>
              <div className="fx-toast-bar h-full w-full" style={{ background: color, animationDuration: `${TOAST_DURATION_MS}ms`, animationPlayState: toast.paused || toast.leaving ? 'paused' : 'running' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
