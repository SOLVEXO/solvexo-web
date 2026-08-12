import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useToastList } from '@/contexts/ToastContext';

const ICONS = { success: CheckCircle2, error: AlertTriangle, info: Info };

/** Stacked action-feedback toasts (Added to cart, Removed, Coupon applied,
 *  etc.) — bottom-right, same dark-card language as the real-time
 *  notification toast (NotificationBell.tsx), but generic/reusable and
 *  supports more than one at a time. */
export function ToastContainer() {
  const { toasts, dismiss } = useToastList();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end">
      {toasts.map(t => {
        const Icon = ICONS[t.variant];
        return (
          <div
            key={t.id}
            role="status"
            className={clsx(
              'toast-enter flex items-center gap-3 max-w-[340px] rounded-xl border p-3 shadow-[0_8px_24px_rgba(0,0,0,0.18)]',
              t.variant === 'error' ? 'bg-error text-white border-error' : 'bg-carbon text-white border-charcoal',
            )}
          >
            <span className={clsx(
              'flex items-center justify-center size-7 rounded-lg shrink-0',
              t.variant === 'error' ? 'bg-white/15' : 'bg-dark-active border border-charcoal',
            )}>
              <Icon size={15} className={t.variant === 'success' ? 'text-success' : t.variant === 'info' ? 'text-info' : 'text-white'} />
            </span>
            <p className="text-[12.5px] font-medium leading-snug flex-1 min-w-0">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="text-white/70 hover:text-white bg-transparent border-0 cursor-pointer p-0 shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
