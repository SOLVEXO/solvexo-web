import { registerSection } from '../sectionRenderRegistry';
import { registerSectionSchema } from '../sectionSchemaRegistry';
import { registerBlockSchema } from '../blockSchemaRegistry';
import { clsx } from 'clsx';
import { Images } from 'lucide-react';
import { cloudinaryUrl, cloudinarySrcSet } from '@/utils/cloudinaryImage';
import { useStorefront } from '../StorefrontContext';

interface GalleryItem {
  imageUrl: string;
  caption?: string;
}

// A real CSS-columns masonry (not a fixed-height grid) at gently rounded
// corners with a calm, un-overlaid caption below each image — deliberately
// the "quiet" counterpart to `EditorialLookbookSection`'s bold overlaid-
// caption editorial look. Height presets rotate per index so the masonry
// effect is genuinely visible rather than a uniform grid in disguise.
const HEIGHT_PRESETS = ['aspect-[3/4]', 'aspect-square', 'aspect-[4/5]'];

export function SoftGallerySection({ settings, blocks }: { settings: { heading?: string }; blocks: GalleryItem[] }) {
  const { cfg } = useStorefront();
  if (blocks.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-10" style={{ paddingTop: 32 * cfg.sectionSpacingScale, paddingBottom: 32 * cfg.sectionSpacingScale }}>
      <div className="mx-auto" style={{ maxWidth: Math.round(1100 * cfg.containerWidthScale) }}>
        {settings.heading && (
          <h2 className="font-bold mb-5 text-center" style={{ color: cfg.textColor, fontSize: Math.round(20 * cfg.typeScaleFactor) }}>{settings.heading}</h2>
        )}
        <div className="columns-2 sm:columns-3 gap-3">
          {blocks.map((item, i) => (
            <div key={i} className="mb-3 break-inside-avoid">
              <div
                className={clsx('overflow-hidden rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.08)]', HEIGHT_PRESETS[i % HEIGHT_PRESETS.length])}
              >
                <img
                  src={cloudinaryUrl(item.imageUrl, 640)}
                  srcSet={cloudinarySrcSet(item.imageUrl)}
                  sizes="(min-width: 640px) 33vw, 50vw"
                  alt={item.caption ?? ''}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              {item.caption && <p className="text-[12px] text-center mt-1.5 opacity-70" style={{ color: cfg.textColor }}>{item.caption}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

registerSection('soft_gallery', (section, blocks) =>
  <SoftGallerySection settings={section.settings as any} blocks={blocks.map(b => b.settings) as any} />,
);

registerSectionSchema({
  type: 'soft_gallery',
  label: 'Soft Gallery',
  description: 'A calm, rounded-corner masonry gallery of varying-height images with quiet captions below.',
  icon: Images,
  color: '#64748B',
  group: 'Media',
  templateTypes: ['home'],
  exclusiveToTheme: 'soft-studio',
  settings: [
    { key: 'heading', kind: 'text', label: 'Heading (optional)', default: '' },
  ],
  blocks: { allowedTypes: ['gallery_item'], max: 12, label: 'Image', defaultSettings: { imageUrl: '', caption: '' } },
});

registerBlockSchema({
  type: 'gallery_item',
  label: 'Image',
  fields: [
    { key: 'imageUrl', kind: 'image', label: 'Image' },
    { key: 'caption', kind: 'text', label: 'Caption (optional)' },
  ],
});
