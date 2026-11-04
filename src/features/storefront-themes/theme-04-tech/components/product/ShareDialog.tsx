/* eslint-disable react-refresh/only-export-components, jsx-a11y/no-static-element-interactions -- exports the custom-link parser too; the backdrop closes on click and Escape is handled by the dialog */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Link2, Mail, X } from 'lucide-react';
import { shareTargets } from '../../../core/content/blogUtils';
import { baseTheme as t } from '../../theme.base';

const svg = (d: string): ReactNode => <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden><path d={d} /></svg>;

const ICONS: Record<string, ReactNode> = {
  x: svg('M18.9 2H22l-7.2 8.2L23 22h-6.6l-5.2-6.8L5.2 22H2l7.7-8.8L1.5 2h6.8l4.7 6.2L18.9 2Zm-1.2 18h1.8L7.4 3.9H5.5L17.7 20Z'),
  facebook: svg('M13.5 22v-8.2h2.8l.5-3.3h-3.3V8.4c0-.9.4-1.7 1.8-1.7h1.6V3.8c-.3 0-1.3-.2-2.4-.2-2.5 0-4.1 1.5-4.1 4.2v2.7H7.6v3.3h2.8V22h3.1Z'),
  pinterest: svg('M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.5 1.8-2.5.9 0 1.3.6 1.3 1.4 0 .9-.5 2.1-.8 3.300-.2 1 .5 1.800 1.500 1.800 1.800 0 3.200-1.900 3.200-4.600 0-2.400-1.700-4.100-4.200-4.100-2.900 0-4.600 2.200-4.600 4.400 0 .9.300 1.800.8 2.300.1.100.1.200.1.300l-.3 1.200c0 .2-.2.200-.4.100-1.300-.6-2.100-2.500-2.100-4 0-3.300 2.400-6.400 6.900-6.400 3.600 0 6.400 2.600 6.400 6 0 3.600-2.300 6.500-5.400 6.500-1.100 0-2.100-.5-2.400-1.200l-.7 2.500c-.2.900-.9 2.100-1.300 2.800A10 10 0 1 0 12 2Z'),
  linkedin: svg('M20.4 2H3.6A1.6 1.6 0 0 0 2 3.6v16.8A1.6 1.6 0 0 0 3.6 22h16.8a1.6 1.6 0 0 0 1.6-1.6V3.6A1.6 1.6 0 0 0 20.4 2ZM8.1 18.7H5.3V9.9h2.8v8.8ZM6.7 8.7a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2Zm12 10h-2.8v-4.3c0-1 0-2.400-1.500-2.400s-1.700 1.100-1.700 2.300v4.400H9.900V9.900h2.700v1.200c.4-.7 1.300-1.400 2.600-1.400 2.800 0 3.400 1.900 3.400 4.400v4.600Z'),
  telegram: svg('M21.9 4.2 18.700 19.400c-.2 1-.9 1.300-1.700.8l-4.800-3.600-2.300 2.200c-.3.300-.5.500-1 .5l.3-4.900 8.900-8c.4-.3-.1-.5-.6-.2L6.500 13 1.800 11.500c-1-.3-1-1 .2-1.500L20.400 2.800c.9-.3 1.600.2 1.500 1.400Z'),
  whatsapp: svg('M12 2a10 10 0 0 0-8.600 15L2 22l5.200-1.400A10 10 0 1 0 12 2Zm0 18.200c-1.500 0-2.900-.4-4.100-1.200l-.3-.2-3 .8.8-2.900-.2-.3A8.200 8.200 0 1 1 12 20.200Zm4.500-6.100c-.2-.1-1.500-.7-1.700-.8-.2-.1-.4-.1-.6.100l-.8 1c-.1.200-.3.200-.5.100-1.400-.7-2.400-1.300-3.300-2.900-.2-.3.200-.3.700-1.100.1-.2 0-.3 0-.5l-.8-1.800c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.300-.7.700-1 1.500-.9 2.400.2 1 .7 1.900 1.300 2.700 1.200 1.700 2.700 3 4.600 3.800 1.700.6 2.300.7 3.200.5.700-.1 1.600-.7 1.800-1.400.2-.6.200-1.200.1-1.300-.1-.1-.3-.2-.6-.3Z'),
};

export interface CustomShareLink { label: string; href: (url: string, title: string) => string }

