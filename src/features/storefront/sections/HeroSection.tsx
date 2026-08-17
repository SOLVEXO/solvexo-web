import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cloudinaryUrl, cloudinarySrcSet } from '@/utils/cloudinaryImage';
import { useStorefront } from '../StorefrontContext';

export interface HeroSectionSettings {
  heightPreset?: 'small' | 'medium' | 'large';
}

interface HeroSlide {
  imageUrl:       string;
  mobileImageUrl?: string;
  heading?:       string;
  subheading?:    string;
  ctaText?:       string;
  ctaLink?:       { linkType: string; pageSlug?: string; url?: string };
}

const HEIGHT_CLASS: Record<string, string> = {
  small:  'min-h-[220px] sm:min-h-[280px]',
  medium: 'min-h-[300px] sm:min-h-[380px]',
  large:  'min-h-[400px] sm:min-h-[500px]',
};

export function HeroSection({ settings, blocks }: { settings: HeroSectionSettings; blocks: HeroSlide[] }) {
  const { cfg, resolveLink } = useStorefront();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  if (blocks.length === 0) return null;
  const slide = blocks[index];
  const heightCls = HEIGHT_CLASS[settings.heightPreset ?? 'medium'];

  const goTo = (link?: HeroSlide['ctaLink']) => {
    if (!link) return;
    const { to, href } = resolveLink(link);
    if (to) navigate(to);
    else if (href) window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`relative w-full ${heightCls} flex items-end overflow-hidden`}>
      <img
        key={slide.imageUrl}
        src={cloudinaryUrl(slide.imageUrl, 1440)}
        srcSet={cloudinarySrcSet(slide.imageUrl)}
        sizes="100vw"
        alt={slide.heading ?? ''}
        className="absolute inset-0 w-full h-full object-cover"
        loading={index === 0 ? 'eager' : 'lazy'}
      />
      <div className="absolute inset-0 bg-black/35" />

      <div className="relative px-4 sm:px-6 lg:px-10 py-8 sm:py-12 max-w-[640px]">
        {slide.heading && <h1 className="text-[26px] sm:text-[36px] font-bold text-white mb-2 leading-tight">{slide.heading}</h1>}
        {slide.subheading && <p className="text-[13px] sm:text-[15px] text-white/85 mb-4">{slide.subheading}</p>}
        {slide.ctaText && (
          <button
            onClick={() => goTo(slide.ctaLink)}
            className="px-5 py-[10px] rounded-lg text-[13px] font-bold text-white border-none cursor-pointer"
            style={{ background: cfg.primaryColor }}
          >
            {slide.ctaText}
          </button>
        )}
      </div>

      {blocks.length > 1 && (
        <>
          <button onClick={() => setIndex(i => (i - 1 + blocks.length) % blocks.length)} aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center border-none cursor-pointer">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => setIndex(i => (i + 1) % blocks.length)} aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center border-none cursor-pointer">
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {blocks.map((_, i) => (
              <button key={i} onClick={() => setIndex(i)} aria-label={`Slide ${i + 1}`}
                className="w-2 h-2 rounded-full border-none cursor-pointer p-0"
                style={{ background: i === index ? '#fff' : 'rgba(255,255,255,0.5)' }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
