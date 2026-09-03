import { novaTheme as t } from '../theme.config';
import { renderRichText } from '@/utils/richText';

export interface ContentBlock {
  type: string;
  settings: Record<string, any>;
}

/** Theme 02's own renderer for the `paragraph|heading|image|quote|list|divider`
 *  content-block vocabulary (Blog posts and custom Pages both author this
 *  same shape). Independently implemented from `AtelierContentBlocks` — same
 *  reasoning: this theme's own `novaTheme` colors/fonts, not the legacy
 *  shared engine's tokens. */
export function NovaContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading':
            return (
              <p key={i} style={{ fontFamily: t.fonts.display, fontSize: '20px', fontWeight: 700, color: t.colors.ink }}>
                {block.settings.text}
              </p>
            );
          case 'paragraph':
            return (
              <p key={i} style={{ fontFamily: t.fonts.body, fontSize: '15px', lineHeight: 1.75, color: t.colors.ink, whiteSpace: 'pre-wrap' }}>
                {renderRichText(block.settings.text)}
              </p>
            );
          case 'image':
            return (
              <figure key={i} className="m-0">
                <img src={block.settings.imageUrl} alt={block.settings.alt ?? ''} className="max-w-full" style={{ borderRadius: t.radius.md }} />
                {block.settings.caption && (
                  <figcaption style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted, marginTop: '6px' }}>
                    {block.settings.caption}
                  </figcaption>
                )}
              </figure>
            );
          case 'quote':
            return (
              <blockquote key={i} style={{ borderLeft: `3px solid ${t.colors.accent}`, paddingLeft: '18px', fontFamily: t.fonts.display, fontStyle: 'italic', fontSize: '17px', color: t.colors.ink }}>
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
              <ol key={i} className="pl-5 flex flex-col gap-1.5" style={{ fontFamily: t.fonts.body, fontSize: '14.5px', color: t.colors.ink, listStyleType: 'decimal' }}>
                {(block.settings.items ?? []).map((item: string, j: number) => <li key={j}>{item}</li>)}
              </ol>
            ) : (
              <ul key={i} className="pl-5 flex flex-col gap-1.5" style={{ fontFamily: t.fonts.body, fontSize: '14.5px', color: t.colors.ink, listStyleType: 'disc' }}>
                {(block.settings.items ?? []).map((item: string, j: number) => <li key={j}>{item}</li>)}
              </ul>
            );
          case 'divider':
            return <hr key={i} style={{ border: 0, borderTop: `1.5px solid ${t.colors.border}` }} />;
          default:
            return null;
        }
      })}
    </>
  );
}
