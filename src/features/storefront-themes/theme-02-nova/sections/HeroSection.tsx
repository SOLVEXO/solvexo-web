import { useId, useState, type CSSProperties } from 'react';
import { StoreBannersHero } from '../components/NovaBannerCarousel';
import { Link } from 'react-router-dom';
import type { Section, Block } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { NovaButton } from '../components/NovaButton';
import { cloudinaryUrl, cloudinarySrcSet } from '@/utils/cloudinaryImage';
import { novaTheme as t, type NovaSectionColors } from '../theme.config';
import { registerNovaSection } from './novaSectionRenderer';
import { PreviewBlock } from '../../previewInspector';
import { HeroCarousel, type HeroCarouselSettings } from '../../HeroCarousel';
import { focalOf, mobileHeightOf, MOBILE_MAX, type HeightPreset } from '../../imageFit';

const HEIGHT_PX: Record<string, string> = { small: '380px', medium: '580px', large: '780px' };

/** Per-slide layout rules for one breakpoint: either a fixed-height box that crops the image (`cover`), or
 *  `adapt` — the image keeps its own proportions and the slide is exactly as tall as the image. */
function mediaRules(scope: string, adapt: boolean, height: string) {
  return adapt
    ? `${scope} .m{min-height:0}${scope} .m img{position:static;display:block;width:100%;height:auto}`
    : `${scope} .m{min-height:${height}}${scope} .m img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}`;
}

function HeroSlide({ block, colors, height, mobileHeight, mobileTextBelow, eager }: {
  block: Block; colors: NovaSectionColors; height?: HeightPreset; mobileHeight?: HeightPreset; mobileTextBelow: boolean; eager: boolean;
}) {
  const { resolveLink } = useStorefront();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const s = block.settings;
  const [errored, setErrored] = useState(false);
  const link = s.ctaLink ? resolveLink(s.ctaLink) : null;
  const hasImage = !!s.imageUrl && !errored;
  const align: 'left' | 'center' | 'right' = s.contentAlign === 'center' || s.contentAlign === 'right' ? s.contentAlign : 'left';
  const textColor: string | undefined = /^#[0-9a-fA-F]{6}$/.test(s.textColor ?? '') ? s.textColor : undefined;

  // No image → nothing to adapt to, keep a normal-height banner for the text.
  const dAdapt = hasImage && height === 'adapt';
  const mPreset = mobileHeight ?? height;
  const mAdapt = hasImage && mPreset === 'adapt';
  const below = mobileTextBelow && hasImage;
  const scope = `.nh-${uid}`;
  const css = [
    `${scope}{display:grid;position:relative;background:${colors.bgAlt}}`,
    `${scope} .m,${scope} .t{grid-area:1/1}`,
    `${scope} .m{position:relative;overflow:hidden}`,
    `${scope} .ov{position:absolute;inset:0}`,
    `${scope} .t{position:relative;z-index:1;align-self:center;width:100%;max-width:620px}`,
    mediaRules(scope, dAdapt, HEIGHT_PX[height ?? ''] ?? HEIGHT_PX.medium),
    `@media (max-width:${MOBILE_MAX}px){`,
    mediaRules(scope, mAdapt, HEIGHT_PX[mPreset ?? ''] ?? HEIGHT_PX.medium),
    below
      ? `${scope} .m,${scope} .t{grid-area:auto}${scope} .ov{display:none}${scope} .t{max-width:none;justify-self:stretch!important;padding-top:24px!important;padding-bottom:28px!important;background:${colors.bg ?? '#fff'};--nh-h:${colors.ink}!important;--nh-s:${colors.accent}!important}`
      : '',
    `}`,
  ].join('');

  const onImage = hasImage;
  const vars = {
    '--nh-h': textColor ?? (onImage ? '#FFFFFF' : colors.ink),
    '--nh-s': textColor ?? (onImage ? '#C9C3FF' : colors.accent),
  } as CSSProperties;

  return (
    <section className={`nh-${uid}`}>
      <style>{css}</style>
      <div className="m">
        {hasImage && (
          <img
            src={cloudinaryUrl(s.imageUrl, 1600)}
            srcSet={cloudinarySrcSet(s.imageUrl, [640, 900, 1200, 1600])}
            sizes="100vw"
            alt={s.heading ?? ''}
            onError={() => setErrored(true)}
            style={{ objectPosition: focalOf(s.focalPoint) }}
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={eager ? 'high' : 'auto'}
          />
        )}
        {hasImage && (
          <div
            className="ov"
            style={{
              background: typeof s.overlayOpacity === 'number'
                ? `rgba(20,18,31,${Math.min(80, Math.max(0, s.overlayOpacity)) / 100})`
                : 'linear-gradient(90deg, rgba(20,18,31,0.55) 0%, rgba(20,18,31,0.05) 65%)',
            }}
          />
        )}
      </div>
      <div
        className="t flex flex-col gap-6"
        style={{
          ...vars,
          padding: `48px ${t.layout.containerPadX}`,
          justifySelf: align === 'center' ? 'center' : align === 'right' ? 'end' : 'start',
          alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
          textAlign: align,
        }}
      >
        {s.subheading && (
          <p style={{ fontFamily: t.fonts.body, fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--nh-s)' }}>
            {s.subheading}
          </p>
        )}
        {s.heading && (
          <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(30px, 5vw, 58px)', fontWeight: 700, color: 'var(--nh-h)', lineHeight: 1.05 }}>
            {s.heading}
          </h1>
        )}
        {s.ctaText && link && (
          <div>
            {link.to ? (
              <Link to={link.to} className="no-underline"><NovaButton>{s.ctaText}</NovaButton></Link>
            ) : (
              <a href={link.href} className="no-underline"><NovaButton>{s.ctaText}</NovaButton></a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function HeroSection({ blocks, colors, settings }: { blocks: Block[]; colors: NovaSectionColors; settings: HeroCarouselSettings }) {
  // No slides of its own → show the store's Store Banners at this position.
  if (blocks.length === 0) return <StoreBannersHero adapt={settings.heightPreset === 'adapt'} />;
  const blockIds = blocks.map((b, i) => String(b._id ?? i));
  const mobileHeight = mobileHeightOf(settings.heightPreset, settings.mobileHeightPreset);

  return (
    <HeroCarousel
      blockIds={blockIds}
      settings={settings}
      colors={{ active: colors.accent, inactive: 'rgba(255,255,255,0.5)', controlBg: 'rgba(255,255,255,0.92)', controlFg: '#14121F' }}
      slides={blocks.map((block, i) => (
        <PreviewBlock key={blockIds[i]} blockId={blockIds[i]}>
          <HeroSlide
            block={block} colors={colors} height={settings.heightPreset} mobileHeight={mobileHeight}
            mobileTextBelow={settings.mobileTextLayout === 'below'} eager={i === 0}
          />
        </PreviewBlock>
      ))}
    />
  );
}

registerNovaSection('hero', (section: Section, blocks: Block[], colors: NovaSectionColors) => <HeroSection blocks={blocks} colors={colors} settings={section.settings ?? {}} />);
