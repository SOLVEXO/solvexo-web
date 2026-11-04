import { useId, type ButtonHTMLAttributes, type CSSProperties, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { techTheme as t } from '../theme.config';
import { techButtonStyle } from './techStyle';

/* Form kit for the Tech checkout and customer pages. Same names and props as the shared storefront kit, drawn in Tech's own
   look (square-ish corners, blue accent, pill buttons). Colours, radii and fonts all come from `techTheme`. */

function controlStyle(invalid?: boolean): CSSProperties {
  return { width: '100%', minHeight: 44, padding: '10px 14px', borderRadius: 4, background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, fontSize: 14, outline: 'none', border: `1px solid ${invalid ? t.colors.danger : t.colors.border}` };
}

/** Marked words in a heading (`*word*`) are only an accent in other themes; Tech prints the plain text. */
export function AccentText({ text }: { text: string; size?: string; accent?: string }) {
  return <>{text.replace(/\*/g, '')}</>;
}

/** Page container with the theme's width + side padding. */
export function Page({ children, narrow, wide, padY = true }: { children: ReactNode; narrow?: boolean; wide?: boolean; padY?: boolean }) {
  return <div className="mx-auto" style={{ maxWidth: narrow ? 560 : wide ? 1440 : t.layout.maxWidth, padding: `${padY ? 'clamp(24px, 3vw, 44px)' : '0'} ${t.layout.containerPadX}`, fontFamily: t.fonts.body, color: t.colors.ink }}>{children}</div>;
}

export function PageTitle({ children, subtitle, actions }: { children: ReactNode; accent?: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="m-0 text-[clamp(24px,3.4vw,34px)] font-semibold leading-tight" style={{ fontFamily: t.fonts.display }}>{typeof children === 'string' ? children.replace(/\*/g, '') : children}</h1>
        {subtitle && <p className="m-0 mt-2 max-w-[620px] text-sm" style={{ color: t.colors.inkMuted }}>{subtitle}</p>}
      </div>
      {actions}
    </header>
  );
}

/** Bordered surface; `tone="soft"` uses the soft blue panel colour instead of a border. */
export function Card({ children, tone = 'line', pad = true, style, className = '' }: { children: ReactNode; tone?: 'line' | 'soft'; pad?: boolean; style?: CSSProperties; className?: string }) {
  return <div className={className} style={{ borderRadius: 4, padding: pad ? 'clamp(16px, 2vw, 24px)' : 0, background: tone === 'soft' ? t.colors.bgAlt : t.colors.bg, border: tone === 'soft' ? 'none' : `1px solid ${t.colors.border}`, ...style }}>{children}</div>;
}

interface FieldProps { label: string; hint?: ReactNode; error?: string | null; required?: boolean; children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode }
/** Label + control + hint/error, wired for screen readers. */
export function Field({ label, hint, error, required, children }: FieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold">{label}{required && <span aria-hidden style={{ color: t.colors.danger }}> *</span>}</label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': error || hint ? `${id}-note` : undefined })}
      {(error || hint) && <p id={`${id}-note`} role={error ? 'alert' : undefined} className="m-0 text-xs" style={{ color: error ? t.colors.danger : t.colors.inkMuted }}>{error ?? hint}</p>}
    </div>
  );
}

export function TextInput({ invalid, style, ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input {...rest} style={{ ...controlStyle(invalid), ...style }} />;
}
export function SelectInput({ invalid, style, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return <select {...rest} style={{ ...controlStyle(invalid), ...style }}>{children}</select>;
}
export function TextArea({ invalid, style, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea {...rest} style={{ ...controlStyle(invalid), minHeight: 88, resize: 'vertical', ...style }} />;
}

/** Inline message: info / success / error. Errors use role="alert". */
export function Notice({ tone = 'info', children, action }: { tone?: 'info' | 'success' | 'error'; children: ReactNode; action?: ReactNode }) {
  const Icon = tone === 'error' ? AlertCircle : tone === 'success' ? CheckCircle2 : Info;
  const color = tone === 'error' ? t.colors.danger : tone === 'success' ? t.colors.success : t.colors.accent;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className="flex items-start gap-3 px-4 py-3 text-sm" style={{ borderRadius: 4, background: `color-mix(in srgb, ${color} 9%, transparent)`, color: t.colors.ink }}>
      <Icon size={18} style={{ color, flexShrink: 0, marginTop: 1 }} aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-3 px-6 py-14 text-center" style={{ background: t.colors.bgAlt }}>
      {icon && <span className="grid size-14 place-items-center rounded-full" style={{ background: t.colors.bg }}>{icon}</span>}
      <p className="m-0 text-lg font-semibold">{title}</p>
      {text && <p className="m-0 max-w-[420px] text-sm" style={{ color: t.colors.inkMuted }}>{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="grid place-items-center gap-4 px-6 py-12 text-center">
      <p className="m-0 text-base" style={{ color: t.colors.inkMuted }}>{message}</p>
      {onRetry && <PillButton onClick={onRetry}>{ts('checkout.tryAgain', 'Try again')}</PillButton>}
    </div>
  );
}

export function SkeletonBlock({ h = 96, rows = 1 }: { h?: number; rows?: number }) {
  return <div aria-busy="true" className="flex flex-col gap-3">{Array.from({ length: rows }).map((_, i) => <div key={i} className="animate-pulse" style={{ height: h, background: t.colors.bgAlt }} />)}</div>;
}

/** Filled / outline pill button for forms. */
export function PillButton({ children, variant = 'primary', loading, full, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost'; loading?: boolean; full?: boolean }) {
  const style: CSSProperties = variant === 'ghost' ? { background: 'transparent', color: t.colors.ink, borderColor: 'transparent' } : techButtonStyle(variant === 'outline' ? 'outline' : 'primary');
  return (
    <button type="button" {...rest} disabled={rest.disabled || loading} aria-busy={loading || undefined} className={`tx-btn ${full ? 'tx-btn-block' : ''} ${rest.className ?? ''}`.trim()} style={{ ...style, borderRadius: t.buttonRadiusPx, fontFamily: t.fonts.body, ...rest.style }}>
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}{children}
    </button>
  );
}
