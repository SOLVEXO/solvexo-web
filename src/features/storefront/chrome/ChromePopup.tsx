import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ChromeIcon } from './ChromeIcon';
import { ChromeQrCode } from './ChromeQrCode';
import { POPUP_PARTS, type ChromePopup as PopupData, type PopupPart } from './chromeTypes';

/** The look a popup borrows from the active theme, so it feels native in every theme. The seller can override each piece. */
export interface ChromeTheme {
  bg: string; fg: string; accent: string; accentText: string; font?: string; radius: string;
  /** Heading font and border colour of the theme (fall back to `font` / a faint line). */
  fontDisplay?: string; border?: string; buttonRadius?: string;
}

const WIDTH = { sm: 360, md: 460, lg: 620 } as const;

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
 * What a seller-built item opens. Parts (heading, text, image, QR, button, share icons, small print) go in the order the seller chose,
 * either in one column or with the QR/image beside the text. It opens right under its trigger (like a dropdown) or as a centred
 * window. Colours, radius, width, padding and text sizes are the seller's to set; anything left empty follows the theme.
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
  const bg = hex(popup.bg) ?? theme.bg;
  const fg = hex(popup.fg) ?? theme.fg;
  const radius = popup.radius >= 0 ? `${popup.radius}px` : `min(${theme.radius}, 24px)`;
  const pad = popup.padding >= 0 ? popup.padding : 28;
  const widthPx = popup.widthPx > 0 ? popup.widthPx : WIDTH[popup.width] ?? 460;
  const align = popup.align === 'center' ? 'center' : 'left';
  const stack = popup.layout === 'stack';
  const order: PopupPart[] = Array.isArray(popup.order) ? popup.order.filter((k): k is PopupPart => POPUP_PARTS.includes(k)) : [...POPUP_PARTS];
  const line = theme.border ?? `color-mix(in srgb, ${fg} 14%, transparent)`;

  const parts: Record<PopupPart, ReactNode> = {
    title: popup.title ? <h2 key="title" style={{ margin: 0, fontSize: popup.titleSize > 0 ? popup.titleSize : 24, lineHeight: 1.25, fontWeight: 600, fontFamily: theme.fontDisplay ?? theme.font }}>{popup.title}</h2> : null,
    body: popup.body ? <p key="body" style={{ margin: 0, whiteSpace: 'pre-line', fontSize: popup.bodySize > 0 ? popup.bodySize : 15, lineHeight: 1.6, opacity: 0.9 }}>{popup.body}</p> : null,
    image: popup.imageUrl ? <img key="image" src={popup.imageUrl} alt="" style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 8, display: 'block' }} /> : null,
    qr: popup.qr ? <ChromeQrCode key="qr" qr={popup.qr} size={stack ? 200 : widthPx < 420 ? 150 : 190} font={theme.font} /> : null,
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
  const media = order.filter(k => k === 'image' || k === 'qr');
  const text = order.filter(k => k !== 'image' && k !== 'qr');
  const col: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16, textAlign: align, alignItems: align === 'center' ? 'center' : 'stretch', minWidth: 0 };

  const content = stack
    ? <div style={col}>{order.map(k => parts[k])}</div>
    : (
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ ...col, flex: '1 1 240px' }}>{text.map(k => parts[k])}</div>
        {media.length > 0 && <div style={{ ...col, flex: '0 0 auto', margin: '0 auto', alignItems: 'center' }}>{media.map(k => parts[k])}</div>}
      </div>
    );

  const box: CSSProperties = {
    background: bg, color: fg, fontFamily: theme.font, borderRadius: radius, padding: pad, position: 'relative',
    width: `min(${widthPx}px, calc(100vw - 24px))`, maxHeight: 'min(86vh, 800px)', overflowY: 'auto',
    boxShadow: popup.shadow === false ? 'none' : '0 18px 48px rgba(0,0,0,.28)', border: popup.border ? `1px solid ${line}` : 'none',
  };
  const closeBtn = (
    <button ref={closeRef} type="button" onClick={onClose} aria-label="Close"
      style={{ position: 'absolute', top: 8, insetInlineEnd: 8, width: 34, height: 34, display: 'grid', placeItems: 'center', border: 0, borderRadius: 999, background: 'transparent', color: 'inherit', cursor: 'pointer' }}>
      <X size={19} />
    </button>
  );
  const labelled = popup.title || 'Information';

  if (anchored) {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const w = Math.min(widthPx, vw - 24);
    const left = pos ? Math.max(12, Math.min(pos.left, vw - w - 12)) : 12;
    return createPortal(
      <div role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
        <div ref={boxRef} role="dialog" aria-label={labelled} style={{ ...box, position: 'fixed', top: pos?.top ?? 0, left, visibility: pos ? 'visible' : 'hidden', borderStartStartRadius: 0, borderStartEndRadius: 0 }}>
          {closeBtn}
          <div style={{ paddingInlineEnd: 20 }}>{content}</div>
        </div>
      </div>,
      document.body,
    );
  }
  return createPortal(
    <div role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div ref={boxRef} role="dialog" aria-modal="true" aria-label={labelled} style={box}>
        {closeBtn}
        <div style={{ paddingInlineEnd: 20 }}>{content}</div>
      </div>
    </div>,
    document.body,
  );
}
