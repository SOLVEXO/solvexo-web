import { useMemo, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Section, Block } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { renderRichText } from '@/utils/richText';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { PreviewBlock } from './previewInspector';
import { imageFit, focalOf } from './imageFit';

// Theme-agnostic implementations of the Shopify-parity section library
// (multicolumn, logo_list, marquee, custom_html, image_banner). Each theme
// registers these through its own registry, passing its own design tokens +
// button, so one implementation looks native in every theme and a new theme
// gets all five by adding five one-line registrations.

export interface SharedThemeTokens {
  fonts: { display: string; body: string };
  layout: { maxWidth: string; sectionPadY: string; containerPadX: string };
  imageRadiusPx: string;
  Button: ComponentType<{ variant?: 'primary' | 'outline'; children?: ReactNode }>;
}
export interface SharedColors { bg: string; bgAlt: string; ink: string; inkMuted: string; border: string; accent: string }

interface Props { section: Section; blocks: Block[]; colors: SharedColors; theme: SharedThemeTokens }

function useCta() {
  const { resolveLink } = useStorefront();
  return resolveLink;
}

function CtaButton({ text, link, theme, variant = 'outline' }: { text?: string; link?: any; theme: SharedThemeTokens; variant?: 'primary' | 'outline' }) {
  const resolveLink = useCta();
  if (!text || !link) return null;
  const target = resolveLink(link);
  const B = theme.Button;
  return target.to
    ? <Link to={target.to} className="no-underline"><B variant={variant}>{text}</B></Link>
    : <a href={target.href} className="no-underline"><B variant={variant}>{text}</B></a>;
}

function Heading({ text, theme, colors, align }: { text?: string; theme: SharedThemeTokens; colors: SharedColors; align?: CSSProperties['textAlign'] }) {
  if (!text) return null;
  return <h2 style={{ fontFamily: theme.fonts.display, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 600, color: colors.ink, textAlign: align, marginBottom: '28px' }}>{text}</h2>;
}

// ── Multicolumn ─────────────────────────────────────────────────────────────
function Column({ block, colors, theme, ratio, align }: { block: Block; colors: SharedColors; theme: SharedThemeTokens; ratio: unknown; align: 'left' | 'center' }) {
  const s = block.settings;
  const [errored, setErrored] = useState(false);
  const fit = imageFit(ratio, '4 / 3');
  return (
    <div style={{ textAlign: align }}>
      {s.imageUrl && !errored && (
        <div style={{ ...fit.box, background: colors.bgAlt, borderRadius: theme.imageRadiusPx, overflow: 'hidden', marginBottom: '16px' }}>
          <img src={s.imageUrl} alt={s.heading ?? ''} loading="lazy" onError={() => setErrored(true)} style={fit.img} />
        </div>
      )}
      {s.heading && <h3 style={{ fontFamily: theme.fonts.display, fontSize: '19px', fontWeight: 600, color: colors.ink, marginBottom: '8px' }}>{s.heading}</h3>}
      {s.body && <p style={{ fontFamily: theme.fonts.body, fontSize: '14px', color: colors.inkMuted, lineHeight: 1.7, marginBottom: s.ctaText ? '16px' : 0 }}>{renderRichText(s.body)}</p>}
      <CtaButton text={s.ctaText} link={s.ctaLink} theme={theme} />
    </div>
  );
}

