import {
  CheckCircle2, AlertTriangle, Info, X,
  ShoppingBag, Heart, Package, Star, Gift, MapPin,
  CreditCard, MessageCircle, Store, LogIn, LogOut, KeyRound, ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useToastList, TOAST_DURATION_MS, type ToastVariant } from '@/contexts/ToastContext';

interface ToastStyle {
  icon:   LucideIcon;
  tint:   string; // icon chip background + icon color
  accent: string; // left bar + progress bar fill
  shadow: string; // color-matched drop shadow
}

const BASE: Record<ToastVariant, ToastStyle> = {
  success: { icon: CheckCircle2, tint: 'bg-success-bg text-success', accent: 'bg-success', shadow: 'shadow-[0_14px_32px_-12px_rgba(45,138,78,0.38)]' },
  error:   { icon: AlertTriangle, tint: 'bg-error-bg text-error',   accent: 'bg-error',   shadow: 'shadow-[0_14px_32px_-12px_rgba(193,48,48,0.38)]' },
  info:    { icon: Info,          tint: 'bg-info-bg text-info',     accent: 'bg-info',    shadow: 'shadow-[0_14px_32px_-12px_rgba(26,114,194,0.38)]' },
};

const ORANGE: ToastStyle = { icon: ShoppingBag, tint: 'bg-brand-pale-orange text-brand-deep-orange', accent: 'bg-brand-orange', shadow: 'shadow-[0_14px_32px_-12px_rgba(217,119,87,0.38)]' };
// Identity/account toasts use the Solvexo brand orange (was off-theme violet).
const VIOLET: ToastStyle = { icon: ShieldCheck, tint: 'bg-brand-pale-orange text-brand-deep-orange', accent: 'bg-brand-orange', shadow: 'shadow-[0_14px_32px_-12px_rgba(217,119,87,0.38)]' };
const AMBER:  ToastStyle = { icon: Star,        tint: 'bg-warning-bg text-warning',                  accent: 'bg-warning',       shadow: 'shadow-[0_14px_32px_-12px_rgba(192,139,30,0.38)]' };
const BLUE:   ToastStyle = { icon: Package,     tint: 'bg-info-bg text-info',                        accent: 'bg-info',          shadow: 'shadow-[0_14px_32px_-12px_rgba(26,114,194,0.38)]' };
const GREEN:  ToastStyle = { icon: CreditCard,  tint: 'bg-success-bg text-success',                  accent: 'bg-success',       shadow: 'shadow-[0_14px_32px_-12px_rgba(45,138,78,0.38)]' };

// Each rule keys off the human copy call sites already pass to
// toast.success/info (e.g. 'Added to cart', 'Review submitted') so every
// buyer action gets its own icon + accent instead of one flat green/blue —
// deliberately built only from colors already in the theme (brand-orange,
// accent-violet, warning, info, success) rather than inventing new ones.
// A failed action (toast.error) always keeps the plain red alert styling
// below — severity is never softened by a "themed" color.
const CATEGORY_RULES: { test: RegExp; style: ToastStyle; icon: LucideIcon }[] = [
  { test: /wishlist/i,                                        style: VIOLET, icon: Heart },
  { test: /cart/i,                                             style: ORANGE, icon: ShoppingBag },
  { test: /following|unfollowed|store/i,                       style: ORANGE, icon: Store },
  { test: /order|return/i,                                     style: BLUE,   icon: Package },
  { test: /seller (blocked|unblocked)|conversation|chat/i,     style: BLUE,   icon: MessageCircle },
  { test: /review/i,                                           style: AMBER,  icon: Star },
  { test: /reward|redeem/i,                                    style: AMBER,  icon: Gift },
  { test: /address/i,                                          style: VIOLET, icon: MapPin },
  { test: /account|security|password/i,                        style: VIOLET, icon: ShieldCheck },
  { test: /code resent/i,                                      style: VIOLET, icon: KeyRound },
  { test: /logged out/i,                                       style: VIOLET, icon: LogOut },
  { test: /logged in/i,                                        style: VIOLET, icon: LogIn },
  { test: /plan|subscription|credit/i,                         style: GREEN,  icon: CreditCard },
];