/** The seller's own share links, one per line: `Name | https://site.com/share?u={url}&t={title}` (max 10, https only). */
export function parseCustomShareLinks(text: unknown): CustomShareLink[] {
  if (typeof text !== 'string') return [];
  const out: CustomShareLink[] = [];
  for (const line of text.split(/\r?\n/)) {
    const i = line.indexOf('|');
    if (i < 1) continue;
    const label = line.slice(0, i).trim().slice(0, 30);
    const tpl = line.slice(i + 1).trim();
    if (!label || !/^https:\/\//i.test(tpl) || !tpl.includes('{url}')) continue;
    out.push({ label, href: (url, title) => tpl.replace(/\{url\}/g, encodeURIComponent(url)).replace(/\{title\}/g, encodeURIComponent(title)) });
    if (out.length === 10) break;
  }
  return out;
}

/** Copy-link box plus social share buttons; the shared link opens this product page on the store. */
export function ShareDialog({ url, title, image, settings, onClose }: { url: string; title: string; image?: string; settings?: Record<string, unknown>; onClose: () => void }) {
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
  const circle: CSSProperties = { width: 48, height: 48, borderRadius: 9999, background: t.colors.bgAlt, color: t.colors.ink, border: `1px solid ${t.colors.border}`, cursor: 'pointer', transition: 'background .15s, color .15s, border-color .15s' };
  const hover = (on: boolean) => (e: { currentTarget: HTMLElement }) => {
    const s = e.currentTarget.style;
    s.background = on ? t.colors.accent : t.colors.bgAlt;
    s.color = on ? t.colors.bg : t.colors.ink;
    s.borderColor = on ? t.colors.accent : t.colors.border;
  };

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center p-4" style={{ background: 'rgba(0,0,0,.5)' }} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={tr('pg.copy_link', 'Copy link')} className="w-full max-w-[480px] p-5 sm:p-6" style={{ background: t.colors.bg, color: t.colors.ink, borderRadius: t.productCardRadiusPx, fontFamily: t.fonts.body }}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <strong className="text-lg sm:text-xl" style={{ fontFamily: t.fonts.display, letterSpacing: '-.01em' }}>{tr('pg.copy_link', 'Copy link')}</strong>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={tr('pg.close', 'Close')} className="grid size-10 place-items-center" style={{ background: t.colors.bgAlt, border: 0, borderRadius: 9999, cursor: 'pointer', color: t.colors.ink }}><X size={18} aria-hidden /></button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Link2 size={16} aria-hidden className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2" style={{ color: t.colors.inkMuted }} />
            <input readOnly value={url} dir="ltr" aria-label={tr('pg.copy_link', 'Copy link')} onFocus={e => e.currentTarget.select()} className="h-12 w-full ps-11 pe-4 text-sm" style={{ border: `1px solid ${t.colors.border}`, borderRadius: t.buttonRadiusPx, background: t.colors.bg, color: t.colors.ink }} />
          </div>
          <button type="button" onClick={() => void copy()} className="inline-flex h-12 items-center justify-center gap-2 px-6 text-xs font-semibold uppercase tracking-wider" style={{ background: t.colors.accent, color: t.colors.bg, border: 0, borderRadius: t.buttonRadiusPx, cursor: 'pointer', minWidth: 110 }}>
            {copied && <Check size={14} aria-hidden />}{copied ? tr('product.linkCopied', 'Link copied') : tr('pg.copy', 'Copy')}
          </button>
        </div>
        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider" style={{ color: t.colors.inkMuted }}>{tr('product.share', 'Share')}</p>
        <div className="flex flex-wrap gap-2">
          {shareTargets(url, title, image).filter(s => {
            const own = settings?.[s.key];
            return own === 'show' || (own !== 'hide' && t.share[s.key as keyof typeof t.share] !== false);
          }).map(s => (
            <a key={s.key} href={s.href} {...(s.key === 'email' ? {} : { target: '_blank', rel: 'noopener noreferrer' })} aria-label={s.label} title={s.label} className="grid place-items-center no-underline" style={circle} onMouseEnter={hover(true)} onMouseLeave={hover(false)} onFocus={hover(true)} onBlur={hover(false)}>
              {s.key === 'email' ? <Mail size={22} aria-hidden /> : ICONS[s.key] ?? s.label.charAt(0)}
            </a>
          ))}
          {parseCustomShareLinks(settings?.customLinks).map(c => (
            <a key={c.label} href={c.href(url, title)} target="_blank" rel="noopener noreferrer" aria-label={c.label} title={c.label} className="grid place-items-center text-base font-bold no-underline" style={circle} onMouseEnter={hover(true)} onMouseLeave={hover(false)} onFocus={hover(true)} onBlur={hover(false)}>
              {Array.from(c.label)[0]?.toUpperCase()}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
