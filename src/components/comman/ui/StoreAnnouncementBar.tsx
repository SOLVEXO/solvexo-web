import { useEffect, useState } from 'react';
import { Info, Percent, Tag, AlertTriangle, Truck, PartyPopper, X, ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { getDismissedBannerIds, dismissBanner } from '@/utils/dismissedBanners';

export type StoreAnnouncementType = 'info' | 'sale' | 'coupon' | 'warning' | 'shipping' | 'holiday';

export interface AnnouncementMessage { message: string; ctaLabel?: string | null; ctaLink?: string | null }

interface StoreAnnouncementBarProps {
  storeId: string;
  message: string | null;
  type: StoreAnnouncementType;
  ctaLabel?: string | null;
  ctaLink?: string | null;
  /** Extra messages that rotate after the first. */
  moreMessages?: AnnouncementMessage[];
  /** Seconds each message stays up (3-15). */
  rotateSeconds?: number;
  /** Show the dismiss button (default true). */
  closable?: boolean;
  /** Retailer colours (hex); they win over everything else. */
  bgColor?: string | null;
  textColor?: string | null;
  align?: 'left' | 'center';
  /** The active theme's colours — used when the retailer set no colours, so the bar matches the storefront. */
  themeColors?: { bg: string; text: string; border: string };
  className?: string;
}

const STYLE: Record<StoreAnnouncementType, { Icon: LucideIcon; bg: string; border: string; text: string }> = {
  info:     { Icon: Info,         bg: 'bg-brand-pale-orange', border: 'border-brand-orange/20', text: 'text-brand-deep-orange' },
  sale:     { Icon: Percent,      bg: 'bg-brand-pale-orange', border: 'border-brand-orange/20', text: 'text-brand-deep-orange' },
  coupon:   { Icon: Tag,          bg: 'bg-brand-pale-orange', border: 'border-brand-orange/20', text: 'text-brand-deep-orange' },
  warning:  { Icon: AlertTriangle, bg: 'bg-error-bg',         border: 'border-error-border',        text: 'text-error' },
  shipping: { Icon: Truck,        bg: 'bg-success-bg',        border: 'border-success/20',        text: 'text-success' },
  holiday:  { Icon: PartyPopper,  bg: 'bg-brand-pale-orange', border: 'border-brand-orange/20', text: 'text-brand-deep-orange' },
};

const SAFE_LINK = /^(https?:\/\/|\/(?!\/))/i;

/** Per-store dismissible announcement bar — seller-controlled content, scoped
 *  by `storeId` so dismissing one store's message never hides another's.
 *  Platform-wide Announcements (admin broadcast) are a separate, unrelated
 *  system — they arrive as real per-store Notifications instead, not a banner. */
export function StoreAnnouncementBar({
  storeId, message, type, ctaLabel, ctaLink, moreMessages, rotateSeconds = 5, closable = true, bgColor, textColor, align = 'left', themeColors, className,
}: StoreAnnouncementBarProps) {
  const messages: AnnouncementMessage[] = [
    ...(message ? [{ message, ctaLabel, ctaLink }] : []),
    ...(moreMessages ?? []).filter(m => m.message && !(m as { hidden?: boolean }).hidden),
  ];
  // Any change to the wording brings a dismissed bar back.
  const id = `store:${storeId}:${messages.map(m => m.message).join('|')}`;
  const [dismissedIds, setDismissedIds] = useState<string[]>(getDismissedBannerIds());
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = messages.length;

  useEffect(() => { setDismissedIds(getDismissedBannerIds()); }, [id]);
  useEffect(() => {
    if (count < 2 || paused) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % count), Math.min(15, Math.max(3, rotateSeconds)) * 1000);
    return () => clearInterval(timer);
  }, [count, paused, rotateSeconds]);

  if (count === 0 || dismissedIds.includes(id)) return null;
  const current = messages[Math.min(index, count - 1)];
  const { Icon, bg, border, text } = STYLE[type] ?? STYLE.info;

  // Retailer colours > the theme's colours > the legacy per-type tint.
  const custom = bgColor || textColor;
  const palette = custom
    ? { background: bgColor || themeColors?.bg, color: textColor || themeColors?.text, borderColor: themeColors?.border }
    : themeColors ? { background: themeColors.bg, color: themeColors.text, borderColor: themeColors.border } : null;
  const containerClass = palette
    ? `flex items-center gap-3 px-4 py-2.5 border-b ${className ?? ''}`
    : `flex items-center gap-3 px-4 py-2.5 ${bg} border-b ${border} ${className ?? ''}`;
  const textClass = palette ? '' : text;
  const hasLink = current.ctaLabel && current.ctaLink && SAFE_LINK.test(current.ctaLink);
  const stepStyle = { color: 'inherit', opacity: 0.7 } as const;

  return (
    <div
      className={containerClass}
      style={palette ?? undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      role="region"
      aria-label="Announcement"
    >
      {count > 1 && (
        <button type="button" aria-label="Previous announcement" onClick={() => setIndex(i => (i - 1 + count) % count)}
          className="shrink-0 bg-transparent border-0 cursor-pointer p-0" style={stepStyle}><ChevronLeft size={14} /></button>
      )}
      <Icon size={15} className={`${textClass} shrink-0`} />
      <div className={`flex-1 min-w-0 flex items-baseline gap-2 flex-wrap ${align === 'center' ? 'justify-center text-center' : ''}`} aria-live={count > 1 ? 'off' : 'polite'}>
        <p className={`text-[12.5px] font-medium ${textClass}`}>{current.message}</p>
        {hasLink && (
          <a href={current.ctaLink!} className={`text-[12.5px] font-semibold underline ${textClass}`}>{current.ctaLabel}</a>
        )}
      </div>
      {count > 1 && (
        <button type="button" aria-label="Next announcement" onClick={() => setIndex(i => (i + 1) % count)}
          className="shrink-0 bg-transparent border-0 cursor-pointer p-0" style={stepStyle}><ChevronRight size={14} /></button>
      )}
      {closable && (
        <button
          onClick={() => { dismissBanner(id); setDismissedIds((d) => [...d, id]); }}
          aria-label="Dismiss announcement"
          className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-transparent border-0 cursor-pointer ${palette ? '' : `${text}/70 hover:bg-white/50`}`}
          style={palette ? { color: 'inherit', opacity: 0.7 } : undefined}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
