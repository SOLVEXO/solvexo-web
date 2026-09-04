import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Section, Block } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { NovaButton } from '../components/NovaButton';
import { cloudinaryUrl, cloudinarySrcSet } from '@/utils/cloudinaryImage';
import { novaTheme as t, type NovaSectionColors } from '../theme.config';
import { registerNovaSection } from './novaSectionRenderer';

const HEIGHT_PX: Record<string, string> = { small: '380px', medium: '580px', large: '780px' };

function HeroSlide({ block, colors }: { block: Block; colors: NovaSectionColors }) {
  const { resolveLink } = useStorefront();
  const s = block.settings;
  const [errored, setErrored] = useState(false);
  const link = s.ctaLink ? resolveLink(s.ctaLink) : null;

  return (
    <section
      className="relative flex items-center"
      style={{ minHeight: HEIGHT_PX[block.settings.heightPreset] ?? HEIGHT_PX.medium, background: colors.bgAlt }}
    >
      {s.imageUrl && !errored && (
        <img
          src={cloudinaryUrl(s.imageUrl, 1600)}
          srcSet={cloudinarySrcSet(s.imageUrl, [640, 900, 1200, 1600])}
          sizes="100vw"
          alt={s.heading ?? ''}
          onError={() => setErrored(true)}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
      )}
      {s.imageUrl && !errored && (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(20,18,31,0.55) 0%, rgba(20,18,31,0.05) 65%)' }} />
      )}
      <div className="relative flex flex-col gap-6" style={{ padding: `48px ${t.layout.containerPadX}`, maxWidth: '620px' }}>
        {s.subheading && (
          <p style={{ fontFamily: t.fonts.body, fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: s.imageUrl && !errored ? '#C9C3FF' : colors.accent }}>
            {s.subheading}
          </p>
        )}
        {s.heading && (
          <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(34px, 5vw, 58px)', fontWeight: 700, color: s.imageUrl && !errored ? '#FFFFFF' : colors.ink, lineHeight: 1.05 }}>
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

function HeroSection({ blocks, colors }: { blocks: Block[]; colors: NovaSectionColors }) {
  const [active, setActive] = useState(0);
  if (blocks.length === 0) return null;
  const slide = blocks[Math.min(active, blocks.length - 1)];

  return (
    <div className="relative">
      <HeroSlide block={slide} colors={colors} />
      {blocks.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {blocks.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
              className="cursor-pointer border-0 p-0"
              style={{ width: '22px', height: '5px', borderRadius: '9999px', background: i === active ? colors.accent : 'rgba(255,255,255,0.5)' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

registerNovaSection('hero', (_section: Section, blocks: Block[], colors: NovaSectionColors) => <HeroSection blocks={blocks} colors={colors} />);
