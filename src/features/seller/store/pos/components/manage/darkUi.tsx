import {
  forwardRef, type ReactNode,
  type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ButtonHTMLAttributes,
} from 'react';
import { clsx } from 'clsx';
import { X, Loader2 } from 'lucide-react';

// ── Modal ─────────────────────────────────────────────────────────────────────
export interface DarkModalProps {
  title:    string;
  onClose:  () => void;
  children: ReactNode;
  footer?:  ReactNode;
  width?:   number;
}

export function DarkModal({ title, onClose, children, footer, width = 440 }: DarkModalProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative flex flex-col w-full max-h-[90vh] bg-pos-surface border border-carbon rounded-2xl overflow-hidden"
        style={{ maxWidth: width }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-carbon shrink-0">
          <p className="text-[14px] font-semibold text-white">{title}</p>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-transparent border-0 cursor-pointer text-pos-muted hover:bg-carbon"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-carbon shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
export function DarkField({
  label, required, error, hint, className, children,
}: { label: string; required?: boolean; error?: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <div className={clsx('mb-[14px]', className)}>
      <label className="block text-[11px] text-pos-faint mb-[5px]">
        {label}{required && <span className="text-brand-orange ml-[2px]"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-pos-muted">{hint}</p>}
      {error && <p className="mt-1 text-[11px] text-error">{error}</p>}
    </div>
  );
}

// ── Input / Textarea / Select ──────────────────────────────────────────────────
const FIELD_BASE =
  'w-full bg-carbon border border-carbon rounded-lg px-3 py-[8px] text-[13px] text-white outline-none box-border ' +
  'placeholder:text-pos-muted focus:border-brand-orange disabled:opacity-50';

export const DarkInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { leftAddon?: string; rightIcon?: ReactNode }>(
  ({ leftAddon, rightIcon, className, ...props }, ref) => (
    <div className="relative">
      {leftAddon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-pos-muted pointer-events-none">
          {leftAddon}
        </span>
      )}
      <input ref={ref} className={clsx(FIELD_BASE, leftAddon && 'pl-6', rightIcon && 'pr-8', className)} {...props} />
      {rightIcon && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-pos-muted pointer-events-none">
          {rightIcon}
        </span>
      )}
    </div>
  ),
);
DarkInput.displayName = 'DarkInput';

export const DarkTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 3, ...props }, ref) => (
    <textarea ref={ref} rows={rows} className={clsx(FIELD_BASE, 'resize-vertical', className)} {...props} />
  ),
);
DarkTextarea.displayName = 'DarkTextarea';

export const DarkSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={clsx(FIELD_BASE, 'cursor-pointer')} {...props}>
      {children}
    </select>
  ),
);
DarkSelect.displayName = 'DarkSelect';

// ── Button ────────────────────────────────────────────────────────────────────
type DarkButtonVariant = 'primary' | 'outline' | 'danger';

interface DarkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: DarkButtonVariant;
  icon?:    ReactNode;
  loading?: boolean;
}

const VARIANT_CLASSES: Record<DarkButtonVariant, string> = {
  primary: 'bg-brand-orange border-0 text-white',
  outline: 'bg-carbon border border-carbon text-pos-faint',
  danger:  'bg-[#C1303020] border border-error text-error',
};

export function DarkButton({ variant = 'primary', icon, loading, disabled, className, children, ...props }: DarkButtonProps) {
  return (
    <button
      className={clsx(
        'px-4 py-[9px] rounded-lg text-[12px] font-semibold cursor-pointer flex items-center justify-center gap-[6px]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
export function DarkEmptyState({
  icon, title, description, action,
}: { icon: ReactNode; title: string; description?: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-5">
      <div className="w-14 h-14 rounded-2xl bg-carbon flex items-center justify-center mb-4 shrink-0">
        {icon}
      </div>
      <p className="text-[14px] font-semibold text-white mb-1">{title}</p>
      {description && <p className="text-[12px] text-pos-muted max-w-[320px] leading-[1.6] mb-4">{description}</p>}
      {action && <DarkButton onClick={action.onClick}>{action.label}</DarkButton>}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function DarkSkeleton({ height = 44, className }: { height?: number; className?: string }) {
  return <div className={clsx('animate-pulse bg-carbon rounded-lg', className)} style={{ height }} />;
}

// ── Metric card ───────────────────────────────────────────────────────────────
export function DarkMetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex-1 min-w-[140px] bg-carbon border border-charcoal rounded-xl p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-1 text-pos-muted">{label}</p>
      <p className="text-[20px] font-bold text-white">{value}</p>
      {sub && <p className="text-[11px] mt-[2px] text-pos-muted">{sub}</p>}
    </div>
  );
}

// ── Table shell ───────────────────────────────────────────────────────────────
export function DarkTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="bg-pos-surface border border-carbon rounded-xl overflow-hidden overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {headers.map(h => (
              <th
                key={h}
                className="text-left px-4 py-[10px] text-[10px] font-semibold uppercase tracking-[0.07em] bg-[#141312] border-b border-carbon text-pos-muted whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
