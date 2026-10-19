import { useState } from 'react';
import { ts } from '@/utils/tStatic';
import { Check, Link2, Mail, MessageCircle, Share2 } from 'lucide-react';
import { fashionTheme as t } from '../../theme.config';
import { shareTargets } from '../../../core/content/blogUtils';

const ICONS: Record<string, typeof Mail> = { email: Mail, whatsapp: MessageCircle };

/** Share an article: the device's share sheet when available, copy link, and X / Facebook / WhatsApp / email links. */
export function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 2200); } catch { window.prompt('Copy this link', url); }
  };
  const nativeShare = () => { navigator.share({ title, url }).catch(() => { /* dismissed */ }); };
  const chip = { width: 40, height: 40, borderRadius: 9999, border: `1px solid ${t.colors.border}`, background: 'transparent', color: t.colors.ink, cursor: 'pointer' } as const;

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={ts('pg.share_this_article', 'Share this article')}>
      <span className="mr-1 text-sm font-medium">{ts('product.share', 'Share')}</span>
      {canNativeShare && <button type="button" onClick={nativeShare} aria-label={ts('pg.share_using_your_device', 'Share using your device')} title={ts('product.share', 'Share')} className="grid place-items-center" style={chip}><Share2 size={16} aria-hidden /></button>}
      <button type="button" onClick={() => void copy()} aria-label={ts('pg.copy_link', 'Copy link')} title={ts('pg.copy_link', 'Copy link')} className="grid place-items-center" style={chip}>{copied ? <Check size={16} aria-hidden /> : <Link2 size={16} aria-hidden />}</button>
      {shareTargets(url, title).map(s => {
        const Icon = ICONS[s.key];
        return (
          <a key={s.key} href={s.href} {...(s.key === 'email' ? {} : { target: '_blank', rel: 'noopener noreferrer' })} aria-label={s.label} title={s.label} className="grid place-items-center text-[13px] font-semibold no-underline" style={chip}>
            {Icon ? <Icon size={16} aria-hidden /> : s.key === 'x' ? 'X' : 'f'}
          </a>
        );
      })}
      <span className="sr-only" role="status">{copied ? 'Link copied' : ''}</span>
    </div>
  );
}
