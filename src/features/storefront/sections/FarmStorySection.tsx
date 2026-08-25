import { registerSection } from '../sectionRenderRegistry';
import { registerSectionSchema } from '../sectionSchemaRegistry';
import { registerBlockSchema } from '../blockSchemaRegistry';
import { Sprout, Leaf, Truck, Heart, Sun, ChevronRight, type LucideIcon } from 'lucide-react';
import { cloudinaryUrl, cloudinarySrcSet } from '@/utils/cloudinaryImage';
import { useStorefront } from '../StorefrontContext';

type FarmStoryIcon = 'sprout' | 'leaf' | 'truck' | 'heart' | 'sun';

interface FarmStoryStep {
  icon:  FarmStoryIcon;
  title: string;
  body:  string;
}

interface FarmStorySettings {
  heading?:    string;
  subheading?: string;
  imageUrl?:   string;
}

const ICON_MAP: Record<FarmStoryIcon, LucideIcon> = { sprout: Sprout, leaf: Leaf, truck: Truck, heart: Heart, sun: Sun };

// A horizontal "journey" strip — icon-driven steps with a heading/subheading
// pair above and an optional image below. Deliberately icon-driven rather
// than numeral-driven (see `CraftProcessSection` for that alternative), to
// read as a natural/organic story rather than a manufacturing process.
export function FarmStorySection({ settings, blocks }: { settings: FarmStorySettings; blocks: FarmStoryStep[] }) {
  const { cfg } = useStorefront();
  if (blocks.length === 0 && !settings.heading) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-10" style={{ paddingTop: 36 * cfg.sectionSpacingScale, paddingBottom: 36 * cfg.sectionSpacingScale }}>
      <div className="mx-auto flex flex-col gap-8" style={{ maxWidth: Math.round(1100 * cfg.containerWidthScale) }}>
        {(settings.heading || settings.subheading) && (
          <div className="text-center max-w-[640px] mx-auto flex flex-col gap-2">
            {settings.heading && <h2 className="font-bold" style={{ color: cfg.textColor, fontSize: Math.round(24 * cfg.typeScaleFactor) }}>{settings.heading}</h2>}
            {settings.subheading && <p className="text-[14px] opacity-80" style={{ color: cfg.textColor }}>{settings.subheading}</p>}
          </div>
        )}

        {blocks.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-1">
            {blocks.flatMap((step, i) => {
              const Icon = ICON_MAP[step.icon] ?? Sprout;
              const card = (
                <div key={`step-${i}`} className="flex-1 min-w-0 flex flex-col items-center text-center gap-2">
                  <span
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${cfg.primaryColor}18`, color: cfg.primaryColor }}
                  >
                    <Icon size={20} />
                  </span>
                  <p className="font-bold text-[14px]" style={{ color: cfg.textColor }}>{step.title}</p>
                  <p className="text-[13px] leading-relaxed opacity-80" style={{ color: cfg.textColor }}>{step.body}</p>
                </div>
              );
              if (i === blocks.length - 1) return [card];
              return [card, (
                <div key={`arrow-${i}`} className="hidden md:flex items-center justify-center pt-5 shrink-0" style={{ color: `${cfg.textColor}40` }}>
                  <ChevronRight size={18} />
                </div>
              )];
            })}
          </div>
        )}

        {settings.imageUrl && (
          <img
            src={cloudinaryUrl(settings.imageUrl, 1200)}
            srcSet={cloudinarySrcSet(settings.imageUrl)}
            sizes="100vw"
            alt=""
            className="w-full object-cover"
            style={{ borderRadius: cfg.imageRadiusPx, aspectRatio: '16/7' }}
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
    </div>
  );
}

registerSection('farm_story', (section, blocks) =>
  <FarmStorySection settings={section.settings as any} blocks={blocks.map(b => b.settings) as any} />,
);

registerSectionSchema({
  type: 'farm_story',
  label: 'Farm Story',
  description: 'A horizontal, icon-led journey strip — e.g. "Planted → Grown → Delivered" — with a heading and optional image.',
  icon: Sprout,
  color: '#65A30D',
  group: 'Content',
  templateTypes: ['home'],
  exclusiveToTheme: 'fresh-market',
  settings: [
    { key: 'heading', kind: 'text', label: 'Heading (optional)', default: '' },
    { key: 'subheading', kind: 'text', label: 'Subheading (optional)', default: '' },
    { key: 'imageUrl', kind: 'image', label: 'Image (optional)' },
  ],
  blocks: { allowedTypes: ['farm_story_step'], max: 5, label: 'Step', defaultSettings: { icon: 'sprout', title: '', body: '' } },
});

registerBlockSchema({
  type: 'farm_story_step',
  label: 'Step',
  fields: [
    { key: 'icon', kind: 'icon', label: 'Icon', default: 'sprout', options: [
      { value: 'sprout', label: 'Sprout' },
      { value: 'leaf', label: 'Leaf' },
      { value: 'truck', label: 'Truck' },
      { value: 'heart', label: 'Heart' },
      { value: 'sun', label: 'Sun' },
    ] },
    { key: 'title', kind: 'text', label: 'Title' },
    { key: 'body', kind: 'textarea', label: 'Body' },
  ],
});
