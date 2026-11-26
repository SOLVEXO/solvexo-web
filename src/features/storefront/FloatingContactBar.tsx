import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Mail, Phone, X } from 'lucide-react';
import { SocialIcon } from '@/features/storefront-themes/navigation/FooterParts';
import { ChromeIcon } from '@/features/storefront/chrome/ChromeIcon';
import { ChromePopup, type ChromeTheme } from '@/features/storefront/chrome/ChromePopup';
import type { ChromePopup as PopupData } from '@/features/storefront/chrome/chromeTypes';
import { ts } from '@/utils/tStatic';
import type { FloatingContactConfig } from '@/api/services/store';

/**
 * Floating contact bar (call / WhatsApp / social icons + the seller's own buttons and popups). Theme-agnostic: mounted once by
 * `StorefrontLayout`, so every theme (native or imported) shows it. It borrows the store's font, button radius and brand colour;
 * everything else (links, position, size, labels, shape, colours, a speech bubble) is the seller's own setting. Labels slide out
 * on hover/focus (not on touch screens).
 */

interface Item {
  key: string; label: string; href: string; bg: string; fg: string; icon: ReactNode; external: boolean;
  popup?: PopupData; device?: 'all' | 'desktop' | 'mobile';
}

const BRAND: Record<string, { bg: string; fg: string }> = {
  phone: { bg: '#F5B02E', fg: '#fff' },
  whatsapp: { bg: '#25D366', fg: '#fff' },
  email: { bg: '#EA4335', fg: '#fff' },
  facebook: { bg: '#3B5998', fg: '#fff' },
  instagram: { bg: 'linear-gradient(45deg,#FEDA75 0%,#FA7E1E 25%,#D62976 50%,#962FBF 75%,#4F5BD5 100%)', fg: '#fff' },
  tiktok: { bg: '#111111', fg: '#fff' },
  youtube: { bg: '#FF0000', fg: '#fff' },
  x: { bg: '#111111', fg: '#fff' },
  linkedin: { bg: '#0A66C2', fg: '#fff' },
  snapchat: { bg: '#FFFC00', fg: '#111' },
};

const BRAND_NAME: Record<string, string> = {
  facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', x: 'X', linkedin: 'LinkedIn', snapchat: 'Snapchat',
};

const SIZES = { sm: 40, md: 48, lg: 56 } as const;
const ORDER = ['facebook', 'instagram', 'tiktok', 'youtube', 'x', 'linkedin', 'snapchat'] as const;

function digits(v: string): string { return v.replace(/[^0-9]/g, ''); }

