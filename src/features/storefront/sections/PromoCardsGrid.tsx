import type { CSSProperties, ReactNode } from 'react';
import { renderRichText } from '@/utils/richText';
import { newTabProps } from '@/features/storefront-themes/linkTarget';
import { PreviewBlock } from '@/features/storefront-themes/previewInspector';
import { useStorefront, type StorefrontLinkSettings } from '@/features/storefront/StorefrontContext';
import { Link } from 'react-router-dom';
import type { Block } from '@/api/services/storefrontTypes';

/** What a theme hands over so the cards look native: its fonts, its button and card shapes and its colours. */
export interface PromoTokens {
  fontDisplay: string; fontBody: string;
  buttonRadius: string; cardRadius: string;
  ink: string; inkMuted: string; panelBg: string; accent: string; accentInk: string;
}

type Layout = 'image-left' | 'image-right' | 'image-top' | 'image-bottom' | 'overlay';
const LAYOUTS: Layout[] = ['image-left', 'image-right', 'image-top', 'image-bottom', 'overlay'];
/** A seller's number, kept inside a sane range; anything missing or not a number gives the fallback. */
const num = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};
const optNum = (v: unknown, min: number, max: number): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : null;
};
const HEX = /^#[0-9a-fA-F]{6}$/;
const hex = (v: unknown): string | undefined => (typeof v === 'string' && HEX.test(v) ? v : undefined);
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);

const CSS = `
.pc-grid{display:grid;grid-template-columns:repeat(var(--pc-cols),minmax(0,1fr));gap:var(--pc-gap)}
.pc-cell{container-type:inline-size;min-width:0;grid-column:span var(--pc-span,1)}
@media (max-width:1100px){.pc-grid:not([data-cols="1"]):not([data-cols="2"]){grid-template-columns:repeat(2,minmax(0,1fr))}.pc-grid:not([data-cols="1"]):not([data-cols="2"]) .pc-cell{grid-column:auto}}
@media (max-width:700px){.pc-grid{grid-template-columns:minmax(0,1fr)}.pc-cell{grid-column:auto}}
.pc-card{display:flex;overflow:hidden;position:relative;height:100%}
.pc-card--row{flex-direction:row}.pc-card--row-r{flex-direction:row-reverse}
.pc-card--col{flex-direction:column}.pc-card--col-r{flex-direction:column-reverse}
.pc-img{position:relative;overflow:hidden;flex:0 0 var(--pc-img,50%);min-height:200px}
.pc-img img{position:absolute;inset:0;width:100%;height:100%}
.pc-card--col .pc-img,.pc-card--col-r .pc-img{flex:0 0 auto;min-height:0;aspect-ratio:16/10}
.pc-card--tall-col .pc-img{flex:1 1 48%;aspect-ratio:auto;min-height:180px}
.pc-body{flex:1 1 0;min-width:0;display:flex;flex-direction:column;padding:clamp(20px,3vw,36px);gap:18px}
.pc-btns{display:flex;flex-wrap:wrap;gap:10px}
.pc-btn{display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;text-decoration:none;font-size:14px;font-weight:600;padding:11px 22px;transition:opacity .15s,transform .15s}
.pc-btn:hover{opacity:.88}.pc-btn:active{transform:scale(.98)}
.pc-btn--link{padding:4px 0;text-decoration:underline;text-underline-offset:4px}
@container (max-width:459px){
  .pc-card--row,.pc-card--row-r{flex-direction:column;min-height:0!important}
  .pc-card--row .pc-img,.pc-card--row-r .pc-img{flex:0 0 auto;aspect-ratio:16/10;min-height:0}
}
@media (prefers-reduced-motion:reduce){.pc-btn{transition:none}}
`;

function useLinkProps() {
  const { resolveLink } = useStorefront();
  return (link: unknown) => resolveLink(link as StorefrontLinkSettings);
}

