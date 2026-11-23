import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ChromeIcon } from './ChromeIcon';
import { ChromeQrCode } from './ChromeQrCode';
import { POPUP_PARTS, type ChromePopup as PopupData, type PopupPart } from './chromeTypes';

/** The structure a theme gives a popup when the seller leaves it on "follow my theme". */
export type PopupVariant = 'card' | 'panel' | 'glass';

/** Per-theme popup settings, passed from the theme's call site. Anything the seller sets on the popup wins over these. */
export interface ChromePopupTheme {
  variant?: PopupVariant;
  /** px between the strip and the popup. */
  gap?: number;
  /** CSS radius; default per variant. */
  radius?: string;
  shadow?: string;
  anim?: 'rise' | 'slide' | 'scale' | 'none';
  /** Colour of the accent line on top of a `panel`. */
  accentColor?: string;
  widthMode?: 'custom' | 'content' | 'full';
  /** The theme's content max width + side padding, so "content" / "full" line up with the page. */
  contentMaxWidth?: string;
  padX?: string;
}

/** The look a popup borrows from the active theme, so it feels native in every theme. The seller can override each piece. */
export interface ChromeTheme {
  bg: string; fg: string; accent: string; accentText: string; font?: string; radius: string;
  /** Heading font and border colour of the theme (fall back to `font` / a faint line). */
  fontDisplay?: string; border?: string; buttonRadius?: string;
  popup?: ChromePopupTheme;
}

interface VariantPreset { gap: number; radius?: string; shadow: string; anim: 'rise' | 'slide' | 'scale' | 'none'; widthMode: 'custom' | 'content' | 'full'; glass?: boolean; accentLine?: boolean }

const VARIANTS: Record<PopupVariant, VariantPreset> = {
  // Floating rounded card with a gap and a soft shadow.
  card: { gap: 10, shadow: '0 18px 48px rgba(0,0,0,.18)', anim: 'rise', widthMode: 'custom' },
  // Flat, square, wide panel attached under the strip, with a thin accent line on top.
  panel: { gap: 0, radius: '0px', shadow: '0 14px 30px rgba(0,0,0,.14)', anim: 'slide', widthMode: 'full', accentLine: true },
  // Frosted glass: translucent, blurred, large radius, floating.
  glass: { gap: 12, radius: '28px', shadow: '0 20px 60px rgba(40,30,20,.22)', anim: 'scale', widthMode: 'custom', glass: true },
};

const WIDTH = { sm: 360, md: 460, lg: 620 } as const;

const POPUP_CSS = `
@keyframes cpop-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes cpop-slide{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
@keyframes cpop-scale{from{opacity:0;transform:translateY(6px) scale(.97)}to{opacity:1;transform:none}}
.cpop-box{animation:var(--cpop-anim,none) 220ms cubic-bezier(.22,.61,.36,1) backwards}
.cpop-links{display:grid;grid-template-columns:repeat(var(--cpop-cols,2),minmax(0,1fr));gap:6px 20px}
@media (max-width:560px){.cpop-links{grid-template-columns:repeat(var(--cpop-cols-sm,1),minmax(0,1fr))}}
@media (prefers-reduced-motion:reduce){.cpop-box{animation:none}}
`;

