import { useEffect, useRef, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ChromeIcon } from './ChromeIcon';
import { ChromeQrCode } from './ChromeQrCode';
import type { ChromePopup as PopupData } from './chromeTypes';

/** The look a popup borrows from the active theme, so it feels native in every theme. */
export interface ChromeTheme { bg: string; fg: string; accent: string; accentText: string; font?: string; radius: string }

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

/** Modal a seller-built item opens: heading, text, image, designed QR, button, share icons — all optional. */
export function ChromePopup({ popup, theme, onClose }: { popup: PopupData; theme: ChromeTheme; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; prev?.focus?.(); };
  }, [onClose]);

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const box: CSSProperties = {
    background: theme.bg, color: theme.fg, fontFamily: theme.font, borderRadius: `min(${theme.radius}, 24px)`,
    width: `min(100%, ${WIDTH[popup.width] ?? 460}px)`, maxHeight: 'min(88vh, 760px)', overflowY: 'auto', position: 'relative', padding: 28,
    boxShadow: '0 24px 60px rgba(0,0,0,.35)',
  };

  return createPortal(
    <div role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div role="dialog" aria-modal="true" aria-label={popup.title || 'Information'} style={box}>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close"
          style={{ position: 'absolute', top: 10, insetInlineEnd: 10, width: 36, height: 36, display: 'grid', placeItems: 'center', border: 0, borderRadius: 999, background: 'transparent', color: 'inherit', cursor: 'pointer' }}>
          <X size={20} />
        </button>
        {popup.title && <h2 style={{ margin: '0 36px 12px 0', fontSize: 24, lineHeight: 1.25, fontWeight: 600 }}>{popup.title}</h2>}
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {popup.body && <p style={{ margin: 0, flex: '1 1 220px', whiteSpace: 'pre-line', fontSize: 15, lineHeight: 1.6, opacity: 0.9 }}>{popup.body}</p>}
          {(popup.qr || popup.imageUrl) && (
            <div style={{ flex: '0 0 auto', margin: '0 auto' }}>
              {popup.qr ? <ChromeQrCode qr={popup.qr} size={popup.width === 'sm' ? 150 : 190} font={theme.font} />
                : <img src={popup.imageUrl} alt="" style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 8, display: 'block' }} />}
            </div>
          )}
        </div>
        {popup.qr && popup.imageUrl && <img src={popup.imageUrl} alt="" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, display: 'block', margin: '16px auto 0' }} />}
        {popup.buttonLabel && popup.buttonUrl && (
          <a href={popup.buttonUrl} {...(/^https?:/i.test(popup.buttonUrl) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            style={{ display: 'inline-block', marginTop: 20, padding: '11px 22px', background: theme.accent, color: theme.accentText, borderRadius: theme.radius, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            {popup.buttonLabel}
          </a>
        )}
        {popup.showShare && (
          <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, opacity: 0.7 }}>Share:</span>
            {shareLinks(pageUrl).map(s => (
              <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${s.label}`}
                style={{ width: 36, height: 36, display: 'grid', placeItems: 'center', borderRadius: 999, background: `color-mix(in srgb, ${theme.fg} 8%, transparent)`, color: theme.fg }}>
                <ChromeIcon icon={s.key} size={17} />
              </a>
            ))}
          </div>
        )}
        {popup.footnote && <p style={{ margin: '18px 0 0', fontSize: 12, opacity: 0.65, whiteSpace: 'pre-line' }}>{popup.footnote}</p>}
      </div>
    </div>,
    document.body,
  );
}
