import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { SocialIcon } from '@/features/storefront-themes/navigation/FooterParts';
import { ts } from '@/utils/tStatic';
import type { FloatingContactConfig } from '@/api/services/store';

/**
 * Floating contact bar (call / WhatsApp / social icons). Theme-agnostic: mounted once by `StorefrontLayout`, so every theme
 * (native or imported) shows it. It borrows the store's font, button radius and brand colour from `cfg`; everything else
 * (links, position, size, labels) is the seller's own setting. Labels slide out on hover/focus (not on touch screens).
 */

interface Item { key: string; label: string; href: string; bg: string; fg: string; icon: ReactNode; external: boolean }

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
  useEffect(() => { setMounted(true); }, []);

  const items = useMemo<Item[]>(() => {
    const themed = config.style === 'theme';
    const paint = (k: string) => (themed ? { bg: brandColor, fg: '#fff' } : BRAND[k]);
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
    return out;
  }, [config, brandColor]);

  // Checkout and sign-in screens stay clean.
  if (!mounted || !config.enabled || items.length === 0) return null;
  if (/^\/(checkout|login|register|verify-otp|forgot-password|new-password|reset-password)(\/|$)/.test(pathname)) return null;

  const size = SIZES[config.size] ?? 48;
  const end = config.position !== 'left';
  const r = radius && /^\d/.test(radius) ? `min(${radius}, 14px)` : '0px';
  const vertical: CSSProperties = config.vertical === 'top' ? { top: '18%' }
    : config.vertical === 'bottom' ? { bottom: 96 }
    : { top: '50%', transform: 'translateY(-50%)' };
  const sideProp = end ? 'insetInlineEnd' : 'insetInlineStart';
  const showClass = config.device === 'desktop' ? 'fcb-desktop' : config.device === 'mobile' ? 'fcb-mobile' : '';

  return (
    <>
      <style>{`
        .fcb{position:fixed;z-index:60;display:flex;flex-direction:column;gap:2px;font-family:var(--fcb-font,inherit)}
        .fcb-i{display:flex;align-items:stretch;text-decoration:none;color:var(--fg);overflow:hidden;width:max-content;
          border-start-start-radius:var(--rs);border-end-start-radius:var(--rs);border-start-end-radius:var(--re);border-end-end-radius:var(--re);
          background:var(--bg);align-self:var(--self);transition:filter .15s}
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
        @media (max-width:767px){.fcb{--s:${Math.max(36, size - 8)}px!important}.fcb-desktop{display:none}}
        @media (min-width:768px){.fcb-mobile{display:none}}
        @media print{.fcb{display:none}}
        @media (prefers-reduced-motion:reduce){.fcb-l,.fcb-i{transition:none}}
      `}</style>
      <nav
        className={['fcb', end ? 'fcb-end' : 'fcb-start', config.showLabels ? '' : 'fcb-nolabel', showClass].filter(Boolean).join(' ')}
        aria-label={ts('fc.aria', 'Contact us')}
        style={{ ...vertical, [sideProp]: 0, ['--s' as string]: `${size}px`, ['--fcb-font' as string]: font || 'inherit' } as CSSProperties}
      >
        {items.map(it => (
          <a
            key={it.key}
            className="fcb-i"
            href={it.href}
            aria-label={it.label}
            {...(it.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            style={{
              ['--bg' as string]: it.bg, ['--fg' as string]: it.fg,
              // Round only the corners that face the page, so the stack sits flush on the screen edge.
              ['--rs' as string]: end ? r : '0', ['--re' as string]: end ? '0' : r,
              ['--self' as string]: end ? 'flex-end' : 'flex-start',
              flexDirection: end ? 'row' : 'row-reverse',
            } as CSSProperties}
          >
            <span className="fcb-l">{it.label}</span>
            <span className="fcb-ic">{it.icon}</span>
          </a>
        ))}
      </nav>
    </>
  );
}
