import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import type { Block } from '@/api/services/storefrontTypes';
import { newTabProps } from '@/features/storefront-themes/linkTarget';
import { PreviewBlock } from '@/features/storefront-themes/previewInspector';
import { useInlineEditActive } from '@/features/storefront-themes/inlineEdit';
import { useStorefront, type StorefrontLinkSettings } from '@/features/storefront/StorefrontContext';

const num = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};

const CSS = `
.im-grid{display:grid;grid-template-columns:repeat(var(--im-cols),minmax(0,1fr));grid-auto-rows:var(--im-row);gap:var(--im-gap);grid-auto-flow:dense}
.im-slot{position:relative;grid-column:span var(--im-cs);grid-row:span var(--im-rs);min-width:0}
.im-slot>*{position:absolute;inset:0}
.im-cell{position:relative;overflow:hidden;width:100%;height:100%;display:block;color:inherit;text-decoration:none}
.im-cell img{position:absolute;inset:0;width:100%;height:100%;transition:transform .5s ease}
.im-zoom:hover img{transform:scale(1.05)}
.im-dim::after{content:"";position:absolute;inset:0;background:rgba(0,0,0,0);transition:background .3s}
.im-dim:hover::after{background:rgba(0,0,0,.22)}
.im-cap{position:absolute;left:0;right:0;bottom:0;padding:18px 12px 10px;color:#fff;font-size:14px;font-weight:600;background:linear-gradient(transparent,rgba(0,0,0,.55));z-index:1}
@media (max-width:640px){.im-grid{grid-template-columns:repeat(var(--im-mcols),minmax(0,1fr));grid-auto-rows:calc(var(--im-row) * .7)}.im-slot{grid-column:span var(--im-csm)}}
@media (prefers-reduced-motion:reduce){.im-cell img{transition:none}}
`;

/**
 * "Image mosaic": a free grid of images. The seller decides how many columns, how tall one row is, which image is bigger (spans
 * several columns/rows), what each image links to and how it behaves on hover. Fonts/shape come from the theme (corner radius default).
 */
export function ImageMosaicGrid({ settings, blocks, defaultRadius, fontFamily }: { settings: Record<string, any>; blocks: Block[]; defaultRadius: string; fontFamily?: string }) {
  const { resolveLink } = useStorefront();
  const editing = useInlineEditActive(); // in the editor a tile without a photo shows a placeholder instead of vanishing
  if (blocks.length === 0) return null;
  const cols = num(settings.columns, 1, 12, 4);
  const mcols = Math.min(cols, num(settings.mobileColumns, 1, 6, 2));
  const radius = typeof settings.radius === 'number' ? `${num(settings.radius, 0, 200, 0)}px` : defaultRadius;
  const fit = settings.fit === 'contain' ? 'contain' : 'cover';
  const hover = settings.hover === 'dim' ? 'im-dim' : settings.hover === 'none' ? '' : 'im-zoom';

  const cells = blocks.map((b, i) => {
    const s = b.settings as Record<string, any>;
    if (!s.imageUrl && !editing) return null;
    const cs = Math.min(cols, num(s.colSpan, 1, 12, 1));
    const slot = { ['--im-cs' as string]: cs, ['--im-csm' as string]: Math.min(mcols, cs), ['--im-rs' as string]: num(s.rowSpan, 1, 12, 1) } as CSSProperties;
    const style: CSSProperties = { borderRadius: radius, background: '#0000000d' };
    const img = !s.imageUrl ? null : <img src={s.imageUrl} alt={typeof s.alt === 'string' ? s.alt : ''} loading="lazy" style={{ objectFit: fit, objectPosition: typeof s.focalPoint === 'string' && s.focalPoint ? s.focalPoint : 'center' }} />;
    const cap = s.caption ? <span className="im-cap" style={{ fontFamily }}>{s.caption}</span> : null;
    const target = s.link ? resolveLink(s.link as StorefrontLinkSettings) : null;
    const cls = `im-cell ${hover} ${s.imageUrl ? '' : 'sx-media'}`.trim();
    return (
      <div key={b._id ?? i} className="im-slot" style={slot}>
        <PreviewBlock blockId={String(b._id ?? i)}>
          {target && (target.to || target.href)
            ? (target.to
              ? <Link to={target.to} {...newTabProps(target)} className={cls} style={style}>{img}{cap}</Link>
              : <a href={target.href} className={cls} style={style} {...(target.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{img}{cap}</a>)
            : <div className={cls} style={style}>{img}{cap}</div>}
        </PreviewBlock>
      </div>
    );
  });

  const grid = (
    <>
      <style>{CSS}</style>
      <div className="im-grid" style={{ ['--im-cols' as string]: cols, ['--im-mcols' as string]: mcols, ['--im-gap' as string]: `${num(settings.gap, 0, 100, 8)}px`, ['--im-row' as string]: `${num(settings.rowHeight, 40, 1200, 200)}px` } as CSSProperties}>{cells}</div>
    </>
  );
  return settings.fullWidth === true ? <div style={{ width: '100vw', marginInlineStart: 'calc(50% - 50vw)' }}>{grid}</div> : grid;
}