function PromoButton({ text, link, style, look, c, tokens, resolve }: {
  text?: string; link?: unknown; style: 'solid' | 'outline' | 'link'; look: { bg?: string; fg?: string }; c: { text: string }; tokens: PromoTokens;
  resolve: (l: unknown) => ReturnType<ReturnType<typeof useLinkProps>>;
}) {
  if (!text) return null;
  const solidBg = look.bg ?? tokens.accent;
  const solidFg = look.fg ?? tokens.accentInk;
  const css: CSSProperties = style === 'solid'
    ? { background: solidBg, color: solidFg, borderRadius: tokens.buttonRadius, border: '1.5px solid transparent' }
    : style === 'outline'
      ? { background: 'transparent', color: look.bg ?? c.text, borderRadius: tokens.buttonRadius, border: `1.5px solid ${look.bg ?? c.text}` }
      : { background: 'transparent', color: look.bg ?? c.text, border: 0 };
  css.fontFamily = tokens.fontBody;
  const cls = `pc-btn${style === 'link' ? ' pc-btn--link' : ''}`;
  const target = link ? resolve(link) : null;
  if (!target) return <span className={cls} style={css}>{text}</span>;
  return target.to
    ? <Link to={target.to} {...newTabProps(target)} className={cls} style={css}>{text}</Link>
    : <a href={target.href ?? '#'} className={cls} style={css} {...(target.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{text}</a>;
}

/**
 * "Promo cards": a row of free-form cards, each an image plus a text panel. The seller decides the layout (image left / right /
 * top / bottom / behind the text), the height, and each card's colours, text and buttons; the theme decides fonts, shapes and
 * the default colours. Cards stack by themselves when they get narrow (container query), so they work in any column count.
 */
export function PromoCardsGrid({ settings, blocks, tokens }: { settings: Record<string, any>; blocks: Block[]; tokens: PromoTokens }) {
  const resolve = useLinkProps();
  const cols = num(settings.columns, 1, 12, 2);
  const sectionLayout = pick(settings.layout, LAYOUTS, 'image-left');
  const sectionHeight = num(settings.cardHeight, 0, 2000, 380);
  const imgPct = num(settings.imageWidth, 10, 90, 50);
  const gap = num(settings.gap, 0, 200, 20);
  const radiusPx = optNum(settings.radius, 0, 200);
  const radius = radiusPx === null ? tokens.cardRadius : `${radiusPx}px`;
  const padPx = optNum(settings.padding, 0, 200);
  const align = pick(settings.contentAlign, ['left', 'center', 'right'] as const, 'left');
  const position = pick(settings.contentPosition, ['top', 'center', 'bottom', 'spread'] as const, 'spread');
  const headPx = num(settings.headingSize, 10, 160, 28);
  const bodyPx = num(settings.bodySize, 9, 48, 15);
  if (blocks.length === 0) return null;

  const cards: ReactNode[] = blocks.map((b, i) => {
    const s = b.settings as Record<string, any>;
    const layout = pick(s.layout, LAYOUTS, sectionLayout);
    const overlay = layout === 'overlay';
    const bg = hex(s.bgColor) ?? tokens.panelBg;
    const text = hex(s.textColor) ?? (overlay ? '#ffffff' : tokens.ink);
    const look = { bg: hex(s.buttonBg), fg: hex(s.buttonText) };
    const dir = layout === 'image-left' ? 'row' : layout === 'image-right' ? 'row-r' : layout === 'image-top' ? 'col' : layout === 'image-bottom' ? 'col-r' : 'row';
    const side = dir === 'row' || dir === 'row-r';
    const cardH = optNum(s.cardHeight, 0, 2000);
    const heightPx = cardH === null ? sectionHeight : cardH;
    const fixedH = heightPx > 0 ? heightPx : (overlay ? 360 : 0);
    const span = Math.min(cols, num(s.colSpan, 1, 12, 1));
    const justify = position === 'top' ? 'flex-start' : position === 'bottom' ? 'flex-end' : position === 'center' ? 'center' : 'space-between';
    const itemAlign = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
    const fit = s.imageFit === 'contain' ? 'contain' : 'cover';
    const focal = typeof s.focalPoint === 'string' && s.focalPoint ? s.focalPoint : 'center';
    const imageUrl = typeof s.imageUrl === 'string' ? s.imageUrl : '';
    const img = imageUrl ? (
      <img src={imageUrl} alt="" loading="lazy" style={{ objectFit: fit, objectPosition: focal, background: fit === 'contain' ? bg : undefined }} />
    ) : null;
    const imgTarget = s.imageLinkOn === true && s.imageLink ? resolve(s.imageLink) : null;
    const imgNode = img && (imgTarget
      ? (imgTarget.to
        ? <Link to={imgTarget.to} {...newTabProps(imgTarget)} aria-label={s.heading || undefined} style={{ position: 'absolute', inset: 0 }}>{img}</Link>
        : <a href={imgTarget.href ?? '#'} aria-label={s.heading || undefined} style={{ position: 'absolute', inset: 0 }} {...(imgTarget.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{img}</a>)
      : img);
    const overlayOpacity = num(s.overlayOpacity, 0, 100, 35);

    const head = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: itemAlign, textAlign: align }}>
        {s.eyebrow && <p style={{ margin: 0, fontSize: 14, opacity: 0.8, fontFamily: tokens.fontBody }}>{s.eyebrow}</p>}
        {s.heading && <h3 style={{ margin: 0, fontSize: `clamp(${Math.round(headPx * 0.72)}px, 3vw, ${headPx}px)`, lineHeight: 1.18, fontWeight: 600, fontFamily: tokens.fontDisplay, letterSpacing: '-0.01em' }}>{s.heading}</h3>}
        {s.body && <div style={{ margin: 0, fontSize: bodyPx, lineHeight: 1.65, opacity: 0.88, fontFamily: tokens.fontBody }}>{renderRichText(s.body)}</div>}
      </div>
    );
    const buttons = (s.ctaText || s.cta2Text) ? (
      <div className="pc-btns" style={{ justifyContent: itemAlign }}>
        <PromoButton text={s.ctaText} link={s.ctaLink} style={pick(s.ctaStyle, ['solid', 'outline', 'link'] as const, 'solid')} look={look} c={{ text }} tokens={tokens} resolve={resolve} />
        <PromoButton text={s.cta2Text} link={s.cta2Link} style={pick(s.cta2Style, ['solid', 'outline', 'link'] as const, 'outline')} look={look} c={{ text }} tokens={tokens} resolve={resolve} />
      </div>
    ) : null;

    const body = (
      <div className="pc-body" style={{ justifyContent: justify, alignItems: itemAlign, position: 'relative', zIndex: 1, ...(padPx === null ? {} : { padding: padPx }) }}>
        {head}{buttons}
      </div>
    );

    return (
      <PreviewBlock key={b._id ?? i} blockId={String(b._id ?? i)}>
        <div className="pc-cell" style={{ height: '100%', ['--pc-span' as string]: span } as CSSProperties}>
          <article className={`pc-card pc-card--${overlay ? 'row' : dir}${!side && !overlay && fixedH ? ' pc-card--tall-col' : ''}`}
            style={{ background: bg, color: text, borderRadius: radius, minHeight: fixedH || undefined }}>
            {overlay ? (
              <>
                <div style={{ position: 'absolute', inset: 0 }}>{imgNode}</div>
                <div aria-hidden style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlayOpacity / 100})`, pointerEvents: 'none' }} />
                {body}
              </>
            ) : (
              <>
                {imgNode && <div className="pc-img" style={side ? ({ ['--pc-img' as string]: `${imgPct}%` } as CSSProperties) : undefined}>{imgNode}</div>}
                {body}
              </>
            )}
          </article>
        </div>
      </PreviewBlock>
    );
  });

  return (
    <>
      <style>{CSS}</style>
      <div className="pc-grid" data-cols={cols} style={{ ['--pc-cols' as string]: cols, ['--pc-gap' as string]: `${gap}px` } as CSSProperties}>{cards}</div>
    </>
  );
}
