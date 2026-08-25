import { registerSection } from '../sectionRenderRegistry';
import { registerSectionSchema } from '../sectionSchemaRegistry';
import { registerBlockSchema } from '../blockSchemaRegistry';
import { Newspaper } from 'lucide-react';
import { clsx } from 'clsx';
import { cloudinaryUrl, cloudinarySrcSet } from '@/utils/cloudinaryImage';
import { useStorefront, type StorefrontCfg } from '../StorefrontContext';

interface LookbookItem {
  imageUrl: string;
  caption?: string;
}

interface LookbookImageProps {
  item: LookbookItem;
  className: string;
  cfg: StorefrontCfg;
}

function LookbookImage({ item, className, cfg }: LookbookImageProps) {
  return (
    <div className={clsx('relative overflow-hidden', className)} style={{ borderRadius: cfg.imageRadiusPx }}>
      <img
        src={cloudinaryUrl(item.imageUrl, 900)}
        srcSet={cloudinarySrcSet(item.imageUrl)}
        sizes="(min-width: 768px) 50vw, 100vw"
        alt={item.caption ?? ''}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />
      {item.caption && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
          <span
            className="absolute bottom-4 left-4 right-4 text-white text-[13.5px] italic leading-snug"
            style={{ fontFamily: `${cfg.font}, Georgia, serif` }}
          >
            {item.caption}
          </span>
        </>
      )}
    </div>
  );
}

// A magazine-style asymmetric grid — one large "hero" frame beside two
// stacked smaller ones — genuinely different from `soft_gallery`'s calm
// CSS-columns masonry (that one has no overlay text, this one leans into
// overlaid editorial captions). Falls back to a simple equal-width row when
// there are fewer than 3 images rather than assuming exactly 3 are present.
export function EditorialLookbookSection({ settings, blocks }: { settings: { heading?: string }; blocks: LookbookItem[] }) {
  const { cfg } = useStorefront();
  if (blocks.length === 0) return null;

  const heading = settings.heading && (
    <h2 className="font-bold mb-5 text-center" style={{ color: cfg.textColor, fontSize: Math.round(22 * cfg.typeScaleFactor) }}>{settings.heading}</h2>
  );

  if (blocks.length >= 3) {
    const [big, ...rest] = blocks;
    const stacked = rest.slice(0, 2);
    return (
      <div className="px-4 sm:px-6 lg:px-10" style={{ paddingTop: 32 * cfg.sectionSpacingScale, paddingBottom: 32 * cfg.sectionSpacingScale }}>
        {heading}
        <div className="mx-auto flex flex-col md:flex-row gap-3" style={{ maxWidth: Math.round(1100 * cfg.containerWidthScale) }}>
          <LookbookImage item={big} cfg={cfg} className="w-full md:w-[60%] aspect-[4/5]" />
          <div className="w-full md:w-[40%] flex flex-col gap-3">
            {stacked.map((item, i) => <LookbookImage key={i} item={item} cfg={cfg} className="aspect-[4/3] flex-1" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10" style={{ paddingTop: 32 * cfg.sectionSpacingScale, paddingBottom: 32 * cfg.sectionSpacingScale }}>
      {heading}
      <div
        className="mx-auto grid gap-3"
        style={{ maxWidth: Math.round(1100 * cfg.containerWidthScale), gridTemplateColumns: `repeat(${blocks.length}, minmax(0, 1fr))` }}
      >
        {blocks.map((item, i) => <LookbookImage key={i} item={item} cfg={cfg} className="aspect-[4/5]" />)}
      </div>
    </div>
  );
}

registerSection('editorial_lookbook', (section, blocks) =>
  <EditorialLookbookSection settings={section.settings as any} blocks={blocks.map(b => b.settings) as any} />,
);

registerSectionSchema({
  type: 'editorial_lookbook',
  label: 'Editorial Lookbook',
  description: 'An asymmetric magazine-style image grid with overlaid captions — one large frame beside two stacked smaller ones.',
  icon: Newspaper,
  color: '#BE185D',
  group: 'Media',
  templateTypes: ['home'],
  exclusiveToTheme: 'luxury-noir',
  settings: [
    { key: 'heading', kind: 'text', label: 'Heading (optional)', default: '' },
  ],
  blocks: { allowedTypes: ['lookbook_item'], max: 6, label: 'Image', defaultSettings: { imageUrl: '', caption: '' } },
});

registerBlockSchema({
  type: 'lookbook_item',
  label: 'Image',
  fields: [
    { key: 'imageUrl', kind: 'image', label: 'Image' },
    { key: 'caption', kind: 'text', label: 'Caption' },
  ],
});
