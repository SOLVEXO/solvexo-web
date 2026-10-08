import { useId, useState } from 'react';
import { StoreBannersHero } from '../components/AtelierBannerCarousel';
import { Link } from 'react-router-dom';
import type { Section, Block } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { AtelierButton } from '../components/AtelierButton';
import { cloudinaryUrl, cloudinarySrcSet } from '@/utils/cloudinaryImage';
import { atelierTheme as t, type AtelierSectionColors } from '../theme.config';
import { registerAtelierSection } from './atelierSectionRenderer';
import { PreviewBlock } from '../../previewInspector';
import { HeroCarousel, type HeroCarouselSettings } from '../../HeroCarousel';
import { focalOf, mobileHeightOf, MOBILE_MAX, type HeightPreset } from '../../imageFit';

const HEIGHT_PX: Record<string, string> = { small: '360px', medium: '560px', large: '760px' };

/** One breakpoint's sizing: a fixed-height box that crops the image (`cover`), or `adapt` — the image keeps its
 *  own proportions and the slide is exactly as tall as the image. */
function sizeRules(scope: string, adapt: boolean, height: string) {
  return adapt
    ? `${scope}{min-height:0}${scope} .ai{min-height:0}${scope} .ai img{display:block;width:100%;height:auto;min-height:0}`
    : `${scope}{min-height:${height}}${scope} .ai{min-height:320px}${scope} .ai img{display:block;width:100%;height:100%;min-height:320px;object-fit:cover}`;
}

function HeroSlide({ block, colors, height, mobileHeight, eager }: {
  block: Block; colors: AtelierSectionColors; height?: HeightPreset; mobileHeight?: HeightPreset; eager: boolean;
}) {
  const { resolveLink } = useStorefront();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const s = block.settings;
  const [errored, setErrored] = useState(false);
  const link = s.ctaLink ? resolveLink(s.ctaLink) : null;
  const align: 'left' | 'center' | 'right' = s.contentAlign === 'center' || s.contentAlign === 'right' ? s.contentAlign : 'left';
  const textColor: string | undefined = /^#[0-9a-fA-F]{6}$/.test(s.textColor ?? '') ? s.textColor : undefined;
  const hasImage = !!s.imageUrl && !errored;
  const scope = `.ah-${uid}`;
  const mPreset = mobileHeight ?? height;
  const css = [
    sizeRules(scope, hasImage && height === 'adapt', HEIGHT_PX[height ?? ''] ?? HEIGHT_PX.medium),
    `@media (max-width:${MOBILE_MAX}px){`,
    sizeRules(scope, hasImage && mPreset === 'adapt', HEIGHT_PX[mPreset ?? ''] ?? HEIGHT_PX.medium),
    `}`,
  ].join('');

  return (
    <section className={`ah-${uid} grid grid-cols-1 lg:grid-cols-2 items-stretch`}>
      <style>{css}</style>
      <div
        className={`flex flex-col justify-center gap-6 order-2 lg:order-1 ${align === 'center' ? 'items-center text-center' : align === 'right' ? 'items-end text-right' : ''}`}
        style={{ padding: `48px ${t.layout.containerPadX}` }}
      >
        {s.subheading && (
          <p style={{ fontFamily: t.fonts.body, fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: textColor ?? colors.accent }}>
            {s.subheading}
          </p>
        )}
        {s.heading && (
          <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(32px, 4.5vw, 54px)', fontWeight: 600, color: textColor ?? colors.ink, lineHeight: 1.08, maxWidth: '560px' }}>
            {s.heading}
          </h1>
        )}
        {s.ctaText && link && (
          <div>
            {link.to ? (
              <Link to={link.to} className="no-underline"><AtelierButton>{s.ctaText}</AtelierButton></Link>
            ) : (
              <a href={link.href} className="no-underline"><AtelierButton>{s.ctaText}</AtelierButton></a>
            )}
          </div>
        )}
      </div>
      <div className="ai order-1 lg:order-2" style={{ background: colors.bgAlt }}>
        {hasImage ? (
          <img
            src={cloudinaryUrl(s.imageUrl, 1200)}
            srcSet={cloudinarySrcSet(s.imageUrl, [640, 900, 1200, 1600])}
            sizes="(min-width: 1024px) 50vw, 100vw"
            alt={s.heading ?? ''}
            onError={() => setErrored(true)}
            style={{ objectPosition: focalOf(s.focalPoint) }}
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={eager ? 'high' : 'auto'}
          />
        ) : null}
      </div>
    </section>
  );
}

function HeroSection({ blocks, colors, settings }: { blocks: Block[]; colors: AtelierSectionColors; settings: HeroCarouselSettings }) {
  // No slides of its own → show the store's Store Banners at this position.
  if (blocks.length === 0) return <StoreBannersHero adapt={settings.heightPreset === 'adapt'} />;
  const blockIds = blocks.map((b, i) => String(b._id ?? i));
  const mobileHeight = mobileHeightOf(settings.heightPreset, settings.mobileHeightPreset);

  return (
    <HeroCarousel
      blockIds={blockIds}
      settings={settings}
      colors={{ active: colors.ink, inactive: colors.border, controlBg: 'rgba(255,255,255,0.92)', controlFg: colors.ink }}
      slides={blocks.map((block, i) => (
        <PreviewBlock key={blockIds[i]} blockId={blockIds[i]}>
          <HeroSlide block={block} colors={colors} height={settings.heightPreset} mobileHeight={mobileHeight} eager={i === 0} />
        </PreviewBlock>
      ))}
    />
  );
}

registerAtelierSection('hero', (section: Section, blocks: Block[], colors: AtelierSectionColors) => <HeroSection blocks={blocks} colors={colors} settings={section.settings ?? {}} />);
