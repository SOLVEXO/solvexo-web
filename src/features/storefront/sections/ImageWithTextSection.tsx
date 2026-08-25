import { registerSection } from '../sectionRenderRegistry';
import { registerSectionSchema } from '../sectionSchemaRegistry';
import { registerBlockSchema } from '../blockSchemaRegistry';
import { Columns } from 'lucide-react';
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

registerSection('image_with_text', (section, blocks) =>
  <ImageWithTextSection settings={section.settings} blocks={blocks.map(b => b.settings) as any} />,
);

registerSectionSchema({
  type: 'image_with_text',
  label: 'Image with Text',
  description: 'An image next to a heading, body copy and an optional button.',
  icon: Columns,
  color: '#14B8A6',
  group: 'Content',
  settings: [
    // Reproduced for fidelity with the current hand form (`SectionFields.tsx`
    // shows this field for every type except hero/trust_badges/
    // collection_product_grid) — note `ImageWithTextSection`'s own render
    // function never actually reads `settings.heading`, so this field is a
    // pre-existing no-op in the current form too, not something introduced
    // here.
    { key: 'heading', kind: 'text', label: 'Heading (optional)', default: '' },
  ],
  blocks: { allowedTypes: ['image_text_pair'], max: 20, label: 'Pair', defaultSettings: { imageUrl: '', heading: '', body: '', ctaText: '', imagePosition: 'left' } },
});

registerBlockSchema({
  type: 'image_text_pair',
  label: 'Pair',
  fields: [
    { key: 'imageUrl', kind: 'image', label: 'Image' },
    { key: 'heading', kind: 'text', label: 'Heading' },
    { key: 'body', kind: 'textarea', label: 'Body' },
    { key: 'ctaText', kind: 'text', label: 'Button text' },
    { key: 'ctaLink', kind: 'link', label: 'Button link', showIf: (v) => !!v.ctaText },
    // A Toggle in `BlockFields.tsx` ("Image on the right"), but it maps to
    // the real stored `imagePosition: 'left'|'right'` string enum, not a
    // true boolean — using `kind: 'boolean'` would have `SchemaForm` write a
    // raw `true`/`false` into that field instead. Mapped to `select` to
    // preserve the actual stored data shape.
    { key: 'imagePosition', kind: 'select', label: 'Image position', default: 'left', options: [
      { value: 'left', label: 'Image on the left' }, { value: 'right', label: 'Image on the right' },
    ] },
  ],
});
