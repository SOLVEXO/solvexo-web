import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { useToastList } from '@/contexts/ToastContext';
import { useCartDrawer } from '../../cartDrawerContext';
import { ledupTheme as t } from '../theme.config';

const ICON = { success: CheckCircle2, error: AlertCircle, info: Info } as const;

/** Ledup's own pop-up messages: a white pill card with a brand icon chip. Claims the toast host so the platform's default (orange) container stays hidden, and steps aside while the mini cart is open (the drawer already shows the result). */
export function LedupToaster() {
  const { toasts, dismiss, pause, resume, claimHost } = useToastList();
  useEffect(() => claimHost(), [claimHost]);
  const { open: drawerOpen } = useCartDrawer();
  if (drawerOpen) return null;

  return (
    <div role="status" aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-0 bottom-4 z-[10050] flex flex-col items-center gap-2.5 px-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end sm:px-0">
      {toasts.map(toast => {
        const Icon = ICON[toast.variant];
        const fill = toast.variant === 'error' ? t.colors.danger : toast.variant === 'info' ? t.colors.ink : t.colors.accent;
        return (
          <div key={toast.id} data-leaving={toast.leaving} role={toast.variant === 'error' ? 'alert' : undefined}
            onMouseEnter={() => pause(toast.id)} onMouseLeave={() => resume(toast.id)} onFocus={() => pause(toast.id)} onBlur={() => resume(toast.id)}
            className="pointer-events-auto relative w-full max-w-[400px] overflow-hidden"
            style={{ background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, borderRadius: 9999, border: `1px solid ${t.colors.border}`, boxShadow: '0 12px 36px rgba(28,25,23,.16)', opacity: toast.leaving ? 0 : 1, transition: 'opacity .2s' }}>
            <div className="flex items-center gap-3 py-2 pl-2 pr-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full" style={{ background: fill, color: '#fff' }}>
                <Icon size={18} aria-hidden />
              </span>
              <p className="m-0 min-w-0 flex-1 text-[14px] font-medium leading-snug">{toast.message}</p>
              <button type="button" onClick={() => dismiss(toast.id)} aria-label={ts('pg.dismiss_notification', 'Dismiss notification')}
                className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0" style={{ color: t.colors.inkMuted }}>
                <X size={15} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
