import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Star, XCircle } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { ledupTheme as t } from '../theme.config';
import { ledupButtonStyle, type LedupButtonVariant } from './ledupStyle';

export function LedupButton({
  variant = 'primary',
  small,
  block,
  loading,
  style,
  className = '',
  children,
  type = 'button',
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: LedupButtonVariant;
  small?: boolean;
  block?: boolean;
  loading?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const isOutline = variant === 'outline';
  const baseCls = isOutline ? 'ld-btn-outline' : 'ld-btn-solid';
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
      className={`${baseCls} ${small ? '!h-9 !px-4 !text-xs' : ''} ${block ? '!w-full' : ''} ${className}`.trim()}
      style={{
        ...ledupButtonStyle(variant),
        borderRadius: t.buttonRadiusPx,
        fontFamily: t.fonts.body,
        ...style,
      }}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}

export function LedupLinkButton({
  to,
  variant = 'primary',
  small,
  block,
  children,
  style,
  className = '',
}: {
  to: string;
  variant?: LedupButtonVariant;
  small?: boolean;
  block?: boolean;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  const isOutline = variant === 'outline';
  const baseCls = isOutline ? 'ld-btn-outline' : 'ld-btn-solid';
  return (
    <Link
      to={to}
      className={`${baseCls} ${small ? '!h-9 !px-4 !text-xs' : ''} ${block ? '!w-full' : ''} ${className}`.trim()}
      style={{
        ...ledupButtonStyle(variant),
        borderRadius: t.buttonRadiusPx,
        fontFamily: t.fonts.body,
        ...style,
      }}
    >
      {children}
    </Link>
  );
}

export function LedupBox({
  children,
  narrow,
  padY = true,
  className = '',
  style,
}: {
  children: ReactNode;
  narrow?: boolean;
  padY?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`mx-auto w-full ${className}`.trim()}
      style={{
        maxWidth: narrow ? 920 : t.layout.maxWidth,
        padding: `${padY ? t.layout.sectionPadY : '0'} ${t.layout.containerPadX}`,
        fontFamily: t.fonts.body,
        color: t.colors.ink,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function LedupBreadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label={ts('pg.breadcrumb', 'Breadcrumb')} className="mb-4 flex flex-wrap items-center gap-2 text-[15px] text-[#4b423b]">
      {items.map((it, i) => (
        <span key={`${it.label}-${i}`} className="inline-flex items-center gap-1.5">
          {it.to ? (
            <Link to={it.to} className="transition-colors hover:text-stone-900">
              {it.label}
            </Link>
          ) : (
            <span aria-current="page" className="font-medium text-stone-900">
              {it.label}
            </span>
          )}
          {i < items.length - 1 && <ChevronRight size={13} aria-hidden className="text-stone-400" />}
        </span>
      ))}
    </nav>
  );
}

export function LedupPageTitle({ children, aside, subtitle }: { children: ReactNode; aside?: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="m-0 text-[clamp(26px,3.5vw,36px)] font-semibold tracking-tight text-stone-900" style={{ fontFamily: t.fonts.display }}>
          {children}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
      </div>
      {aside}
    </div>
  );
}

export function LedupStars({ value, count, size = 13 }: { value: number; count?: number; size?: number }) {
  const full = Math.round(Math.max(0, Math.min(5, value)));
  return (
    <span className="inline-flex items-center gap-1.5" role="img" aria-label={ts('pg.rated_out_of_5', 'Rated {{value}} out of 5', { value: Number(value.toFixed(1)) })}>
      <span className="inline-flex gap-0.5">
        {[0, 1, 2, 3, 4].map(i => (
          <Star key={i} size={size} aria-hidden fill={i < full ? t.colors.star : t.colors.starOff} stroke="none" />
        ))}
      </span>
      {count != null && <span className="text-xs text-stone-500">({count})</span>}
    </span>
  );
}

export function LedupStock({ inStock }: { inStock: boolean }) {
  const Icon = inStock ? CheckCircle2 : XCircle;
  const color = inStock ? t.colors.success : t.colors.danger;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color }}>
      <Icon size={14} aria-hidden />
      {inStock ? ts('pg.in_stock', 'In stock') : ts('pg.out_of_stock', 'Out of stock')}
    </span>
  );
}

export function LedupSkeleton({ h = 200, rows = 1 }: { h?: number; rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl bg-stone-100" style={{ height: h }} />
      ))}
    </div>
  );
}

export function LedupError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mx-auto my-12 max-w-md rounded-2xl border border-red-100 bg-red-50/50 p-6 text-center">
      <XCircle size={32} className="mx-auto mb-3 text-red-500" />
      <p className="m-0 mb-4 text-sm font-medium text-stone-800">{message}</p>
      {onRetry && (
        <LedupButton small variant="outline" onClick={onRetry}>
          {ts('pg.retry', 'Retry')}
        </LedupButton>
      )}
    </div>
  );
}
