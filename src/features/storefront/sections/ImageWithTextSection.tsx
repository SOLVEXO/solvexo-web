import { useNavigate } from 'react-router-dom';
import { useStorefront } from '../StorefrontContext';
import { ThemedButton } from '../ThemedButton';

interface ImageTextBlock {
  imageUrl:      string;
  heading?:      string;
  body?:         string;
  ctaText?:      string;
  ctaLink?:      { linkType: string; pageSlug?: string; url?: string };
  imagePosition?: 'left' | 'right';
}

export function ImageWithTextSection({ blocks }: { settings: Record<string, any>; blocks: ImageTextBlock[] }) {
  const { cfg, resolveLink } = useStorefront();
  const navigate = useNavigate();

  const goTo = (link?: ImageTextBlock['ctaLink']) => {
    if (!link) return;
    const { to, href } = resolveLink(link);
    if (to) navigate(to);
    else if (href) window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="px-4 sm:px-6 lg:px-10 flex flex-col gap-10" style={{ paddingTop: 32 * cfg.sectionSpacingScale, paddingBottom: 32 * cfg.sectionSpacingScale }}>
      {blocks.map((block, i) => (
        <div key={i} className={`flex flex-col md:flex-row gap-6 items-center mx-auto ${block.imagePosition === 'right' ? 'md:flex-row-reverse' : ''}`} style={{ maxWidth: Math.round(1000 * cfg.containerWidthScale) }}>
          <img src={block.imageUrl} alt={block.heading ?? ''} className="w-full md:w-1/2 object-cover aspect-[4/3]" style={{ borderRadius: cfg.imageRadiusPx }} />
          <div className="w-full md:w-1/2 flex flex-col gap-2">
            {block.heading && <h3 className="font-bold" style={{ color: cfg.textColor, fontSize: Math.round(20 * cfg.typeScaleFactor) }}>{block.heading}</h3>}
            {block.body && <p className="text-[14px] leading-relaxed" style={{ color: cfg.textColor }}>{block.body}</p>}
            {block.ctaText && (
              <ThemedButton onClick={() => goTo(block.ctaLink)} className="self-start mt-2">
                {block.ctaText}
              </ThemedButton>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
