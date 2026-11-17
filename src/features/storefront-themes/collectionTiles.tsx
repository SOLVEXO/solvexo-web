import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Block, Section } from '@/api/services/storefrontTypes';
import { apiGetPublicCollections, type PublicCollectionSummary } from '@/api/services/collections';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { handleOf } from '@/utils/activeStoreText';
import { imageFit } from './imageFit';
import { collectionIcon } from './collectionIcons';
import { PreviewBlock } from './previewInspector';

/** One tile of a Collection List, already merged: a picked collection supplies the basics, anything the seller typed on the tile wins. */
export interface CollectionTileData {
  key: string;
  blockId?: string;
  name: string;
  description: string;
  image: string;
  /** Key of a built-in icon (see collectionIcons.ts), or ''. */
  icon: string;
  /** Where the image / title go (the collection page). */
  to?: string;
  ctaText: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- seller-authored link JSON
  ctaLink?: any;
}

/** Loads the store's collections and merges them with the section's hand-made tiles.
 *  No tiles added = the automatic list (first `limit` collections). Tiles added = exactly those tiles, in order. */
export function useCollectionTiles(section: Section, blocks: Block[]): CollectionTileData[] | null {
  const { store } = useStorefront();
  const [items, setItems] = useState<PublicCollectionSummary[] | null>(null);
  useEffect(() => {
    let off = false;
    apiGetPublicCollections(store.storeId).then(r => { if (!off) setItems(r.data ?? []); }).catch(() => { if (!off) setItems([]); });
    return () => { off = true; };
  }, [store.storeId]);
  const limit = Math.min(24, Math.max(1, Number(section.settings.limit) || 6));
  const showDesc = section.settings.showDescription === true;
  return useMemo(() => {
    if (!items) return null;
    const manual = blocks.filter(b => b.type === 'collection_item' && b.enabled !== false);
    if (manual.length === 0) {
      return items.slice(0, limit).map(c => ({
        key: c._id, name: c.name, description: showDesc ? c.description ?? '' : '', image: c.image ?? '', icon: '',
        to: `/collections/${handleOf(c)}`, ctaText: '',
      }));
    }
    const out: CollectionTileData[] = [];
    manual.forEach((b, i) => {
      const s = b.settings ?? {};
      const c = s.collectionId ? items.find(x => x._id === s.collectionId) : undefined;
      const name = String(s.title ?? '').trim() || c?.name || '';
      const image = String(s.imageUrl ?? '').trim() || c?.image || '';
      const icon = String(s.icon ?? '').trim();
      if (!name && !image && !icon) return; // an empty tile (nothing picked, nothing typed) is skipped
      out.push({
        key: String(b._id ?? i), blockId: String(b._id ?? i), name,
        description: String(s.description ?? '').trim() || (showDesc ? c?.description ?? '' : ''),
        image, icon, to: c ? `/collections/${handleOf(c)}` : undefined,
        ctaText: String(s.ctaText ?? '').trim(), ctaLink: s.ctaLink,
      });
    });
    return out;
  }, [items, blocks, limit, showDesc]);
}

export interface TileColors { ink: string; inkMuted: string; bg: string; bgAlt: string; border: string; accent: string; accentInk?: string }

function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

export interface TileOptions {
  ratio: unknown;
  showDescription: boolean;
  /** 'simple' = image with the name below; otherwise the image carries the arrow chip. */
  simple: boolean;
  center: boolean;
  cardStyle: 'none' | 'bordered' | 'filled';
  buttonStyle: 'solid' | 'outline' | 'link';
}

export function tileOptions(s: Record<string, unknown>): TileOptions {
  return {
    ratio: s.imageRatio,
    showDescription: s.showDescription === true,
    simple: s.tileStyle === 'simple',
    center: s.textAlign === 'center',
    cardStyle: s.cardStyle === 'bordered' || s.cardStyle === 'filled' ? s.cardStyle : 'none',
    buttonStyle: s.buttonStyle === 'outline' || s.buttonStyle === 'link' ? s.buttonStyle : 'solid',
  };
}

