import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Star, XCircle } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { ledupTheme as t } from '../theme.config';
import { ledupButtonStyle } from './ledupStylePort';

type Variant = 'primary' | 'outline' | 'dark';

export function LedupButton({ variant = 'primary', small, block, loading, style, className = '', children, type = 'button', disabled, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; small?: boolean; block?: boolean; loading?: boolean; style?: CSSProperties; children?: ReactNode }) {
  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}
      className={`lb-btn ${small ? 'lb-btn-sm' : ''} ${block ? 'lb-btn-block' : ''} ${className}`.trim()}
      style={{ ...ledupButtonStyle(variant), borderRadius: t.buttonRadiusPx, fontFamily: t.fonts.body, ...style }}>
      {children}
    </button>
  );
}

export function LedupLinkButton({ to, variant = 'primary', small, block, children, style }: { to: string; variant?: Variant; small?: boolean; block?: boolean; children: ReactNode; style?: CSSProperties }) {
  return (
    <Link to={to} className={`lb-btn ${small ? 'lb-btn-sm' : ''} ${block ? 'lb-btn-block' : ''}`.trim()} style={{ ...ledupButtonStyle(variant), borderRadius: t.buttonRadiusPx, fontFamily: t.fonts.body, ...style }}>{children}</Link>
  );
}

/** Page container with the theme's width and side padding. */
export function LedupBox({ children, narrow, padY = true }: { children: ReactNode; narrow?: boolean; padY?: boolean }) {
  return <div className="mx-auto" style={{ maxWidth: narrow ? 860 : t.layout.maxWidth, padding: `${padY ? 'clamp(20px, 3vw, 40px)' : '0'} ${t.layout.containerPadX}`, fontFamily: t.fonts.body, color: t.colors.ink }}>{children}</div>;
}

export function LedupBreadcrumbs({ items, onDark }: { items: { label: string; to?: string }[]; onDark?: boolean }) {
  return (
    <nav aria-label={ts('pg.breadcrumb', 'Breadcrumb')} className="mb-3 flex flex-wrap items-center gap-1 text-xs" style={{ color: onDark ? 'rgba(255,255,255,.85)' : t.colors.inkMuted }}>
      {items.map((it, i) => (
        <span key={`${it.label}-${i}`} className="inline-flex items-center gap-1">
          {it.to ? <Link to={it.to} className="no-underline hover:underline" style={{ color: onDark ? '#fff' : t.colors.ink }}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
          {i < items.length - 1 && <ChevronRight size={12} aria-hidden className="lb-flip-rtl" />}
        </span>
      ))}
    </nav>
  );
}

export function LedupPageTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="m-0 text-[clamp(24px,3.4vw,34px)] font-semibold leading-tight" style={{ fontFamily: t.fonts.display }}>{children}</h1>
      {aside}
    </div>
  );
}

/** Five stars; `value` can be fractional (rounded to the nearest whole star). */
export function LedupStars({ value, count, size = 13 }: { value: number; count?: number; size?: number }) {
  const full = Math.round(Math.max(0, Math.min(5, value)));
  return (
    <span className="inline-flex items-center gap-1.5" role="img" aria-label={ts('pg.rated_out_of_5', 'Rated {{value}} out of 5', { value: Number(value.toFixed(1)) })}>
      <span className="inline-flex gap-0.5">
        {[0, 1, 2, 3, 4].map(i => <Star key={i} size={size} aria-hidden fill={i < full ? t.colors.star : t.colors.starOff} stroke="none" />)}
      </span>
      {count != null && <span className="text-xs" style={{ color: t.colors.inkMuted }}>{ts('pg.reviews_count', 'Reviews ({{count}})', { count })}</span>}
    </span>
  );
}

export function LedupStock({ inStock }: { inStock: boolean }) {
  const Icon = inStock ? CheckCircle2 : XCircle;
  const color = inStock ? t.colors.success : t.colors.danger;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color }}>
      <Icon size={13} aria-hidden />{inStock ? ts('pg.in_stock', 'In stock') : ts('pg.check_availability', 'Check availability')}
    </span>
  );
}

export function LedupEmpty({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-3 px-6 py-14 text-center" style={{ background: t.colors.bgAlt }}>
      <p className="m-0 text-lg font-semibold">{title}</p>
      {text && <p className="m-0 max-w-[420px] text-sm" style={{ color: t.colors.inkMuted }}>{text}</p>}
      {action}
    </div>
  );
}

export function LedupError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="grid place-items-center gap-4 px-6 py-14 text-center">
      <p className="m-0 text-base" style={{ color: t.colors.inkMuted }}>{message}</p>
      {onRetry && <LedupButton onClick={onRetry}>{ts('checkout.tryAgain', 'Try again')}</LedupButton>}
    </div>
  );
}

export function LedupSkeleton({ h = 96, rows = 1 }: { h?: number; rows?: number }) {
  return <div aria-busy="true" aria-label={ts('pg.loading', 'Loading')} className="flex flex-col gap-3">{Array.from({ length: rows }).map((_, i) => <div key={i} className="animate-pulse" style={{ height: h, background: t.colors.bgAlt }} />)}</div>;
}
