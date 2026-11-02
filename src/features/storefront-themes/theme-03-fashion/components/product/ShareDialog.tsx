import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Mail, MessageCircle, X } from 'lucide-react';
import { shareTargets } from '../../../core/content/blogUtils';
import { fashionTheme as t } from '../../theme.config';

const BRAND: Record<string, string> = { x: 'X', facebook: 'f', pinterest: 'P' };

/** Copy-link box plus social share buttons; the shared link opens this product page on the store. */
export function ShareDialog({ url, title, image, onClose }: { url: string; title: string; image?: string; onClose: () => void }) {
  const { t: tr } = useTranslation('storefront');
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 2000); }
    catch { window.prompt(tr('pg.copy_this_link', 'Copy this link'), url); }
  };
  const circle: CSSProperties = { width: 40, height: 40, borderRadius: 9999, background: t.colors.bgAlt, color: t.colors.ink, border: 0, cursor: 'pointer', fontFamily: t.fonts.body, fontSize: 14, fontWeight: 700 };

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center p-4" style={{ background: 'rgba(0,0,0,.45)' }} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={tr('pg.copy_link', 'Copy link')} className="w-full max-w-[460px] p-5" style={{ background: t.colors.bg, color: t.colors.ink, borderRadius: 16, fontFamily: t.fonts.body }}>
        <div className="mb-4 flex items-center justify-between">
          <strong>{tr('pg.copy_link', 'Copy link')}</strong>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={tr('pg.close', 'Close')} style={{ background: 'none', border: 0, cursor: 'pointer', color: t.colors.ink }}><X size={18} aria-hidden /></button>
        </div>
        <div className="flex gap-2">
          <input readOnly value={url} dir="ltr" aria-label={tr('pg.copy_link', 'Copy link')} onFocus={e => e.currentTarget.select()} className="min-w-0 flex-1 px-3 py-2 text-sm" style={{ border: `1px solid ${t.colors.border}`, borderRadius: t.buttonRadiusPx, background: t.colors.bg, color: t.colors.ink }} />
          <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1 px-4 text-xs font-semibold uppercase" style={{ background: t.colors.bgAlt, color: t.colors.ink, border: 0, borderRadius: t.buttonRadiusPx, cursor: 'pointer' }}>
            {copied && <Check size={14} aria-hidden />}{copied ? tr('product.linkCopied', 'Link copied') : tr('pg.copy', 'Copy')}
          </button>
        </div>
        <p className="mb-2 mt-5 text-sm font-semibold">{tr('product.share', 'Share')}</p>
        <div className="flex flex-wrap gap-2">
          {shareTargets(url, title, image).filter(s => t.share[s.key as keyof typeof t.share] !== false).map(s => (
            <a key={s.key} href={s.href} {...(s.key === 'email' ? {} : { target: '_blank', rel: 'noopener noreferrer' })} aria-label={s.label} title={s.label} className="grid place-items-center no-underline" style={circle}>
              {s.key === 'email' ? <Mail size={16} aria-hidden /> : s.key === 'whatsapp' ? <MessageCircle size={16} aria-hidden /> : BRAND[s.key]}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