const TITLE: Record<ToastVariant, string> = { success: 'Done!', error: 'Oh snap!', info: 'Heads up' };

function resolveStyle(variant: ToastVariant, message: string): ToastStyle {
  if (variant === 'error') return BASE.error;
  const match = CATEGORY_RULES.find(r => r.test.test(message));
  return match ? { ...match.style, icon: match.icon } : BASE[variant];
}

/** Stacked action-feedback toasts (Added to cart, Removed, Coupon applied,
 *  etc.) — top-right, solid-colour cards with a corner badge, that matches the rest
 *  of the app's soft-tint icon chips (Badge/StatusBadge). Each kind of
 *  action gets its own icon + accent color (commerce = orange, identity/
 *  account = violet, orders/messages = blue, reviews/rewards = amber,
 *  billing = green) so the stack reads at a glance instead of every action
 *  looking identical. A thin countdown bar shows time-to-dismiss and
 *  genuinely pauses (not just visually) while hovered. */
export function ToastContainer() {
  const { toasts, dismiss, pause, resume, customHosts } = useToastList();
  // A storefront theme that draws its own toasts claims the host, so they are not shown twice.
  if (toasts.length === 0 || customHosts > 0) return null;

  return (
    // Top right, solid colour cards with a round badge pinned over the corner (no shadows).
    <div className="fixed top-[calc(12px+env(safe-area-inset-top))] right-6 lg:top-[88px] z-[9999] flex flex-col gap-4 items-end pointer-events-none max-sm:right-5">
      {toasts.map(t => {
        const style = resolveStyle(t.variant, t.message);
        const Icon = style.icon;
        return (
          <div
            key={t.id}
            role="status"
            aria-atomic="true"
            onMouseEnter={() => pause(t.id)}
            onMouseLeave={() => resume(t.id)}
            onClick={t.onClick ? () => { t.onClick?.(); dismiss(t.id); } : undefined}
            onKeyDown={t.onClick ? e => { if (e.key === 'Enter') { t.onClick?.(); dismiss(t.id); } } : undefined}
            tabIndex={t.onClick ? 0 : undefined}
            className={clsx(
              t.onClick && 'cursor-pointer',
              t.leaving ? 'toast-leave-right' : 'toast-enter-right',
              'pointer-events-auto relative ml-4 mt-3 flex items-center gap-3 w-[380px] max-w-[calc(100vw-3.5rem)] min-h-[76px] rounded-2xl pl-8 pr-3 py-5 text-white',
              style.accent,
            )}
          >
            <span className={clsx('absolute -left-4 -top-3 flex items-center justify-center size-9 rounded-full bg-white border-2 border-current', style.accent.replace('bg-', 'text-'))} aria-hidden>
              <Icon size={17} strokeWidth={2.4} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="m-0 text-[15px] font-bold leading-tight">{TITLE[t.variant]}</p>
              <p className="m-0 mt-0.5 text-[13px] font-medium leading-snug text-white/90">{t.message}</p>
              {t.onClick && <p className="m-0 mt-1 text-[12px] font-semibold underline underline-offset-2">Click to go there</p>}
            </div>
            <button
              onClick={e => { e.stopPropagation(); dismiss(t.id); }}
              aria-label="Dismiss"
              className="text-white/85 hover:text-white hover:bg-white/15 bg-transparent border-0 cursor-pointer p-1 rounded-md shrink-0 transition-colors"
            >
              <X size={14} />
            </button>
            <span className="absolute left-4 right-4 bottom-0 h-[3px] rounded-full overflow-hidden bg-white/20">
              <span
                className="toast-progress block h-full bg-white/70"
                style={{ animationDuration: `${TOAST_DURATION_MS}ms`, animationPlayState: t.paused ? 'paused' : 'running' }}
              />
            </span>
          </div>
        );
      })}
    </div>
  );
}
