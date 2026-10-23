import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useStorefront, type StorefrontLinkSettings } from '@/features/storefront/StorefrontContext';
import { fashionTheme as t, type FashionColors } from '../theme.config';
import { EditableText } from '../../inlineEdit';
import { ctaLook } from '../components/buttonLook';

/** Standard section frame: vertical rhythm from the merchant's spacing setting, centered content box (`mx-auto`
 *  so a section's "full width" option can lift it), optional eyebrow + heading + trailing action. */
export function SectionShell({ colors, eyebrow, heading, action, align = 'left', children, padY = true }: {
  colors: FashionColors; eyebrow?: string; heading?: string; action?: ReactNode; align?: 'left' | 'center'; children: ReactNode; padY?: boolean;
}) {
  return (
    <section style={{ padding: padY ? `${t.layout.sectionPadY} ${t.layout.containerPadX}` : `0 ${t.layout.containerPadX}`, color: colors.ink }}>
      <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth }}>
        {(heading || eyebrow) && (
          <header className={`mb-8 flex gap-4 md:mb-10 ${align === 'center' ? 'flex-col items-center text-center' : 'flex-wrap items-end justify-between'}`}>
            <div>
              {eyebrow && <p className="m-0 mb-2 text-sm font-medium" style={{ color: colors.inkMuted, fontFamily: t.fonts.body }}>{eyebrow}</p>}
              {heading && <h2 className="m-0 text-[clamp(26px,3.2vw,40px)] font-semibold leading-[1.15] tracking-tight" style={{ fontFamily: t.fonts.display, color: colors.ink }}><EditableText value={heading} settingKey="heading" /></h2>}
            </div>
            {action}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}

/** "See all" pill with the sliding arrow chip. */
export function TextLink({ to, children, colors }: { to: string; children: ReactNode; colors?: FashionColors }) {
  const cta = ctaLook('primary', colors);
  // size + hover padding live in `.fx-cta-sm` (inline padding would beat the hover rule and park the chip on the text)
  return (
    <Link to={to} className="fx-cta fx-cta-sm" style={cta.button}>
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
      <span className="fx-cta-icon" style={cta.chip}><ArrowUpRight size={15} /></span>
    </Link>
  );
}

/** A button-looking link that resolves a seller-authored link setting. */
export function LinkButton({ text, link, variant = 'primary', style }: { text?: string; link?: StorefrontLinkSettings; variant?: 'primary' | 'outline' | 'light'; style?: CSSProperties }) {
  const { resolveLink } = useStorefront();
  if (!text || !link) return null;
  const target = resolveLink(link);
  const cta = ctaLook(variant);
  const inner = <><span style={{ position: 'relative', zIndex: 1 }}>{text}</span><span className="fx-cta-icon" style={cta.chip}><ArrowUpRight size={16} /></span></>;
  const base: CSSProperties = { ...cta.button, ...style };
  return target.to
    ? <Link to={target.to} className="fx-cta" style={base}>{inner}</Link>
    : <a href={target.href ?? '#'} className="fx-cta" style={base} {...(target.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{inner}</a>;
}