export function MulticolumnSection({ section, blocks, colors, theme }: Props) {
  if (blocks.length === 0) return null;
  const cols = [1, 2, 3, 4].includes(Number(section.settings.columns)) ? Number(section.settings.columns) : Math.min(blocks.length, 3);
  const align = section.settings.textAlign === 'center' ? 'center' : 'left';
  return (
    <div style={{ padding: `${theme.layout.sectionPadY} ${theme.layout.containerPadX}` }}>
      <div className="mx-auto" style={{ maxWidth: theme.layout.maxWidth }}>
        <Heading text={section.settings.heading} theme={theme} colors={colors} align={align} />
        <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${Math.floor(960 / cols)}px), 1fr))` }}>
          {blocks.map((b, i) => (
            <PreviewBlock key={b._id ?? i} blockId={String(b._id ?? i)}>
              <Column block={b} colors={colors} theme={theme} ratio={section.settings.imageRatio} align={align} />
            </PreviewBlock>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Logo list ───────────────────────────────────────────────────────────────
function Logo({ block, height, grayscale }: { block: Block; height: number; grayscale: boolean }) {
  const resolveLink = useCta();
  const s = block.settings;
  if (!s.imageUrl) return null;
  const img = <img src={s.imageUrl} alt={s.alt ?? ''} loading="lazy" style={{ height, width: 'auto', maxWidth: '180px', objectFit: 'contain', filter: grayscale ? 'grayscale(1)' : undefined, opacity: grayscale ? 0.7 : 1 }} />;
  if (!s.link) return img;
  const target = resolveLink(s.link);
  return target.to ? <Link to={target.to}>{img}</Link> : <a href={target.href}>{img}</a>;
}

export function LogoListSection({ section, blocks, colors, theme }: Props) {
  if (blocks.length === 0) return null;
  const height = Number(section.settings.logoHeight) || 48;
  return (
    <div style={{ padding: `${theme.layout.sectionPadY} ${theme.layout.containerPadX}` }}>
      <div className="mx-auto" style={{ maxWidth: theme.layout.maxWidth }}>
        <Heading text={section.settings.heading} theme={theme} colors={colors} align="center" />
        <div className="flex flex-wrap items-center justify-center" style={{ gap: '28px 48px' }}>
          {blocks.map((b, i) => (
            <PreviewBlock key={b._id ?? i} blockId={String(b._id ?? i)}>
              <Logo block={b} height={height} grayscale={section.settings.grayscale !== false} />
            </PreviewBlock>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Marquee (scrolling announcement text) ───────────────────────────────────
const MARQUEE_SECONDS = { slow: 40, medium: 25, fast: 12 } as const;

export function MarqueeSection({ section, blocks, colors, theme }: Props) {
  const resolveLink = useCta();
  if (blocks.length === 0) return null;
  const speed = MARQUEE_SECONDS[section.settings.speed as keyof typeof MARQUEE_SECONDS] ?? MARQUEE_SECONDS.medium;
  const reverse = section.settings.direction === 'right';
  const pause = section.settings.pauseOnHover !== false;
  const items = blocks.map((b, i) => {
    const text = <span style={{ fontFamily: theme.fonts.body, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, color: colors.ink, whiteSpace: 'nowrap' }}>{b.settings.text}</span>;
    const target = b.settings.link ? resolveLink(b.settings.link) : null;
    const inner = !target ? text : target.to ? <Link to={target.to} className="no-underline">{text}</Link> : <a href={target.href} className="no-underline">{text}</a>;
    return <PreviewBlock key={b._id ?? i} blockId={String(b._id ?? i)}><span className="inline-flex items-center" style={{ gap: '40px', paddingRight: '40px' }}>{inner}<span aria-hidden style={{ color: colors.accent }}>✦</span></span></PreviewBlock>;
  });
  const id = `mq-${String(section._id ?? 'x')}`;
  return (
    <div className={id} style={{ background: colors.bgAlt, borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, overflow: 'hidden', padding: '14px 0' }}>
      <style>{`
        .${id} .mq-track{display:flex;width:max-content;animation:mq-scroll ${speed}s linear infinite;animation-direction:${reverse ? 'reverse' : 'normal'}}
        ${pause ? `.${id}:hover .mq-track{animation-play-state:paused}` : ''}
        @keyframes mq-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @media (prefers-reduced-motion:reduce){.${id} .mq-track{animation:none}}
      `}</style>
      <div className="mq-track">
        <div className="flex">{items}{items}</div>
        <div className="flex" aria-hidden>{items}{items}</div>
      </div>
    </div>
  );
}

// ── Custom HTML ─────────────────────────────────────────────────────────────
export function CustomHtmlSection({ section, theme }: Props) {
  const html = useMemo(() => sanitizeHtml(String(section.settings.html ?? '')), [section.settings.html]);
  if (!html) return null;
  return (
    <div style={{ padding: `${theme.layout.sectionPadY} ${theme.layout.containerPadX}` }}>
      <div className="mx-auto" style={{ maxWidth: theme.layout.maxWidth }} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

// ── Image banner ────────────────────────────────────────────────────────────
const BANNER_HEIGHT = { small: '320px', medium: '480px', large: '640px' } as const;

export function ImageBannerSection({ section, colors, theme }: Props) {
  const s = section.settings;
  const [errored, setErrored] = useState(false);
  if (!s.imageUrl && !s.heading && !s.subheading) return null;
  const adapt = s.heightPreset === 'adapt' && s.imageUrl;
  const textColor = s.textColor || (s.imageUrl ? '#FFFFFF' : colors.ink);
  const align = s.contentAlign === 'center' ? 'center' : s.contentAlign === 'right' ? 'right' : 'left';
  const justify = s.contentPosition === 'top' ? 'flex-start' : s.contentPosition === 'bottom' ? 'flex-end' : 'center';
  const alignItems = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
  const overlay = Math.min(80, Math.max(0, Number(s.overlayOpacity ?? 30)));
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: colors.bgAlt, minHeight: adapt ? undefined : BANNER_HEIGHT[s.heightPreset as keyof typeof BANNER_HEIGHT] ?? BANNER_HEIGHT.medium }}>
      {s.imageUrl && !errored && (
        <img src={s.imageUrl} alt="" onError={() => setErrored(true)}
          style={adapt ? { display: 'block', width: '100%', height: 'auto' } : { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: focalOf(s.focalPoint) }} />
      )}
      {s.imageUrl && overlay > 0 && <div aria-hidden style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlay / 100})` }} />}
      <div style={{ position: adapt ? 'absolute' : 'relative', inset: adapt ? 0 : undefined, minHeight: adapt ? undefined : 'inherit', display: 'flex', flexDirection: 'column', justifyContent: justify, alignItems, textAlign: align, gap: '14px', padding: `48px ${theme.layout.containerPadX}`, color: textColor }}>
        <div style={{ width: '100%', maxWidth: theme.layout.maxWidth, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems, gap: '14px' }}>
          {s.heading && <h2 style={{ fontFamily: theme.fonts.display, fontSize: 'clamp(28px, 4.5vw, 52px)', fontWeight: 600, lineHeight: 1.1, maxWidth: '720px' }}>{s.heading}</h2>}
          {s.subheading && <p style={{ fontFamily: theme.fonts.body, fontSize: '16px', lineHeight: 1.6, maxWidth: '560px', opacity: 0.92 }}>{s.subheading}</p>}
          <CtaButton text={s.ctaText} link={s.ctaLink} theme={theme} variant="primary" />
        </div>
      </div>
    </div>
  );
}