export function FloatingContactBar({ config, brandColor, font, radius }: {
  config: FloatingContactConfig; brandColor: string; font?: string; radius?: string;
}) {
  const { pathname } = useLocation();
  const [mounted, setMounted] = useState(false);
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [bubbleHidden, setBubbleHidden] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the server render must stay empty, then the bar mounts on the client
  useEffect(() => { setMounted(true); }, []);

  const items = useMemo<Item[]>(() => {
    const themed = config.style === 'theme';
    const paint = (k: string) => {
      const base = themed ? { bg: brandColor, fg: '#fff' } : BRAND[k];
      return { bg: config.customBg || base.bg, fg: config.customFg || base.fg };
    };
    const out: Item[] = [];
    const phone = config.phone.trim();
    if (phone) out.push({ key: 'phone', label: config.phoneLabel.trim() || ts('fc.call', 'Call us'), href: `tel:${phone.replace(/[^0-9+]/g, '')}`, ...paint('phone'), icon: <Phone size={22} strokeWidth={2.2} aria-hidden />, external: false });
    const wa = digits(config.whatsapp);
    if (wa) {
      const msg = config.whatsappMessage.trim();
      out.push({ key: 'whatsapp', label: config.whatsappLabel.trim() || ts('fc.whatsapp', 'Chat on WhatsApp'), href: `https://wa.me/${wa}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`, ...paint('whatsapp'), icon: <SocialIcon platform="whatsapp" size={24} />, external: true });
    }
    const email = config.email.trim();
    if (email) out.push({ key: 'email', label: config.emailLabel.trim() || ts('fc.email', 'Email us'), href: `mailto:${email}`, ...paint('email'), icon: <Mail size={22} strokeWidth={2.2} aria-hidden />, external: false });
    for (const k of ORDER) {
      const url = config[k];
      if (url) out.push({ key: k, label: BRAND_NAME[k], href: url, ...paint(k), icon: <SocialIcon platform={k} size={24} />, external: true });
    }
    for (const it of config.items ?? []) {
      if (it.kind === 'popup' && !it.popup) continue;
      if (it.kind === 'link' && !it.url) continue;
      out.push({
        key: it.id, label: it.label || it.icon, href: it.kind === 'popup' ? '' : it.url,
        bg: it.bg || config.customBg || (themed ? brandColor : '#111111'), fg: it.fg || config.customFg || '#fff',
        icon: <ChromeIcon icon={it.icon || 'link'} iconUrl={it.iconUrl} size={24} />,
        external: /^https?:/i.test(it.url) || it.newTab, popup: it.kind === 'popup' ? (it.popup ?? undefined) : undefined, device: it.device,
      });
    }
    return out;
  }, [config, brandColor]);

  // Checkout and sign-in screens stay clean.
  if (!mounted || !config.enabled || items.length === 0) return null;
  if (/^\/(checkout|login|register|verify-otp|forgot-password|new-password|reset-password)(\/|$)/.test(pathname)) return null;

  const size = config.sizePx > 0 ? config.sizePx : SIZES[config.size] ?? 48;
  const edge = Math.max(0, config.edgeOffset || 0);
  const lift = Math.max(0, config.bottomOffset || 0);
  const end = config.position !== 'left';
  const centre = config.position === 'center';
  const round = config.shape === 'round';
  const labelMode = config.labelMode ?? (config.showLabels ? 'hover' : 'none');
  const r = round ? '999px' : radius && /^\d/.test(radius) ? `min(${radius}, 14px)` : '0px';
  // Bottom gap: a round corner button sits above a sticky buy bar, a flush stack clears it too.
  const bottomGap = (round ? 24 : 96) + lift;
  const sideGap = (round ? 20 : 0) + edge;
  const vertical: CSSProperties = config.vertical === 'top' ? { top: '18%' }
    : config.vertical === 'bottom' ? { bottom: bottomGap }
    : { top: '50%', transform: 'translateY(-50%)' };
  const sideProp = end ? 'insetInlineEnd' : 'insetInlineStart';
  const boxPos: CSSProperties = centre
    ? { left: '50%', transform: `${config.vertical === 'middle' ? 'translateY(-50%) ' : ''}translateX(-50%)` }
    : { [sideProp]: sideGap };
  const showClass = config.device === 'desktop' ? 'fcb-desktop' : config.device === 'mobile' ? 'fcb-mobile' : '';
  const popupTheme: ChromeTheme = { bg: '#ffffff', fg: '#161412', accent: brandColor, accentText: '#ffffff', font, radius: radius && /^\d/.test(radius) ? `min(${radius}, 18px)` : '12px', popup: { variant: 'card' } };
  const bubble = (config.bubbleText ?? '').trim();
  const gapPx = config.gapPx >= 0 ? config.gapPx : round ? 12 : 2;
  const bubbleStyle: CSSProperties = centre
    ? { bottom: bottomGap + size + 12, left: '50%', transform: 'translateX(-50%)' }
    : { bottom: bottomGap + size / 2 - 20, [sideProp]: sideGap + size + 12 };

  return (
    <>
      <style>{`
        .fcb{position:fixed;z-index:60;display:flex;flex-direction:column;gap:var(--fcb-gap,2px);font-family:var(--fcb-font,inherit)}
        .fcb-i{display:flex;align-items:stretch;text-decoration:none;color:var(--fg);overflow:hidden;width:max-content;cursor:pointer;border:0;padding:0;font:inherit;
          border-start-start-radius:var(--rs);border-end-start-radius:var(--rs);border-start-end-radius:var(--re);border-end-end-radius:var(--re);
          background:var(--bg);align-self:var(--self);transition:filter .15s}
        .fcb-round .fcb-i{box-shadow:0 6px 18px rgba(0,0,0,.25)}
        .fcb-i:hover,.fcb-i:focus-visible{filter:brightness(1.06)}
        .fcb-i:focus-visible{outline:2px solid #fff;outline-offset:-4px}
        .fcb-ic{display:flex;align-items:center;justify-content:center;width:var(--s);height:var(--s);flex:none}
        .fcb-l{display:flex;align-items:center;max-width:0;opacity:0;white-space:nowrap;font-size:15px;font-weight:500;
          transition:max-width .28s ease,opacity .2s ease,padding .28s ease;padding:0}
        @media (hover:hover){
          .fcb-i:hover .fcb-l,.fcb-i:focus-visible .fcb-l{max-width:220px;opacity:1;padding-inline:18px 4px}
        }
        .fcb-end .fcb-i:hover .fcb-l,.fcb-end .fcb-i:focus-visible .fcb-l{padding-inline:18px 4px}
        .fcb-start .fcb-i:hover .fcb-l,.fcb-start .fcb-i:focus-visible .fcb-l{padding-inline:4px 18px}
        .fcb-nolabel .fcb-l{display:none}
        .fcb-always .fcb-l{max-width:220px;opacity:1;padding-inline:18px 4px}
        .fcb-start.fcb-always .fcb-l{padding-inline:4px 18px}
        .fcb-bubble{position:fixed;z-index:60;display:flex;align-items:center;gap:6px;background:#fff;color:#161412;border-radius:10px;padding:8px 8px 8px 14px;
          font-size:13px;font-weight:500;box-shadow:0 6px 18px rgba(0,0,0,.18);font-family:var(--fcb-font,inherit);max-width:min(220px,50vw)}
        .fcb-bubble button{border:0;background:transparent;cursor:pointer;color:inherit;display:grid;place-items:center;padding:2px;opacity:.6}
        @media (max-width:767px){.fcb{--s:${Math.max(36, size - 8)}px!important}.fcb-desktop,.fcb-item-desktop{display:none}}
        @media (min-width:768px){.fcb-mobile,.fcb-item-mobile{display:none}}
        @media print{.fcb,.fcb-bubble{display:none}}
        @media (prefers-reduced-motion:reduce){.fcb-l,.fcb-i{transition:none}}
      `}</style>
      <nav
        className={['fcb', end ? 'fcb-end' : 'fcb-start', round ? 'fcb-round' : '', labelMode === 'none' || round ? 'fcb-nolabel' : labelMode === 'always' ? 'fcb-always' : '', showClass].filter(Boolean).join(' ')}
        aria-label={ts('fc.aria', 'Contact us')}
        style={{ ...vertical, ...boxPos, ['--s' as string]: `${size}px`, ['--fcb-gap' as string]: `${gapPx}px`, ['--fcb-font' as string]: font || 'inherit' } as CSSProperties}
      >
        {items.map(it => {
          const style = {
            ['--bg' as string]: it.bg, ['--fg' as string]: it.fg,
            // Round only the corners that face the page, so the stack sits flush on the screen edge.
            ['--rs' as string]: round || end ? r : '0', ['--re' as string]: round || !end ? r : '0',
            ['--self' as string]: end ? 'flex-end' : 'flex-start',
            flexDirection: end ? 'row' : 'row-reverse',
          } as CSSProperties;
          const cls = `fcb-i${it.device === 'desktop' ? ' fcb-item-desktop' : it.device === 'mobile' ? ' fcb-item-mobile' : ''}`;
          const inner = (<><span className="fcb-l">{it.label}</span><span className="fcb-ic">{it.icon}</span></>);
          if (it.popup) {
            return <button key={it.key} type="button" className={cls} aria-label={it.label} aria-haspopup="dialog" style={style} onClick={() => setPopup(it.popup ?? null)}>{inner}</button>;
          }
          return (
            <a key={it.key} className={cls} href={it.href} aria-label={it.label}
              {...(it.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} style={style}>
              {inner}
            </a>
          );
        })}
      </nav>
      {round && bubble && !bubbleHidden && (
        <div className={`fcb-bubble${showClass ? ` ${showClass}` : ''}`}
          style={{ ...bubbleStyle, ['--fcb-font' as string]: font || 'inherit' } as CSSProperties}>
          <span>{bubble}</span>
          <button type="button" aria-label="Close" onClick={() => setBubbleHidden(true)}><X size={14} /></button>
        </div>
      )}
      {popup && <ChromePopup popup={popup} theme={popupTheme} onClose={() => setPopup(null)} />}
    </>
  );
}
