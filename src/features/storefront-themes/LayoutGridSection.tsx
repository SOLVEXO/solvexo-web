import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { newTabProps } from '@/features/storefront-themes/linkTarget';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import type { Block, Section } from '@/api/services/storefrontTypes';
import { PreviewBlock } from './previewInspector';
import { useInlineEdit } from './inlineEdit';
import { useState } from 'react';

/** Free layout (no-code): a row of 1-6 columns; every item picks its column. Shared by all themes; uses the section's own colours. */
type Colors = { ink: string; bg: string; inkMuted?: string };
const TEMPLATES: Record<string, number[]> = {
  equal: [], '1-2': [1, 2], '2-1': [2, 1], '1-2-1': [1, 2, 1], '1-3': [1, 3], '3-1': [3, 1], '2-1-1': [2, 1, 1], '1-1-2': [1, 1, 2],
};
const CSS = '.lg-grid{display:grid;grid-template-columns:var(--lg-cols);gap:var(--lg-gap)}.lg-col{display:flex;flex-direction:column;gap:var(--lg-gap);min-width:0}@media (max-width:749px){.lg-stack{grid-template-columns:1fr!important}}';

function Item({ block, colors }: { block: Block; colors: Colors }) {
  const { resolveLink } = useStorefront();
  const s = block.settings as Record<string, any>;
  const text = typeof s.text === 'string' ? s.text : '';
  const target = s.link ? resolveLink(s.link) : null;
  const wrap = (node: ReactElement) => !target ? node : target.to
    ? <Link to={target.to} {...newTabProps(target)} className="block">{node}</Link>
    : <a href={target.href} className="block" {...(target.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{node}</a>;
  switch (s.kind) {
    case 'heading': {
      const Tag = (['h1', 'h2', 'h3', 'h4'].includes(s.headingTag) ? s.headingTag : 'h2') as 'h2';
      return text ? <Tag style={{ margin: 0, fontSize: 'clamp(24px,3.4vw,44px)', lineHeight: 1.15, color: colors.ink, unicodeBidi: 'plaintext', whiteSpace: 'pre-line' }}>{text}</Tag> : null;
    }
    case 'text':
      return text ? <p style={{ margin: 0, lineHeight: 1.65, color: colors.ink, unicodeBidi: 'plaintext', whiteSpace: 'pre-line' }}>{text}</p> : null;
    case 'image':
      return s.imageUrl ? wrap(<img src={s.imageUrl} alt={s.alt ?? ''} loading="lazy" style={{ width: '100%', height: 'auto', display: 'block' }} />) : null;
    case 'button': {
      if (!s.buttonLabel) return null;
      const look = s.buttonStyle === 'outline' ? { border: `1.5px solid ${colors.ink}`, color: colors.ink, background: 'transparent' }
        : s.buttonStyle === 'link' ? { color: colors.ink, textDecoration: 'underline', padding: 0 }
        : { background: colors.ink, color: colors.bg, border: '1.5px solid transparent' };
      const btn = <span style={{ display: 'inline-block', padding: '12px 26px', borderRadius: 999, fontWeight: 600, ...look }}>{s.buttonLabel}</span>;
      return <div>{wrap(btn)}</div>;
    }
    case 'spacer': return <div aria-hidden style={{ height: typeof s.height === 'number' ? s.height : 24 }} />;
    case 'divider': return <hr style={{ border: 0, borderTop: `1px solid ${colors.inkMuted ?? colors.ink}`, opacity: 0.4, width: '100%', margin: 0 }} />;
    default: return null;
  }
}

export function LayoutGridSection({ section, blocks, colors }: { section: Section; blocks: Block[]; colors: Colors }) {
  const st = section.settings as Record<string, any>;
  const n = Math.max(1, Math.min(6, Math.round(Number(st.columns) || 2)));
  const widths = TEMPLATES[st.template as string] ?? [];
  const tpl = Array.from({ length: n }, (_, i) => `${widths.length === n ? widths[i] : 1}fr`).join(' ');
  const gap = typeof st.gap === 'number' ? st.gap : 24;
  const cols: Block[][] = Array.from({ length: n }, () => []);
  blocks.forEach(b => { const c = Math.max(1, Math.min(n, Math.round(Number((b.settings as Record<string, any>).column) || 1))); cols[c - 1].push(b); });
  const edit = useInlineEdit();
  const [over, setOver] = useState<number | null>(null);
  const maxW = typeof st.maxWidth === 'number' ? st.maxWidth : undefined;
  return (
    <div style={{ padding: '24px 16px' }}>
      <style>{CSS}</style>
      <div className={`lg-grid${st.stackOnMobile === false ? '' : ' lg-stack'}`}
        style={{ ['--lg-cols' as string]: tpl, ['--lg-gap' as string]: `${gap}px`, alignItems: st.verticalAlign || 'center', maxWidth: maxW, margin: '0 auto', width: '100%' }}>
        {cols.map((items, ci) => (
          <div key={ci} className="lg-col"
            {...(edit ? {
              onDragOver: (e: React.DragEvent) => { e.preventDefault(); setOver(ci); },
              onDragLeave: () => setOver(o => (o === ci ? null : o)),
              onDrop: (e: React.DragEvent) => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData('text/x-lg-block'); if (id) edit.onEdit(edit.sectionId, id, 'column', String(ci + 1)); },
            } : {})}
            style={edit ? { minHeight: 56, outline: over === ci ? '2px solid #0EA5E9' : '1px dashed rgba(14,165,233,.5)', outlineOffset: 2, borderRadius: 6 } : undefined}>
            {items.map((b, i) => (
              <div key={b._id ?? i} draggable={!!edit} title={edit ? 'Drag to another column' : undefined}
                onDragStart={edit ? (e: React.DragEvent) => { e.dataTransfer.setData('text/x-lg-block', String(b._id ?? i)); e.dataTransfer.effectAllowed = 'move'; } : undefined}
                style={edit ? { cursor: 'grab' } : undefined}>
                <PreviewBlock blockId={String(b._id ?? i)}>
                  <Item block={b} colors={colors} />
                </PreviewBlock>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
