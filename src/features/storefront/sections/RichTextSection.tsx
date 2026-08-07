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
    <div className="px-4 sm:px-6 lg:px-10 py-8">
      <div className={`max-w-[720px] mx-auto flex flex-col gap-4 ${alignCls}`}>
        {settings.heading && <h2 className="text-[22px] font-bold" style={{ color: cfg.textColor }}>{settings.heading}</h2>}
        <ContentBlocks blocks={blocks} />
      </div>
    </div>
  );
}
