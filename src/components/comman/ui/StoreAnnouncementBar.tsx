import { useEffect, useState, type CSSProperties } from 'react';
import { Info, Percent, Tag, AlertTriangle, Truck, PartyPopper, X, ChevronLeft, ChevronRight, Copy, Check, type LucideIcon } from 'lucide-react';
import { getDismissedBannerIds, dismissBanner } from '@/utils/dismissedBanners';

export type StoreAnnouncementType = 'info' | 'sale' | 'coupon' | 'warning' | 'shipping' | 'holiday';

export interface AnnouncementMessage { message: string; ctaLabel?: string | null; ctaLink?: string | null; couponCode?: string | null; hidden?: boolean }

interface StoreAnnouncementBarProps {
  storeId: string;
  message: string | null;
  type: StoreAnnouncementType;
  ctaLabel?: string | null;
  ctaLink?: string | null;
  couponCode?: string | null;
  /** Extra messages that rotate after the first. */
  moreMessages?: AnnouncementMessage[];
  /** Seconds each message stays up (3-15). */
  rotateSeconds?: number;
  /** Show the dismiss button (default true). */
  closable?: boolean;
  /** Retailer colours (hex); they win over everything else. `bgColor2` makes a left-to-right gradient. */
  bgColor?: string | null;
  bgColor2?: string | null;
  textColor?: string | null;
  align?: 'left' | 'center';
  animation?: 'slide' | 'fade' | 'marquee';
  marqueeSpeed?: 'slow' | 'normal' | 'fast';
  fontSize?: 'sm' | 'md' | 'lg';
  uppercase?: boolean;
  bold?: boolean;
  showIcon?: boolean;
  device?: 'all' | 'mobile' | 'desktop';
  dismissFor?: 'forever' | 'day' | 'session';
  countdownEndAt?: string | null;
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
const FONT_SIZE = { sm: '12.5px', md: '14px', lg: '16px' } as const;
const PAD_Y = { sm: '10px', md: '12px', lg: '14px' } as const;
const MARQUEE_SECONDS = { slow: 40, normal: 26, fast: 14 } as const;
const DEVICE_CLASS = { all: 'flex', mobile: 'flex lg:hidden', desktop: 'hidden lg:flex' } as const;
const DAY_MS = 86_400_000;

const KEYFRAMES = `
@keyframes sx-ann-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes sx-ann-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes sx-ann-slide { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .sx-ann-anim { animation: none !important; } }
`;

function wasDismissed(id: string, dismissFor: 'forever' | 'day' | 'session'): boolean {
  try {
    if (dismissFor === 'session') return sessionStorage.getItem(`sx-ann:${id}`) === '1';
    if (dismissFor === 'day') return Date.now() - Number(localStorage.getItem(`sx-ann:${id}`) ?? 0) < DAY_MS;
  } catch { return false; }
  return getDismissedBannerIds().includes(id);
}
function rememberDismiss(id: string, dismissFor: 'forever' | 'day' | 'session') {
  try {
    if (dismissFor === 'session') sessionStorage.setItem(`sx-ann:${id}`, '1');
    else if (dismissFor === 'day') localStorage.setItem(`sx-ann:${id}`, String(Date.now()));
    else dismissBanner(id);
  } catch { /* storage blocked: the bar simply hides for this page view */ }
}

function useCountdown(endAt: string | null | undefined): string | null {
  const end = endAt ? new Date(endAt).getTime() : NaN;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!Number.isFinite(end)) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [end]);
  if (!Number.isFinite(end) || end <= now) return null;
  const s = Math.floor((end - now) / 1000);
  const d = Math.floor(s / 86400);
  const pad = (n: number) => String(n).padStart(2, '0');
  const hms = `${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  return d > 0 ? `${d}d ${hms}` : hms;
}

function CouponButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" onClick={() => { void navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); }}
      aria-label={`Copy code ${code}`}
      className="inline-flex items-center gap-1.5 cursor-pointer bg-transparent px-2 py-0.5 rounded-md shrink-0"
      style={{ border: '1px dashed currentColor', color: 'inherit', font: 'inherit', fontWeight: 700, letterSpacing: '0.04em' }}>
      {code} {copied ? <Check size={12} /> : <Copy size={12} />}
      <span className="sr-only" aria-live="polite">{copied ? 'Copied' : ''}</span>
    </button>
  );
}

/** Per-store dismissible announcement bar — seller-controlled content, scoped
 *  by `storeId` so dismissing one store's message never hides another's.
 *  Platform-wide Announcements (admin broadcast) are a separate, unrelated
 *  system — they arrive as real per-store Notifications instead, not a banner. */
export function StoreAnnouncementBar({
  storeId, message, type, ctaLabel, ctaLink, couponCode, moreMessages, rotateSeconds = 5, closable = true, bgColor, bgColor2, textColor,
  align = 'left', animation = 'slide', marqueeSpeed = 'normal', fontSize = 'sm', uppercase = false, bold = false, showIcon = true,
  device = 'all', dismissFor = 'forever', countdownEndAt, themeColors, className,
}: StoreAnnouncementBarProps) {
  const messages: AnnouncementMessage[] = [
    ...(message ? [{ message, ctaLabel, ctaLink, couponCode }] : []),
    ...(moreMessages ?? []).filter(m => m.message && !m.hidden),
  ];
  // Any change to the wording brings a dismissed bar back.
  const id = `store:${storeId}:${messages.map(m => m.message).join('|')}`;
  const [closedId, setClosedId] = useState<string | null>(null);
  const dismissed = closedId === id || wasDismissed(id, dismissFor);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = messages.length;
  const marquee = animation === 'marquee';
  const countdown = useCountdown(countdownEndAt);

  useEffect(() => {
    if (marquee || count < 2 || paused) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % count), Math.min(15, Math.max(3, rotateSeconds)) * 1000);
    return () => clearInterval(timer);
  }, [count, paused, rotateSeconds, marquee]);

  if (count === 0 || dismissed) return null;
  const current = messages[Math.min(index, count - 1)];
  const { Icon, bg, border, text } = STYLE[type] ?? STYLE.info;

  // Retailer colours > the theme's colours > the legacy per-type tint.
  const custom = bgColor || textColor || bgColor2;
  const base = custom
    ? { background: bgColor || themeColors?.bg, color: textColor || themeColors?.text, borderColor: themeColors?.border }
    : themeColors ? { background: themeColors.bg, color: themeColors.text, borderColor: themeColors.border } : null;
  const palette: CSSProperties | null = base && bgColor2 ? { ...base, background: `linear-gradient(90deg, ${base.background ?? bgColor2}, ${bgColor2})` } : base;
  const textClass = palette ? '' : text;
  const typeStyle: CSSProperties = {
    fontSize: FONT_SIZE[fontSize], fontWeight: bold ? 700 : 500,
    textTransform: uppercase ? 'uppercase' : undefined, letterSpacing: uppercase ? '0.06em' : undefined,
  };
  const containerClass = `${DEVICE_CLASS[device]} items-center gap-3 px-4 border-b relative overflow-hidden ${palette ? '' : `${bg} ${border}`} ${className ?? ''}`;
  const stepStyle = { color: 'inherit', opacity: 0.7 } as const;

  const renderMessage = (m: AnnouncementMessage, key?: string | number) => {
    const hasLink = m.ctaLabel && m.ctaLink && SAFE_LINK.test(m.ctaLink);
    return (
      <span key={key} className={`inline-flex items-center gap-2 ${marquee ? 'shrink-0 px-8' : 'flex-wrap'}`}>
        <span className={textClass}>{m.message}</span>
        {m.couponCode && <CouponButton code={m.couponCode} />}
        {hasLink && <a href={m.ctaLink!} className={`underline font-semibold ${textClass}`} style={{ color: 'inherit' }}>{m.ctaLabel}</a>}
      </span>
    );
  };

  return (
    <div
      className={containerClass}
      style={{ ...(palette ?? {}), paddingTop: PAD_Y[fontSize], paddingBottom: PAD_Y[fontSize] }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      role="region"
      aria-label="Announcement"
    >
      <style>{KEYFRAMES}</style>
      {!marquee && count > 1 && (
        <button type="button" aria-label="Previous announcement" onClick={() => setIndex(i => (i - 1 + count) % count)}
          className="shrink-0 bg-transparent border-0 cursor-pointer p-0" style={stepStyle}><ChevronLeft size={14} /></button>
      )}
      {showIcon && !marquee && <Icon size={15} className={`${textClass} shrink-0`} />}
      {marquee ? (
        <div className="flex-1 min-w-0 overflow-hidden" style={typeStyle} aria-live="off">
          <div className="sx-ann-anim flex w-max" style={{ animation: `sx-ann-marquee ${MARQUEE_SECONDS[marqueeSpeed] * Math.max(1, count / 2)}s linear infinite`, animationPlayState: paused ? 'paused' : 'running' }}>
            {[0, 1].map(copy => (
              <div key={copy} className="flex shrink-0" aria-hidden={copy === 1 || undefined}>
                {messages.map((m, i) => renderMessage(m, `${copy}-${i}`))}
                {countdown && <span className="shrink-0 px-8 tabular-nums font-bold">{countdown}</span>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={`flex-1 min-w-0 flex items-center gap-2 flex-wrap ${align === 'center' ? 'justify-center text-center' : ''}`} style={typeStyle} aria-live={count > 1 ? 'off' : 'polite'}>
          <span key={index} className="sx-ann-anim inline-flex items-center gap-2 flex-wrap" style={count > 1 ? { animation: `${animation === 'fade' ? 'sx-ann-fade' : 'sx-ann-slide'} 0.45s ease` } : undefined}>
            {renderMessage(current)}
          </span>
          {countdown && <span className="tabular-nums font-bold px-2 py-0.5 rounded-md" style={{ background: 'rgba(0,0,0,0.12)' }} aria-label={`Ends in ${countdown}`}>{countdown}</span>}
        </div>
      )}
      {!marquee && count > 1 && (
        <button type="button" aria-label="Next announcement" onClick={() => setIndex(i => (i + 1) % count)}
          className="shrink-0 bg-transparent border-0 cursor-pointer p-0" style={stepStyle}><ChevronRight size={14} /></button>
      )}
      {closable && (
        <button
          onClick={() => { rememberDismiss(id, dismissFor); setClosedId(id); }}
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
