import { useStorefront } from '../StorefrontContext';

interface GalleryImageBlock {
  imageUrl: string;
  caption?: string;
}

// A plain image gallery — a fashion lookbook, room/lifestyle imagery
// (furniture), or a general portfolio grid. Deliberately just a grid, no
// lightbox/carousel, to keep this section simple and dependency-free.
export function GalleryGridSection({ settings, blocks }: { settings: { heading?: string }; blocks: GalleryImageBlock[] }) {
  const { cfg } = useStorefront();
  if (blocks.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-10" style={{ paddingTop: 32 * cfg.sectionSpacingScale, paddingBottom: 32 * cfg.sectionSpacingScale }}>
      {settings.heading && (
        <h2 className="font-bold mb-5 text-center" style={{ color: cfg.textColor, fontSize: Math.round(20 * cfg.typeScaleFactor) }}>
          {settings.heading}
        </h2>
      )}
      <div className="mx-auto grid grid-cols-2 sm:grid-cols-3 gap-3" style={{ maxWidth: Math.round(1100 * cfg.containerWidthScale) }}>
        {blocks.map((img, i) => (
          <figure key={i} className="relative overflow-hidden" style={{ borderRadius: cfg.imageRadiusPx, aspectRatio: '4 / 5' }}>
            <img src={img.imageUrl} alt={img.caption ?? ''} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
            {img.caption && (
              <figcaption
                className="absolute inset-x-0 bottom-0 px-3 py-2 text-[11.5px] text-white"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0))' }}
              >
                {img.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}