function shareLinks(url: string): { key: string; label: string; href: string }[] {
  const u = encodeURIComponent(url);
  return [
    { key: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { key: 'x', label: 'X', href: `https://twitter.com/intent/tweet?url=${u}` },
    { key: 'pinterest', label: 'Pinterest', href: `https://pinterest.com/pin/create/button/?url=${u}` },
    { key: 'linkedin', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { key: 'telegram', label: 'Telegram', href: `https://t.me/share/url?url=${u}` },
    { key: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${u}` },
  ];
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const hex = (v: unknown): string | undefined => (typeof v === 'string' && HEX.test(v) ? v : undefined);

/** Where an anchored popup sits: just under the strip, starting at the item that opened it. */
export interface PopupAnchor { left: number; top: number }

/**
 * What a seller-built item opens. Parts (heading, text, links/menu, image, QR, button, share icons, small print) go in the order the
 * seller chose. It opens under its trigger (with the seller's gap) or as a centred window. Width can be fixed, as wide as the page
 * container, or edge to edge. Anything the seller leaves on "automatic" follows the theme's own popup structure (`theme.popup`).
 */
export function ChromePopup({ popup, theme, onClose, getAnchor }: {
  popup: PopupData; theme: ChromeTheme; onClose: () => void; getAnchor?: () => PopupAnchor | null;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const anchored = (popup.placement ?? 'below') === 'below' && !!getAnchor;
  const [pos, setPos] = useState<PopupAnchor | null>(null);

  useLayoutEffect(() => {
    if (!anchored || !getAnchor) return;
    const place = () => setPos(getAnchor());
    place();
    window.addEventListener('resize', place);
    document.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); document.removeEventListener('scroll', place, true); };
  }, [anchored, getAnchor]);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    if (!anchored) document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; prev?.focus?.({ preventScroll: true }); };
  }, [onClose, anchored]);

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  // --- resolve theme preset vs the seller's own values (the seller always wins) ---
  const themed = popup.style === 'theme';
  const tp = theme.popup ?? {};
  const preset: VariantPreset = { ...VARIANTS[tp.variant ?? 'card'] };
  if (tp.gap !== undefined) preset.gap = tp.gap;
  if (tp.radius !== undefined) preset.radius = tp.radius;
  if (tp.shadow !== undefined) preset.shadow = tp.shadow;
  if (tp.anim !== undefined) preset.anim = tp.anim;
  if (tp.widthMode !== undefined) preset.widthMode = tp.widthMode;
  const mode = popup.widthMode ?? 'auto';
  const effMode: 'custom' | 'content' | 'full' = mode === 'auto' ? (themed ? preset.widthMode : 'custom') : mode;
  const compact = effMode === 'full';
  const explicitGap = typeof popup.gap === 'number' && popup.gap >= 0;
  const gap = explicitGap ? popup.gap! : themed ? preset.gap : 0;
  const bg = hex(popup.bg) ?? (themed && preset.glass ? `color-mix(in srgb, ${theme.bg} 68%, transparent)` : theme.bg);
  const fg = hex(popup.fg) ?? theme.fg;
  const themeR = themed ? (preset.radius ?? `min(${theme.radius}, 24px)`) : `min(${theme.radius}, 24px)`;
  // An edge-to-edge panel only rounds its bottom corners (a flat top would otherwise look cut off).
  const radius = popup.radius >= 0 ? `${popup.radius}px`
    : compact ? (themed && themeR !== '0px' ? `0 0 ${themeR} ${themeR}` : '0px') : themeR;
  const pad = popup.padding >= 0 ? popup.padding : compact ? 20 : 28;
  const widthPx = popup.widthPx > 0 ? popup.widthPx : WIDTH[popup.width] ?? 460;
  const align = popup.align === 'center' ? 'center' : 'left';
  const stack = popup.layout === 'stack';
  const order: PopupPart[] = Array.isArray(popup.order) ? popup.order.filter((k): k is PopupPart => POPUP_PARTS.includes(k)) : [...POPUP_PARTS];
  const line = theme.border ?? `color-mix(in srgb, ${fg} 14%, transparent)`;
  const mh = popup.maxHeight ?? 0;
  const short = compact || (mh > 0 && mh < 480);
  const flatTop = anchored && gap === 0 && !compact;
  const anim = themed ? preset.anim : 'none';

  const links = Array.isArray(popup.links) ? popup.links.filter(l => l && l.label) : [];
  const cols = Math.min(6, Math.max(1, Math.round(popup.linksColumns ?? 2)));

  const parts: Record<PopupPart, ReactNode> = {
    title: popup.title ? <h2 key="title" style={{ margin: 0, fontSize: popup.titleSize > 0 ? popup.titleSize : compact ? 20 : 24, lineHeight: 1.25, fontWeight: 600, fontFamily: theme.fontDisplay ?? theme.font }}>{popup.title}</h2> : null,
    body: popup.body ? <p key="body" style={{ margin: 0, whiteSpace: 'pre-line', fontSize: popup.bodySize > 0 ? popup.bodySize : 15, lineHeight: 1.6, opacity: 0.9 }}>{popup.body}</p> : null,
    links: links.length > 0 ? (
      <div key="links" style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, textAlign: 'start' }}>
        {popup.linksTitle && <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', opacity: 0.7, fontFamily: theme.fontDisplay ?? theme.font }}>{popup.linksTitle}</h3>}
        <ul className="cpop-links" style={{ listStyle: 'none', margin: 0, padding: 0, ['--cpop-cols' as string]: cols, ['--cpop-cols-sm' as string]: Math.min(cols, 2) } as CSSProperties}>
          {links.map((l, i) => {
            const inner = (
              <>
                {l.icon && <span style={{ flex: '0 0 auto', display: 'inline-flex', opacity: 0.8 }}><ChromeIcon icon={l.icon} size={16} /></span>}
                <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{l.label}</span>
              </>
            );
            const st: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', fontSize: popup.bodySize > 0 ? popup.bodySize : 15, lineHeight: 1.4, fontWeight: l.bold ? 700 : 400, color: 'inherit', textDecoration: 'none' };
            return (
              <li key={i} style={{ minWidth: 0 }}>
                {l.url
                  ? <a href={l.url} {...(/^https?:/i.test(l.url) ? { target: '_blank', rel: 'noopener noreferrer' } : {})} style={st} className="hover:underline">{inner}</a>
                  : <span style={st}>{inner}</span>}
              </li>
            );
          })}
        </ul>
      </div>
    ) : null,
    image: popup.imageUrl ? <img key="image" src={popup.imageUrl} alt="" style={{ maxWidth: '100%', maxHeight: short ? 150 : 280, borderRadius: 8, display: 'block', objectFit: 'contain' }} /> : null,
    qr: popup.qr ? <ChromeQrCode key="qr" qr={popup.qr} size={short ? 130 : stack ? 200 : widthPx < 420 ? 150 : 190} font={theme.font} /> : null,
    button: popup.buttonLabel && popup.buttonUrl ? (
      <a key="button" href={popup.buttonUrl} {...(/^https?:/i.test(popup.buttonUrl) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        style={{ alignSelf: align === 'center' ? 'center' : 'flex-start', padding: '11px 22px', background: theme.accent, color: theme.accentText, borderRadius: theme.buttonRadius ?? theme.radius, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
        {popup.buttonLabel}
      </a>
    ) : null,
    share: popup.showShare ? (
      <div key="share" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
        <span style={{ fontSize: 13, opacity: 0.7 }}>Share:</span>
        {shareLinks(pageUrl).map(s => (
          <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${s.label}`}
            style={{ width: 36, height: 36, display: 'grid', placeItems: 'center', borderRadius: 999, background: `color-mix(in srgb, ${fg} 8%, transparent)`, color: fg }}>
            <ChromeIcon icon={s.key} size={17} />
          </a>
        ))}
      </div>
    ) : null,
    footnote: popup.footnote ? <p key="footnote" style={{ margin: 0, fontSize: 12, opacity: 0.65, whiteSpace: 'pre-line' }}>{popup.footnote}</p> : null,
  };
  const mp = popup.mediaPlacement ?? 'side';
  const media = order.filter(k => k === 'image' || k === 'qr');
  const col: CSSProperties = { display: 'flex', flexDirection: 'column', gap: short ? 12 : 16, textAlign: align, alignItems: align === 'center' ? 'center' : 'stretch', minWidth: 0 };
  const mediaRow: CSSProperties = { display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' };

  let content: ReactNode;
  if (stack) {
    content = <div style={col}>{order.map(k => parts[k])}</div>;
  } else if (mp === 'above' || mp === 'below') {
    const text = order.filter(k => k !== 'image' && k !== 'qr');
    const mediaNode = media.length > 0 ? <div key="media" style={mediaRow}>{media.map(k => parts[k])}</div> : null;
    content = <div style={col}>{mp === 'above' ? mediaNode : null}{text.map(k => parts[k])}{mp === 'below' ? mediaNode : null}</div>;
  } else {
    const text = order.filter(k => k !== 'image' && k !== 'qr' && k !== 'links');
    content = (
      <div style={col}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ ...col, flex: '1 1 240px' }}>{text.map(k => parts[k])}</div>
          {media.length > 0 && <div style={{ ...col, flex: '0 0 auto', margin: '0 auto', alignItems: 'center' }}>{media.map(k => parts[k])}</div>}
        </div>
        {order.includes('links') && parts.links}
      </div>
    );
  }

  const contentMax = theme.popup?.contentMaxWidth && /^\d/.test(theme.popup.contentMaxWidth) ? theme.popup.contentMaxWidth : '1200px';
  const padX = tp.padX ?? '16px';
  const avail = anchored && pos ? `calc(100vh - ${pos.top + gap}px - 12px)` : 'calc(100vh - 24px)';
  const maxH = mh > 0 ? `min(${mh}px, ${avail})` : compact ? `min(${avail}, 560px)` : `min(${avail}, 86vh, 800px)`;
  const accentLine = themed && preset.accentLine && !popup.border && !hex(popup.bg);
  const glass = themed && preset.glass && !hex(popup.bg);

  const box: CSSProperties = {
    background: bg, color: fg, fontFamily: theme.font, borderRadius: radius, position: 'relative', boxSizing: 'border-box',
    padding: compact ? `${pad}px 0` : pad, maxHeight: maxH, overflowY: 'auto', overscrollBehavior: 'contain',
    boxShadow: popup.shadow === false ? 'none' : themed ? preset.shadow : '0 18px 48px rgba(0,0,0,.28)',
    border: popup.border ? `1px solid ${line}` : glass ? '1px solid color-mix(in srgb, #ffffff 55%, transparent)' : 'none',
    ...(accentLine ? { borderTop: `3px solid ${tp.accentColor ?? theme.accent}` } : {}),
    ...(glass ? { backdropFilter: 'blur(18px) saturate(1.5)', WebkitBackdropFilter: 'blur(18px) saturate(1.5)' } : {}),
    ['--cpop-anim' as string]: `cpop-${anim === 'none' ? 'rise' : anim}`,
  } as CSSProperties;
  if (anim === 'none') (box as Record<string, unknown>)['--cpop-anim'] = 'none';

  const closeBtn = (
    <button ref={closeRef} type="button" onClick={onClose} aria-label="Close"
      style={{ position: 'absolute', top: 8, insetInlineEnd: 8, zIndex: 1, width: 34, height: 34, display: 'grid', placeItems: 'center', border: 0, borderRadius: 999, background: 'transparent', color: 'inherit', cursor: 'pointer' }}>
      <X size={19} />
    </button>
  );
  // "full" lines the content up with the page container while the panel itself runs edge to edge.
  const inner = compact
    ? <div style={{ boxSizing: 'border-box', width: `min(calc(${contentMax} - 2 * ${padX}), calc(100% - 2 * ${padX}))`, margin: '0 auto', paddingInlineEnd: 20 }}>{content}</div>
    : <div style={{ paddingInlineEnd: 20 }}>{content}</div>;
  const labelled = popup.title || 'Information';
  const css = <style>{POPUP_CSS}</style>;

  if (anchored) {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const top = (pos?.top ?? 0) + gap;
    let place: CSSProperties;
    if (effMode === 'full') place = { left: 0, right: 0, width: 'auto' };
    else if (effMode === 'content') place = { left: 0, right: 0, margin: '0 auto', width: `min(calc(${contentMax} - 2 * ${padX}), calc(100vw - 2 * ${padX}))` };
    else {
      const w = Math.min(widthPx, vw - 24);
      place = { left: pos ? Math.max(12, Math.min(pos.left, vw - w - 12)) : 12, width: `min(${widthPx}px, calc(100vw - 24px))` };
    }
    return createPortal(
      <div role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
        {css}
        <div ref={boxRef} role="dialog" aria-label={labelled} className="cpop-box"
          style={{ ...box, position: 'fixed', top, ...place, visibility: pos ? 'visible' : 'hidden', ...(flatTop ? { borderStartStartRadius: 0, borderStartEndRadius: 0 } : {}) }}>
          {closeBtn}
          {inner}
        </div>
      </div>,
      document.body,
    );
  }
  const centreW = effMode === 'full' ? '100%' : effMode === 'content' ? `min(${contentMax}, calc(100vw - 24px))` : `min(${widthPx}px, calc(100vw - 24px))`;
  return createPortal(
    <div role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: effMode === 'full' ? '12px 0' : 12 }}>
      {css}
      <div ref={boxRef} role="dialog" aria-modal="true" aria-label={labelled} className="cpop-box" style={{ ...box, width: centreW }}>
        {closeBtn}
        {inner}
      </div>
    </div>,
    document.body,
  );
}