/** One Collection List tile, shared by every theme: the theme only passes its colours, fonts, radii and arrow chip. */
export function CollectionTileCard({ tile, colors, fonts, imageRadius, buttonRadius, opts, arrow, fallbackClass }: {
  tile: CollectionTileData;
  colors: TileColors;
  fonts: { display: string; body: string };
  imageRadius: string | number;
  buttonRadius: string | number;
  opts: TileOptions;
  /** The theme's circular arrow chip, shown on the image in the default tile style. */
  arrow?: ReactNode;
  fallbackClass?: string;
}) {
  const { resolveLink } = useStorefront();
  const [errored, setErrored] = useState(false);
  const fit = imageFit(opts.ratio, '4 / 5');
  const hasImage = !!tile.image && !errored;
  const Icon = collectionIcon(tile.icon);
  const boxed = opts.cardStyle !== 'none';
  const cardStyle: CSSProperties = {
    color: colors.ink, textAlign: opts.center ? 'center' : undefined, height: '100%',
    display: 'flex', flexDirection: 'column', alignItems: opts.center ? 'center' : 'stretch',
    ...(boxed ? { padding: 16, borderRadius: imageRadius, background: opts.cardStyle === 'filled' ? colors.bgAlt : 'transparent', border: `1px solid ${colors.border}` } : {}),
  };

  const visual = hasImage ? (
    <div className="relative overflow-hidden" style={{ ...fit.box, width: '100%', background: colors.bgAlt, borderRadius: imageRadius }}>
      <img src={tile.image} alt={tile.name} loading="lazy" onError={() => setErrored(true)} className="transition-transform duration-700 group-hover:scale-105" style={fit.img} />
      {!opts.simple && tile.to && arrow}
    </div>
  ) : Icon ? (
    <div aria-hidden style={{ width: 56, height: 56, display: 'grid', placeItems: 'center', borderRadius: imageRadius, background: colors.bgAlt, color: colors.accent }}><Icon size={28} /></div>
  ) : tile.blockId ? null : (
    <div className="relative overflow-hidden" style={{ ...fit.box, width: '100%', background: colors.bgAlt, borderRadius: imageRadius, display: 'grid', placeItems: 'center' }}>
      <span className={`${fallbackClass ?? ''} p-4 text-center text-2xl`} style={{ color: colors.inkMuted }}>{tile.name}</span>
      {!opts.simple && tile.to && arrow}
    </div>
  );

  const heading = tile.name && (
    <h3 className="m-0 mt-4 text-lg font-semibold tracking-tight" style={{ fontFamily: fonts.display, color: colors.ink }}>{tile.name}</h3>
  );
  const top = (
    <>
      {visual}
      {heading}
    </>
  );

  const solidInk = colors.accentInk ?? (luminance(colors.accent) < 0.5 ? '#FFFFFF' : '#09090B');
  const btnBase: CSSProperties = { fontFamily: fonts.body, fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' };
  const btnStyle: CSSProperties = opts.buttonStyle === 'link'
    ? { ...btnBase, color: colors.accent, padding: 0 }
    : { ...btnBase, padding: '10px 18px', borderRadius: buttonRadius, border: `1px solid ${colors.accent}`, background: opts.buttonStyle === 'solid' ? colors.accent : 'transparent', color: opts.buttonStyle === 'solid' ? solidInk : colors.accent };
  const target = tile.ctaText ? (tile.ctaLink ? resolveLink(tile.ctaLink) : tile.to ? { to: tile.to } : null) : null;
  const button = tile.ctaText && target && (
    <div style={{ marginTop: 'auto', paddingTop: 16 }}>
      {'to' in target && target.to
        ? <Link to={target.to} style={btnStyle}>{tile.ctaText}</Link>
        : <a href={(target as { href?: string }).href ?? '#'} style={btnStyle} {...((target as { newTab?: boolean }).newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{tile.ctaText}</a>}
    </div>
  );

  const body = (
    <>
      {tile.description && (
        <p className="m-0 mt-1.5 text-sm leading-relaxed" style={{ fontFamily: fonts.body, color: colors.inkMuted }}>{tile.description}</p>
      )}
      {button}
    </>
  );

  const content = tile.to
    ? <Link to={tile.to} className="group block no-underline" style={{ color: colors.ink, width: '100%' }}>{top}</Link>
    : <div className="group block" style={{ width: '100%' }}>{top}</div>;

  const card = <div style={cardStyle}>{content}{body}</div>;
  return tile.blockId ? <PreviewBlock blockId={tile.blockId}>{card}</PreviewBlock> : card;
}
