import type { CSSProperties, ReactNode } from 'react';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import type { LayoutNode, StoreSectionDef } from '@/api/services/storeSectionDefs';

/**
 * Draws a seller-built section ("Section builder") from its layout tree. The tree is plain data with allow-listed properties
 * (the API checked it); every value shown comes from the section's / item's own fields and is rendered as text, a sanitised
 * HTML fragment, or an https URL. Colours come from the section's colour scheme, so it follows whatever theme draws it.
 */

export interface StoreSectionColors { bg: string; ink: string; accent: string; accentInk: string; bgAlt?: string; inkMuted?: string; border?: string }
export type ResolveLink = (link: unknown) => { to?: string; href?: string; newTab?: boolean };
type Values = Record<string, unknown>;
export interface StoreSectionBlock { settings?: Values; enabled?: boolean }

/** How a link renders: a router link, a plain anchor, or (builder preview) a dead span. Supplied by the host. */
export type LinkRenderer = (props: { link: unknown; className?: string; style?: CSSProperties; children: ReactNode }) => ReactNode;

export const STORE_SECTION_CSS =
  '.sxv-grid{display:grid;grid-template-columns:repeat(var(--cols,1),minmax(0,1fr));gap:var(--gap,24px)}' +
  '@media (max-width:1023px){.sxv-grid{grid-template-columns:repeat(min(var(--cols,1),2),minmax(0,1fr))}}' +
  '@media (max-width:749px){.sxv-grid{grid-template-columns:minmax(0,1fr)}}' +
  '.sxv-rich>*:first-child{margin-top:0}.sxv-rich>*:last-child{margin-bottom:0}.sxv-rich a{text-decoration:underline}' +
  '.sxv-rich img{max-width:100%;height:auto}.sxv-rich ul,.sxv-rich ol{padding-inline-start:1.4em}';

const HEADING_SIZE: Record<string, string> = { sm: 'clamp(18px,2.4vw,22px)', md: 'clamp(22px,3vw,32px)', lg: 'clamp(28px,4.4vw,44px)', xl: 'clamp(34px,6vw,64px)' };
const TEXT_SIZE: Record<string, string> = { sm: '14px', md: '16px', lg: '19px' };
const RATIO: Record<string, string> = { square: '1 / 1', '4:3': '4 / 3', '16:9': '16 / 9', '3:4': '3 / 4' };
const JUSTIFY: Record<string, string> = { left: 'flex-start', center: 'center', right: 'flex-end' };
const RATIO_NUM: Record<string, number> = { square: 1, '4:3': 4 / 3, '16:9': 16 / 9, '3:4': 3 / 4 };

/** An image with a shape AND a maximum height is capped in WIDTH too (height x shape), so a square with 48px corners is a round avatar and not a stretched box. */
function boxSize(node: LayoutNode, inheritAlign: string): CSSProperties {
  const n = RATIO_NUM[node.ratio ?? ''];
  if (!node.maxHeight || !n) return { ...(node.maxHeight ? { maxHeight: node.maxHeight } : {}) };
  const a = node.align && node.align !== 'inherit' ? node.align : inheritAlign;
  return { width: '100%', maxWidth: Math.round(node.maxHeight * n), marginInline: a === 'center' ? 'auto' : a === 'right' ? 'auto 0' : undefined };
}

const text = (v: unknown): string => (typeof v === 'string' ? v : '');
const httpsUrl = (v: unknown): string => (typeof v === 'string' && /^https:\/\//i.test(v.trim()) ? v.trim() : '');

interface Ctx {
  section: Values;
  item?: Values;
  colors: StoreSectionColors;
  blocks: StoreSectionBlock[];
  link: LinkRenderer;
  /** In the builder: empty things show a grey placeholder instead of disappearing, so the shape of the design stays visible. */
  preview: boolean;
  inheritAlign: string;
}

function valueOf(ctx: Ctx, key: string | undefined): unknown {
  if (!key) return undefined;
  return (ctx.item ?? ctx.section)[key];
}

function Placeholder({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ border: '1px dashed #c9c5bb', background: '#f6f4ee', color: '#8c8a82', fontSize: 12, borderRadius: 8, padding: '14px 12px', textAlign: 'center', boxSizing: 'border-box', ...style }}>{children}</div>;
}

