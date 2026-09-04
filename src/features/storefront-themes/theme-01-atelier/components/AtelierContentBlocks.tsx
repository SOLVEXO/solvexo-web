import { atelierTheme as t } from '../theme.config';
import { renderRichText } from '@/utils/richText';

export interface ContentBlock {
  type: string;
  settings: Record<string, any>;
}

/** Theme 01's own renderer for the `paragraph|heading|image|quote|list|divider`
 *  content-block vocabulary (Blog posts and custom Pages both author this
 *  same shape). Independently implemented from the legacy `ContentBlocks` —
 *  that one reads legacy `resolveStorefrontCfg()` tokens, which don't apply
 *  to an independent theme's own config, so reusing it as-is would have
 *  rendered blog/page body copy in the wrong (default/legacy) colors
 *  instead of Atelier's own ink/accent palette. */
/** `dynamicSourceValues` — "Dynamic Sources": the current resource's real
 *  metafield values (keyed `"namespace:key"`), only ever non-empty when this
 *  is called from a Product Template's `RichTextSection` (see
 *  `AtelierProductPage.tsx`) — `AtelierCustomPage`/blog callers pass nothing,
 *  which is correct, since a custom page/blog post has no single "current
 *  resource" a paragraph could bind to. */
export function AtelierContentBlocks({ blocks, dynamicSourceValues }: { blocks: ContentBlock[]; dynamicSourceValues?: Record<string, string> }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading':
            return (
              <p key={i} style={{ fontFamily: t.fonts.display, fontSize: '19px', fontWeight: 600, color: t.colors.ink }}>
                {block.settings.text}
              </p>
            );
          case 'paragraph': {
            const { dynamicSourceNamespace: ns, dynamicSourceKey: key } = block.settings;
            const boundText = ns && key ? dynamicSourceValues?.[`${ns}:${key}`] : undefined;
            const text = boundText !== undefined ? boundText : block.settings.text;
            return (
              <p key={i} style={{ fontFamily: t.fonts.body, fontSize: '14.5px', lineHeight: 1.75, color: t.colors.ink, whiteSpace: 'pre-wrap' }}>
                {renderRichText(text)}
              </p>
            );
          }
          case 'image':
            return (
              <figure key={i} className="m-0">
                <img src={block.settings.imageUrl} alt={block.settings.alt ?? ''} className="max-w-full" />
                {block.settings.caption && (
                  <figcaption style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted, marginTop: '6px' }}>
                    {block.settings.caption}
                  </figcaption>
                )}
              </figure>
            );
          case 'quote':
            return (
              <blockquote key={i} style={{ borderLeft: `2px solid ${t.colors.accent}`, paddingLeft: '18px', fontFamily: t.fonts.display, fontStyle: 'italic', fontSize: '16.5px', color: t.colors.ink }}>
                “{block.settings.text}”
                {block.settings.author && (
                  <footer style={{ fontFamily: t.fonts.body, fontStyle: 'normal', fontSize: '12px', color: t.colors.inkMuted, marginTop: '6px' }}>
                    — {block.settings.author}
                  </footer>
                )}
              </blockquote>
            );
          case 'list':
            return block.settings.style === 'numbered' ? (
              <ol key={i} className="pl-5 flex flex-col gap-1.5" style={{ fontFamily: t.fonts.body, fontSize: '14px', color: t.colors.ink, listStyleType: 'decimal' }}>
                {(block.settings.items ?? []).map((item: string, j: number) => <li key={j}>{item}</li>)}
              </ol>
            ) : (
              <ul key={i} className="pl-5 flex flex-col gap-1.5" style={{ fontFamily: t.fonts.body, fontSize: '14px', color: t.colors.ink, listStyleType: 'disc' }}>
                {(block.settings.items ?? []).map((item: string, j: number) => <li key={j}>{item}</li>)}
              </ul>
            );
          case 'divider':
            return <hr key={i} style={{ border: 0, borderTop: `1px solid ${t.colors.border}` }} />;
          default:
            return null;
        }
      })}
    </>
  );
}
