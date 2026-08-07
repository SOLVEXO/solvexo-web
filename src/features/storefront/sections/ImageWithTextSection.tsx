import { useNavigate } from 'react-router-dom';
import { useStorefront } from '../StorefrontContext';

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
    <div className="px-4 sm:px-6 lg:px-10 py-8 flex flex-col gap-10">
      {blocks.map((block, i) => (
        <div key={i} className={`flex flex-col md:flex-row gap-6 items-center max-w-[1000px] mx-auto ${block.imagePosition === 'right' ? 'md:flex-row-reverse' : ''}`}>
          <img src={block.imageUrl} alt={block.heading ?? ''} className="w-full md:w-1/2 rounded-xl object-cover aspect-[4/3]" />
          <div className="w-full md:w-1/2 flex flex-col gap-2">
            {block.heading && <h3 className="text-[20px] font-bold" style={{ color: cfg.textColor }}>{block.heading}</h3>}
            {block.body && <p className="text-[14px] leading-relaxed" style={{ color: cfg.textColor }}>{block.body}</p>}
            {block.ctaText && (
              <button onClick={() => goTo(block.ctaLink)}
                className="self-start mt-2 px-4 py-[9px] rounded-lg text-[13px] font-bold text-white border-none cursor-pointer"
                style={{ background: cfg.primaryColor }}>
                {block.ctaText}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