function renderNode(node: LayoutNode, ctx: Ctx, path: string): ReactNode {
  const align = (a: string | undefined) => (a && a !== 'inherit' ? a : ctx.inheritAlign);
  switch (node.t) {
    case 'stack': {
      const a = node.align ?? 'left';
      const inner: Ctx = { ...ctx, inheritAlign: a };
      return (
        <div key={path} style={{ display: 'flex', flexDirection: 'column', gap: node.gap ?? 16, textAlign: a as CSSProperties['textAlign'], ...(node.maxWidth ? { maxWidth: node.maxWidth, marginInline: a === 'center' ? 'auto' : a === 'right' ? 'auto 0' : undefined } : {}) }}>
          {(node.children ?? []).map((c, i) => renderNode(c, inner, `${path}.${i}`))}
        </div>
      );
    }
    case 'columns':
      return (
        <div key={path} className="sxv-grid" style={{ ['--cols' as string]: node.cols ?? 2, ['--gap' as string]: `${node.gap ?? 24}px`, alignItems: node.valign === 'center' ? 'center' : node.valign === 'bottom' ? 'end' : 'start' }}>
          {(node.children ?? []).map((c, i) => <div key={i} style={{ minWidth: 0 }}>{renderNode(c, ctx, `${path}.${i}`)}</div>)}
        </div>
      );
    case 'repeat': {
      const items = ctx.blocks.filter(b => b.enabled !== false);
      if (items.length === 0) return ctx.preview ? <Placeholder key={path}>{node.label ?? 'Items'} will appear here</Placeholder> : null;
      const a = node.align ?? 'left';
      return (
        <div key={path} className="sxv-grid" style={{ ['--cols' as string]: node.cols ?? 3, ['--gap' as string]: `${node.gap ?? 24}px` }}>
          {items.map((b, i) => {
            const inner: Ctx = { ...ctx, item: b.settings ?? {}, inheritAlign: a };
            return (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, textAlign: a as CSSProperties['textAlign'],
                ...(node.card ? { border: `1px solid ${ctx.colors.border ?? 'rgba(0,0,0,.12)'}`, borderRadius: 14, padding: 20, background: ctx.colors.bgAlt ?? 'transparent' } : {}),
              }}>
                {(node.children ?? []).map((c, j) => renderNode(c, inner, `${path}.${i}.${j}`))}
              </div>
            );
          })}
        </div>
      );
    }
    case 'heading': {
      const v = text(valueOf(ctx, node.key));
      if (!v) return ctx.preview ? <Placeholder key={path}>{node.label || 'Heading'}</Placeholder> : null;
      const Tag = (['h2', 'h3', 'h4'].includes(node.tag ?? '') ? node.tag : 'h2') as 'h2' | 'h3' | 'h4';
      return <Tag key={path} style={{ margin: 0, fontSize: HEADING_SIZE[node.size ?? 'md'], lineHeight: 1.15, fontWeight: 600, color: ctx.colors.ink, textAlign: align(node.align) as CSSProperties['textAlign'] }}>{v}</Tag>;
    }
    case 'text': {
      const v = text(valueOf(ctx, node.key));
      if (!v) return ctx.preview ? <Placeholder key={path}>{node.label || 'Text'}</Placeholder> : null;
      return <p key={path} style={{ margin: 0, fontSize: TEXT_SIZE[node.size ?? 'md'], lineHeight: 1.6, whiteSpace: 'pre-line', color: node.muted ? (ctx.colors.inkMuted ?? ctx.colors.ink) : ctx.colors.ink, textAlign: align(node.align) as CSSProperties['textAlign'] }}>{v}</p>;
    }
    case 'richtext': {
      const html = sanitizeHtml(text(valueOf(ctx, node.key)));
      if (!html) return ctx.preview ? <Placeholder key={path}>{node.label || 'Formatted text'}</Placeholder> : null;
      return <div key={path} className="sxv-rich" style={{ color: ctx.colors.ink, lineHeight: 1.65, textAlign: align(node.align) as CSSProperties['textAlign'] }} dangerouslySetInnerHTML={{ __html: html }} />;
    }
    case 'image': {
      const src = httpsUrl(valueOf(ctx, node.key));
      const ratio = RATIO[node.ratio ?? 'auto'];
      const size = boxSize(node, ctx.inheritAlign);
      if (!src) return ctx.preview ? <Placeholder key={path} style={{ aspectRatio: ratio ?? '4 / 3', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: node.radius ?? 0, ...size }}>{node.label || 'Image'}</Placeholder> : null;
      return (
        <img key={path} src={src} alt="" loading="lazy" decoding="async"
          style={{ display: 'block', width: '100%', height: ratio ? 'auto' : 'auto', aspectRatio: ratio, objectFit: (node.fit === 'contain' ? 'contain' : 'cover'), borderRadius: node.radius ?? 0, ...size }} />
      );
    }
    case 'video': {
      const src = httpsUrl(valueOf(ctx, node.key));
      if (!src) return ctx.preview ? <Placeholder key={path} style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{node.label || 'Video'}</Placeholder> : null;
      // eslint-disable-next-line jsx-a11y/media-has-caption -- seller-supplied marketing video
      return <video key={path} src={src} controls playsInline preload="metadata" style={{ display: 'block', width: '100%', aspectRatio: RATIO[node.ratio ?? '16:9'] ?? '16 / 9', background: '#000', borderRadius: 8 }} />;
    }
    case 'button': {
      const label = text(valueOf(ctx, node.key));
      const link = valueOf(ctx, node.link);
      const style = node.style ?? 'solid';
      const look: CSSProperties = style === 'solid'
        ? { background: ctx.colors.accent, color: ctx.colors.accentInk, border: `1px solid ${ctx.colors.accent}` }
        : style === 'outline'
          ? { background: 'transparent', color: ctx.colors.accent, border: `1px solid ${ctx.colors.accent}` }
          : { background: 'transparent', color: ctx.colors.accent, border: '1px solid transparent', textDecoration: 'underline', padding: 0 };
      const wrap = (child: ReactNode) => <div key={path} style={{ display: 'flex', justifyContent: JUSTIFY[align(node.align)] ?? 'flex-start' }}>{child}</div>;
      if (!label) return ctx.preview ? <Placeholder key={path}>{node.label || 'Button'}</Placeholder> : null;
      const base: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 22px', borderRadius: 999, fontSize: 15, fontWeight: 600, textDecoration: 'none', cursor: 'pointer', ...look };
      return wrap(ctx.link({ link, style: base, children: label }));
    }
    case 'divider':
      return <hr key={path} style={{ border: 0, borderTop: `1px solid ${ctx.colors.border ?? 'rgba(0,0,0,.15)'}`, width: '100%', margin: 0 }} />;
    case 'spacer':
      return <div key={path} aria-hidden style={{ height: node.h ?? 24 }} />;
    default:
      return null;
  }
}

/** The section's layout drawn with the given values (a real page) or with placeholders for the empty parts (`preview`, in the builder). */
export function StoreSectionView({ def, settings, blocks, colors, link, preview = false }: {
  def: Pick<StoreSectionDef, 'layout'>;
  settings: Values;
  blocks: StoreSectionBlock[];
  colors: StoreSectionColors;
  link: LinkRenderer;
  preview?: boolean;
}) {
  const ctx: Ctx = { section: settings, colors, blocks, link, preview, inheritAlign: 'left' };
  return (
    <>
      <style>{STORE_SECTION_CSS}</style>
      {renderNode(def.layout, ctx, 'r')}
    </>
  );
}
