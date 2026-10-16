import { useEffect, useState, type CSSProperties } from 'react';
import { Info, Percent, Tag, AlertTriangle, Truck, PartyPopper, X, ChevronLeft, ChevronRight, Copy, Check, type LucideIcon } from 'lucide-react';
import { getDismissedBannerIds, dismissBanner } from '@/utils/dismissedBanners';
import { fashionTheme as t } from '../theme.config';

export type AnnouncementType = 'info' | 'sale' | 'coupon' | 'warning' | 'shipping' | 'holiday';
interface AnnouncementMessage { message: string; ctaLabel?: string | null; ctaLink?: string | null; couponCode?: string | null; hidden?: boolean }

interface Props {
  storeId: string;
  message: string | null;
  type: AnnouncementType;
  ctaLabel?: string | null;
  ctaLink?: string | null;
  couponCode?: string | null;
  /** Extra messages that rotate after the first. */
  moreMessages?: AnnouncementMessage[];
  /** Seconds each message stays up (3-15). */
  rotateSeconds?: number;
  closable?: boolean;
  /** Retailer colours (hex) win over the theme's. `bgColor2` makes a left-to-right gradient. */
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
  linkStyle?: 'underline' | 'button';
  barHeight?: 'sm' | 'md' | 'lg';
}

const ICON: Record<AnnouncementType, LucideIcon> = { info: Info, sale: Percent, coupon: Tag, warning: AlertTriangle, shipping: Truck, holiday: PartyPopper };
const SAFE_LINK = /^(https?:\/\/|\/(?!\/))/i;
const FONT_SIZE = { sm: '13px', md: '14px', lg: '16px' } as const;
const BAR_PAD_Y = { sm: '7px', md: '11px', lg: '18px' } as const;
const MARQUEE_SECONDS = { slow: 40, normal: 26, fast: 14 } as const;
const DEVICE_CLASS = { all: 'flex', mobile: 'flex lg:hidden', desktop: 'hidden lg:flex' } as const;
const DAY_MS = 86_400_000;

const KEYFRAMES = `
@keyframes fx-ann-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes fx-ann-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes fx-ann-slide { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .fx-ann-anim { animation: none !important; } }
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
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
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
    <button type="button" aria-label={`Copy code ${code}`}
      onClick={() => { void navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); }}
      className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-transparent px-3 py-0.5"
      style={{ border: '1px dashed currentColor', color: 'inherit', font: 'inherit', fontWeight: 600, letterSpacing: '0.04em' }}>
      {code} {copied ? <Check size={12} /> : <Copy size={12} />}
      <span className="sr-only" aria-live="polite">{copied ? 'Copied' : ''}</span>
    </button>
  );
}

/** Maison announcement bar: per-store, dismissible, rotating or marquee, optional coupon + countdown. */
export function FashionAnnouncementBar({
  storeId, message, type, ctaLabel, ctaLink, couponCode, moreMessages, rotateSeconds = 5, closable = true, bgColor, bgColor2, textColor,
  align = 'left', animation = 'slide', marqueeSpeed = 'normal', fontSize = 'sm', uppercase = false, bold = false, showIcon = true,
  device = 'all', dismissFor = 'forever', countdownEndAt, linkStyle = 'underline', barHeight = 'md',
}: Props) {
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
  const Icon = ICON[type] ?? Info;

  const fg = textColor || t.colors.bg;
  const from = bgColor || t.colors.ink;
  const palette: CSSProperties = { background: bgColor2 ? `linear-gradient(90deg, ${from}, ${bgColor2})` : from, color: fg };
  const typeStyle: CSSProperties = {
    fontSize: FONT_SIZE[fontSize], fontWeight: bold ? 700 : 500, fontFamily: t.fonts.body,
    textTransform: uppercase ? 'uppercase' : undefined, letterSpacing: uppercase ? '0.06em' : undefined,
  };
  const step = 'grid size-7 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 transition-colors hover:bg-white/15';

  const renderMessage = (m: AnnouncementMessage, key?: string | number) => {
    const hasLink = m.ctaLabel && m.ctaLink && SAFE_LINK.test(m.ctaLink);
    return (
      <span key={key} className={`inline-flex items-center gap-2.5 ${marquee ? 'shrink-0 px-8' : 'flex-wrap'}`}>
        <span>{m.message}</span>
        {m.couponCode && <CouponButton code={m.couponCode} />}
        {hasLink && (linkStyle === 'button'
          ? <a href={m.ctaLink!} className="shrink-0 font-semibold no-underline" style={{ color: 'inherit', border: '1.5px solid currentColor', borderRadius: 9999, padding: '3px 14px', fontSize: '0.92em' }}>{m.ctaLabel}</a>
          : <a href={m.ctaLink!} className="font-semibold underline underline-offset-2" style={{ color: 'inherit' }}>{m.ctaLabel}</a>)}
      </span>
    );
  };

  return (
    <div
      className={`${DEVICE_CLASS[device]} relative items-center gap-3 overflow-hidden px-4`}
      style={{ ...palette, paddingTop: BAR_PAD_Y[barHeight], paddingBottom: BAR_PAD_Y[barHeight] }}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      role="region" aria-label="Announcement"
    >
      <style>{KEYFRAMES}</style>
      {!marquee && count > 1 && <button type="button" aria-label="Previous announcement" onClick={() => setIndex(i => (i - 1 + count) % count)} className={step} style={{ color: 'inherit' }}><ChevronLeft size={15} /></button>}
      {showIcon && !marquee && <Icon size={15} className="shrink-0" />}
      {marquee ? (
        <div className="min-w-0 flex-1 overflow-hidden" style={typeStyle} aria-live="off">
          <div className="fx-ann-anim flex w-max" style={{ animation: `fx-ann-marquee ${MARQUEE_SECONDS[marqueeSpeed] * Math.max(1, count / 2)}s linear infinite`, animationPlayState: paused ? 'paused' : 'running' }}>
            {[0, 1].map(copy => (
              <div key={copy} className="flex shrink-0" aria-hidden={copy === 1 || undefined}>
                {messages.map((m, i) => renderMessage(m, `${copy}-${i}`))}
                {countdown && <span className="shrink-0 px-8 font-bold tabular-nums">{countdown}</span>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={`flex min-w-0 flex-1 flex-wrap items-center gap-2.5 ${align === 'center' ? 'justify-center text-center' : ''}`} style={typeStyle} aria-live={count > 1 ? 'off' : 'polite'}>
          <span key={index} className="fx-ann-anim inline-flex flex-wrap items-center gap-2.5" style={count > 1 ? { animation: `${animation === 'fade' ? 'fx-ann-fade' : 'fx-ann-slide'} .45s ease` } : undefined}>
            {renderMessage(current)}
          </span>
          {countdown && <span className="rounded-full px-3 py-0.5 font-bold tabular-nums" style={{ background: 'rgba(255,255,255,0.18)' }} aria-label={`Ends in ${countdown}`}>{countdown}</span>}
        </div>
      )}
      {!marquee && count > 1 && <button type="button" aria-label="Next announcement" onClick={() => setIndex(i => (i + 1) % count)} className={step} style={{ color: 'inherit' }}><ChevronRight size={15} /></button>}
      {closable && (
        <button type="button" aria-label="Dismiss announcement" onClick={() => { rememberDismiss(id, dismissFor); setClosedId(id); }} className={step} style={{ color: 'inherit' }}>
          <X size={15} />
        </button>
      )}
    </div>
  );
}
