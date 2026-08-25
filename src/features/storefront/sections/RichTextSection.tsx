import { registerSection } from '../sectionRenderRegistry';
import { registerSectionSchema } from '../sectionSchemaRegistry';
import { registerBlockSchema } from '../blockSchemaRegistry';
import { Type } from 'lucide-react';
import { useStorefront } from '../StorefrontContext';
import { ContentBlocks, type ContentBlock } from './ContentBlocks';

export interface RichTextSectionSettings {
  heading?:    string;
  alignment?:  'left' | 'center' | 'right';
}

// Content blocks are structured (not raw HTML) — a seller composes a
// paragraph/heading/image/quote/list per block, rendered safely here, rather
// than a WYSIWYG field that would need HTML sanitization on a page with zero
// platform chrome protecting it.
export function RichTextSection({ settings, blocks }: { settings: RichTextSectionSettings; blocks: ContentBlock[] }) {
  const { cfg } = useStorefront();
  const alignCls = { left: 'text-left items-start', center: 'text-center items-center', right: 'text-right items-end' }[settings.alignment ?? 'left'];

  return (
    <div className="px-4 sm:px-6 lg:px-10" style={{ paddingTop: 32 * cfg.sectionSpacingScale, paddingBottom: 32 * cfg.sectionSpacingScale }}>
      <div className={`mx-auto flex flex-col gap-4 ${alignCls}`} style={{ maxWidth: Math.round(720 * cfg.containerWidthScale) }}>
        {settings.heading && <h2 className="font-bold" style={{ color: cfg.textColor, fontSize: Math.round(22 * cfg.typeScaleFactor) }}>{settings.heading}</h2>}
        <ContentBlocks blocks={blocks} />
      </div>
    </div>
  );
}

registerSection('rich_text', (section, blocks) =>
  <RichTextSection settings={section.settings} blocks={blocks.map(b => ({ type: b.type, settings: b.settings })) as any} />,
);

registerSectionSchema({
  type: 'rich_text',
  label: 'Rich Text',
  description: 'Paragraphs, headings, images, quotes and lists.',
  icon: Type,
  color: '#6366F1',
  group: 'Content',
  settings: [
    { key: 'heading', kind: 'text', label: 'Heading (optional)', default: '' },
    { key: 'alignment', kind: 'select', label: 'Text alignment', default: 'left', options: [
      { value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' },
    ] },
  ],
  blocks: { allowedTypes: ['heading', 'paragraph', 'image', 'quote', 'list', 'divider'], max: 20, label: 'Block', defaultSettings: { text: '' } },
});

registerBlockSchema({
  type: 'heading',
  label: 'Heading',
  fields: [
    { key: 'text', kind: 'text', label: 'Heading text' },
  ],
});

registerBlockSchema({
  type: 'paragraph',
  label: 'Paragraph',
  fields: [
    { key: 'text', kind: 'textarea', label: 'Paragraph text' },
  ],
});

registerBlockSchema({
  type: 'image',
  label: 'Image',
  fields: [
    { key: 'imageUrl', kind: 'image', label: 'Image' },
    { key: 'alt', kind: 'text', label: 'Alt text', helpText: 'Describes the image for screen readers and search engines.' },
    { key: 'caption', kind: 'text', label: 'Caption (optional)' },
  ],
});

registerBlockSchema({
  type: 'quote',
  label: 'Quote',
  fields: [
    { key: 'text', kind: 'textarea', label: 'Quote' },
    { key: 'author', kind: 'text', label: 'Author (optional)' },
  ],
});

// The old hand-written form (`BlockFields.tsx`'s `list` case) edits `items`
// as a repeating array of individual string inputs — `SchemaForm`/`FieldSchema`
// has no dedicated repeating-string-list field kind yet, so this is
// approximated as one `textarea` (one item per line) rather than inventing a
// new FieldKind. A known, disclosed simplification.
registerBlockSchema({
  type: 'list',
  label: 'List',
  fields: [
    { key: 'items', kind: 'textarea', label: 'Items', helpText: 'One per line' },
  ],
});

registerBlockSchema({
  type: 'divider',
  label: 'Divider',
  fields: [],
});
