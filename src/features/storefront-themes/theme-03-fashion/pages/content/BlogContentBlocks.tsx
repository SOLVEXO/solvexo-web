/* eslint-disable @typescript-eslint/no-explicit-any -- block settings are seller-authored JSON */
import type { Block } from '@/api/services/storefrontTypes';
import { MaisonAppBlock } from './MaisonAppBlock';
import { renderRichText } from '@/utils/richText';
import { PreviewBlock } from '../../../previewInspector';
import { fashionTheme as t } from '../../theme.config';
import { safeUrl } from '../../../core/community/communityFormat';

/** Text a block shows: the bound metafield value when the seller linked one, otherwise its own text. */
function boundText(settings: Record<string, any>, dynamic: Record<string, string>): string {
  const key = settings.dynamicSourceKey;
  const value = key ? dynamic[`${settings.dynamicSourceNamespace || 'custom'}:${key}`] : undefined;
  return String(value !== undefined ? value : settings.text ?? '');
}

const HEADINGS = { h2: { Tag: 'h2', size: 'clamp(26px,3vw,34px)' }, h3: { Tag: 'h3', size: 'clamp(22px,2.4vw,27px)' }, h4: { Tag: 'h4', size: '19px' } } as const;

/** Maison's renderer for article content blocks. Text goes through `renderRichText` (bold / italic / safe links only,
 *  never raw HTML), image URLs are checked, unknown block types render nothing. */
export function BlogContentBlocks({ blocks, dynamicSourceValues = {} }: { blocks: Block[]; dynamicSourceValues?: Record<string, string> }) {
  return (
    <>
      {blocks.map((block, i) => {
        const s = (block.settings ?? {}) as Record<string, any>;
        const id = String((block as { id?: string }).id ?? block._id ?? i);
        switch (block.type) {
          case 'heading': {
            const { Tag, size } = s.level === 'h2' ? HEADINGS.h2 : s.level === 'h4' ? HEADINGS.h4 : HEADINGS.h3;
            return <PreviewBlock key={id} blockId={id}><Tag className="m-0 mt-4 font-medium leading-[1.2] tracking-tight" style={{ fontFamily: t.fonts.display, fontSize: size, color: t.colors.ink }}>{boundText(s, dynamicSourceValues)}</Tag></PreviewBlock>;
          }
          case 'paragraph':
            return <PreviewBlock key={id} blockId={id}><p className="m-0 whitespace-pre-line text-[17px] leading-[1.8]" style={{ color: t.colors.ink }}>{renderRichText(boundText(s, dynamicSourceValues))}</p></PreviewBlock>;
          case 'image': {
            const src = safeUrl(s.imageUrl);
            if (!src) return null;
            return (
              <PreviewBlock key={id} blockId={id}>
                <figure className="m-0 my-2">
                  <img src={src} alt={s.alt ?? ''} loading="lazy" decoding="async" className="block w-full" style={{ borderRadius: 24 }} />
                  {s.caption && <figcaption className="mt-3 text-center text-[13px]" style={{ color: t.colors.inkMuted }}>{s.caption}</figcaption>}
                </figure>
              </PreviewBlock>
            );
          }
          case 'quote':
            return (
              <PreviewBlock key={id} blockId={id}>
                <blockquote className="m-0 my-3 px-6 py-7 sm:px-10" style={{ borderRadius: 24, background: t.colors.bgAlt }}>
                  <p className="fx-serif m-0 text-[clamp(24px,3vw,34px)] leading-[1.25]">{'“'}{s.text}{'”'}</p>
                  {s.author && <footer className="mt-4 text-sm font-medium" style={{ color: t.colors.inkMuted }}>{s.author}</footer>}
                </blockquote>
              </PreviewBlock>
            );
          case 'list': {
            const items = (Array.isArray(s.items) ? s.items : []) as string[];
            const List = s.style === 'numbered' ? 'ol' : 'ul';
            return (
              <PreviewBlock key={id} blockId={id}>
                <List className="m-0 flex flex-col gap-2 pl-6 text-[17px] leading-[1.7]" style={{ listStyleType: s.style === 'numbered' ? 'decimal' : 'disc', color: t.colors.ink }}>
                  {items.map((item, j) => <li key={j}>{renderRichText(item)}</li>)}
                </List>
              </PreviewBlock>
            );
          }
          case 'divider':
            return <PreviewBlock key={id} blockId={id}><hr className="my-4" style={{ border: 0, borderTop: `1px solid ${t.colors.border}` }} /></PreviewBlock>;
          default:
            if (block.type.startsWith('app:')) {
              return <PreviewBlock key={id} blockId={id}><MaisonAppBlock type={block.type} settings={s} /></PreviewBlock>;
            }
            return null;
        }
      })}
    </>
  );
}


