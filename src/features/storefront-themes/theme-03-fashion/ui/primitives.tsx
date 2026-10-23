import { useId, type CSSProperties, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { ts } from '@/utils/tStatic';
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { fashionTheme as t } from '../theme.config';
import { controlStyle } from './controlStyle';
import { AccentText } from './AccentText';

/* Small design kit used by every Maison page beyond Home/Product/Cart (auth, account, checkout, orders ...).
   All colors / radii / fonts come from `fashionTheme`, so merchant customization applies everywhere. */

/** Page container with the theme's width + side padding. */
export function Page({ children, narrow, wide, padY = true }: { children: ReactNode; narrow?: boolean; wide?: boolean; padY?: boolean }) {
  return (
    <div className="mx-auto" style={{ maxWidth: narrow ? 560 : wide ? 1440 : t.layout.maxWidth, padding: `${padY ? 'clamp(28px, 4vw, 56px)' : '0'} ${t.layout.containerPadX}`, fontFamily: t.fonts.body, color: t.colors.ink }}>{children}</div>
  );
}

/** Page heading: large title, optional serif-italic accent word and muted subtitle. */
export function PageTitle({ children, accent, subtitle, actions }: { children: ReactNode; accent?: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
      <div className="min-w-0">
        <h1 className="m-0 text-[clamp(28px,4vw,46px)] font-medium leading-[1.1] tracking-tight" style={{ fontFamily: t.fonts.display }}>
          {typeof children === 'string' ? <AccentText text={children} accent={accent} /> : <>{children}{accent && <> <span className="fx-serif" style={{ fontSize: '1.06em' }}>{accent}</span></>}</>}
        </h1>
        {subtitle && <p className="m-0 mt-3 max-w-[620px] text-base leading-relaxed" style={{ color: t.colors.inkMuted }}>{subtitle}</p>}
      </div>
      {actions}
    </header>
  );
}

/** Rounded bordered surface. `tone="soft"` uses the muted background instead of a border. */
export function Card({ children, tone = 'line', pad = true, style, className = '' }: { children: ReactNode; tone?: 'line' | 'soft'; pad?: boolean; style?: CSSProperties; className?: string }) {
  return (
    <div className={className} style={{ borderRadius: 20, padding: pad ? 'clamp(18px, 2.4vw, 28px)' : 0, background: tone === 'soft' ? t.colors.bgAlt : t.colors.bg, border: tone === 'soft' ? 'none' : `1px solid ${t.colors.border}`, ...style }}>{children}</div>
  );
}

export function SectionHeading({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return <div className="mb-4 flex items-center justify-between gap-3"><h2 className="m-0 text-lg font-semibold tracking-tight">{children}</h2>{action}</div>;
}


interface FieldProps { label: string; hint?: ReactNode; error?: string | null; required?: boolean; children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode }
/** Label + control + hint/error, wired for screen readers. Children is a render function that receives the id/aria props. */
export function Field({ label, hint, error, required, children }: FieldProps) {
  const id = useId();
  const note = error ?? undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}{required && <span aria-hidden style={{ color: t.colors.danger }}> *</span>}</label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': error || hint ? `${id}-note` : undefined })}
      {(error || hint) && <p id={`${id}-note`} role={error ? 'alert' : undefined} className="m-0 text-[13px]" style={{ color: error ? t.colors.danger : t.colors.inkMuted }}>{note ?? hint}</p>}
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
  return <textarea {...rest} style={{ ...controlStyle(invalid), minHeight: 96, resize: 'vertical', ...style }} />;
}

/** Inline message: info / success / error. Errors use role="alert". */
export function Notice({ tone = 'info', children, action }: { tone?: 'info' | 'success' | 'error'; children: ReactNode; action?: ReactNode }) {
  const Icon = tone === 'error' ? AlertCircle : tone === 'success' ? CheckCircle2 : Info;
  const color = tone === 'error' ? t.colors.danger : tone === 'success' ? t.colors.success : t.colors.ink;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className="flex items-start gap-3 px-4 py-3 text-sm" style={{ borderRadius: 14, background: `color-mix(in srgb, ${color} 9%, transparent)`, color: t.colors.ink }}>
      <Icon size={18} style={{ color, flexShrink: 0, marginTop: 1 }} aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-3 px-6 py-16 text-center" style={{ background: t.colors.bgAlt, borderRadius: 24 }}>
      {icon && <span className="grid size-14 place-items-center rounded-full" style={{ background: t.colors.bg }}>{icon}</span>}
      <p className="m-0 text-xl font-semibold">{title}</p>
      {text && <p className="m-0 max-w-[420px] text-sm" style={{ color: t.colors.inkMuted }}>{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="grid place-items-center gap-4 px-6 py-14 text-center">
      <p className="m-0 text-base" style={{ color: t.colors.inkMuted }}>{message}</p>
      {onRetry && <button type="button" onClick={onRetry} className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, border: 'none' }}>{ts('checkout.tryAgain', 'Try again')}</button>}
    </div>
  );
}

export function Spinner({ label = ts('pg.loading', 'Loading') }: { label?: string }) {
  return <div role="status" aria-label={label} className="grid place-items-center py-16"><Loader2 size={26} className="animate-spin" style={{ color: t.colors.inkMuted }} /></div>;
}

export function SkeletonBlock({ h = 96, rows = 1 }: { h?: number; rows?: number }) {
  return <div aria-busy="true" className="flex flex-col gap-3">{Array.from({ length: rows }).map((_, i) => <div key={i} className="animate-pulse" style={{ height: h, background: t.colors.bgAlt, borderRadius: 16 }} />)}</div>;
}

export function StatusPill({ tone = 'neutral', children }: { tone?: 'neutral' | 'good' | 'warn' | 'bad'; children: ReactNode }) {
  const c = tone === 'good' ? t.colors.success : tone === 'bad' ? t.colors.danger : tone === 'warn' ? '#B45309' : t.colors.inkMuted;
  return <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: `color-mix(in srgb, ${c} 14%, transparent)`, color: c }}>{children}</span>;
}

/** Primary / outline pill button for forms (use `FashionButton` with `arrow` for hero-style CTAs). */
export function PillButton({ children, variant = 'primary', loading, full, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost'; loading?: boolean; full?: boolean }) {
  const style: CSSProperties = variant === 'primary' ? { background: t.colors.accent, color: t.colors.accentInk, border: `1px solid ${t.colors.accent}` }
    : variant === 'outline' ? { background: 'transparent', color: t.colors.ink, border: `1px solid ${t.colors.border}` } : { background: 'transparent', color: t.colors.ink, border: '1px solid transparent' };
  return (
    <button type="button" {...rest} disabled={rest.disabled || loading} aria-busy={loading || undefined} className={`fx-pill ${rest.className ?? ''}`} style={{ ...style, borderRadius: t.buttonRadiusPx, width: full ? '100%' : undefined, ...rest.style }}>
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}{children}
    </button>
  );
}
