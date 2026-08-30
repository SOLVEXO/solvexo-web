import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Section, Block } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { AtelierButton } from '../components/AtelierButton';
import { cloudinaryUrl, cloudinarySrcSet } from '@/utils/cloudinaryImage';
import { atelierTheme as t } from '../theme.config';
import { registerAtelierSection } from './atelierSectionRenderer';

const HEIGHT_PX: Record<string, string> = { small: '360px', medium: '560px', large: '760px' };

function HeroSlide({ block }: { block: Block }) {
  const { resolveLink } = useStorefront();
  const s = block.settings;
  const [errored, setErrored] = useState(false);
  const link = s.ctaLink ? resolveLink(s.ctaLink) : null;

  return (
    <section
      className="grid grid-cols-1 lg:grid-cols-2 items-stretch"
      style={{ minHeight: HEIGHT_PX[block.settings.heightPreset] ?? HEIGHT_PX.medium }}
    >
      <div
        className="flex flex-col justify-center gap-6 order-2 lg:order-1"
        style={{ padding: `48px ${t.layout.containerPadX}` }}
      >
        {s.subheading && (
          <p style={{ fontFamily: t.fonts.body, fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: t.colors.accent }}>
            {s.subheading}
          </p>
        )}
        {s.heading && (
          <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(32px, 4.5vw, 54px)', fontWeight: 600, color: t.colors.ink, lineHeight: 1.08, maxWidth: '560px' }}>
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
      <div className="order-1 lg:order-2" style={{ background: t.colors.bgAlt, minHeight: '320px' }}>
        {s.imageUrl && !errored ? (
          <img
            src={cloudinaryUrl(s.imageUrl, 1200)}
            srcSet={cloudinarySrcSet(s.imageUrl, [640, 900, 1200, 1600])}
            sizes="(min-width: 1024px) 50vw, 100vw"
            alt={s.heading ?? ''}
            onError={() => setErrored(true)}
            className="w-full h-full object-cover"
            style={{ minHeight: '320px' }}
            loading="eager"
            fetchPriority="high"
          />
        ) : null}
      </div>
    </section>
  );
}

function HeroSection({ blocks }: { blocks: Block[] }) {
  const [active, setActive] = useState(0);
  if (blocks.length === 0) return null;
  const slide = blocks[Math.min(active, blocks.length - 1)];

  return (
    <div className="relative">
      <HeroSlide block={slide} />
      {blocks.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {blocks.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
              className="cursor-pointer border-0 p-0"
              style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === active ? t.colors.ink : t.colors.border }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

registerAtelierSection('hero', (_section: Section, blocks: Block[]) => <HeroSection blocks={blocks} />);
