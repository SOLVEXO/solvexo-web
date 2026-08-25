import { registerSection } from '../sectionRenderRegistry';
import { registerSectionSchema } from '../sectionSchemaRegistry';
import { registerBlockSchema } from '../blockSchemaRegistry';
import { Hammer } from 'lucide-react';
import { useStorefront } from '../StorefrontContext';

interface CraftProcessStep {
  title: string;
  body:  string;
}

// Numbered, typographic step cards — large "01"/"02" numerals in the
// theme's primary color, no icons. Deliberately different from
// `FarmStorySection`'s icon-driven horizontal strip: this one reads as a
// manufacturing/craft process, not a natural journey.
export function CraftProcessSection({ settings, blocks }: { settings: { heading?: string }; blocks: CraftProcessStep[] }) {
  const { cfg } = useStorefront();
  if (blocks.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-10" style={{ paddingTop: 36 * cfg.sectionSpacingScale, paddingBottom: 36 * cfg.sectionSpacingScale }}>
      <div className="mx-auto" style={{ maxWidth: Math.round(1100 * cfg.containerWidthScale) }}>
        {settings.heading && (
          <h2 className="font-bold mb-6 text-center" style={{ color: cfg.textColor, fontSize: Math.round(22 * cfg.typeScaleFactor) }}>{settings.heading}</h2>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {blocks.map((step, i) => (
            <div key={i} className="flex flex-col gap-2">
              <span className="font-black leading-none" style={{ color: cfg.primaryColor, fontSize: Math.round(38 * cfg.typeScaleFactor), opacity: 0.85 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="font-bold text-[14.5px]" style={{ color: cfg.textColor }}>{step.title}</p>
              <p className="text-[13px] leading-relaxed opacity-80" style={{ color: cfg.textColor }}>{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

registerSection('craft_process', (section, blocks) =>
  <CraftProcessSection settings={section.settings as any} blocks={blocks.map(b => b.settings) as any} />,
);

registerSectionSchema({
  type: 'craft_process',
  label: 'Craft Process',
  description: 'Large numbered step cards — a typographic "how it\'s made" walkthrough with no icons.',
  icon: Hammer,
  color: '#92400E',
  group: 'Content',
  templateTypes: ['home'],
  exclusiveToTheme: 'warm-craft',
  settings: [
    { key: 'heading', kind: 'text', label: 'Heading (optional)', default: '' },
  ],
  blocks: { allowedTypes: ['craft_process_step'], max: 6, label: 'Step', defaultSettings: { title: '', body: '' } },
});

registerBlockSchema({
  type: 'craft_process_step',
  label: 'Step',
  fields: [
    { key: 'title', kind: 'text', label: 'Title' },
    { key: 'body', kind: 'textarea', label: 'Body' },
  ],
});
