import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicCollections, type PublicCollectionSummary } from '@/api/services/collections';
import { imageFit } from '../../../imageFit';
import { fashionTheme as t, type FashionColors } from '../../theme.config';
import { SectionShell } from '../SectionShell';
import type { SharedSectionProps } from './types';

function Tile({ c, colors, ratio, showDescription }: { c: PublicCollectionSummary; colors: FashionColors; ratio: unknown; showDescription: boolean }) {
  const [errored, setErrored] = useState(false);
  const fit = imageFit(ratio, '4 / 5');
  const hasImage = !!c.image && !errored;
  return (
    <Link to={`/collections/${c.slug}`} className="group block no-underline" style={{ color: colors.ink }}>
      <div className="relative overflow-hidden" style={{ ...fit.box, background: colors.bgAlt, borderRadius: t.imageRadiusPx, display: hasImage ? undefined : 'grid', placeItems: 'center' }}>
        {hasImage
          ? <img src={c.image ?? undefined} alt={c.name} loading="lazy" onError={() => setErrored(true)} className="transition-transform duration-700 group-hover:scale-105" style={fit.img} />
          : <span className="fx-serif p-4 text-center text-2xl" style={{ color: colors.inkMuted }}>{c.name}</span>}
        <span className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full transition-transform duration-300 group-hover:rotate-45" style={{ background: colors.bg, color: colors.ink }}><ArrowUpRight size={16} aria-hidden /></span>
      </div>
      <h3 className="m-0 mt-4 text-lg font-semibold tracking-tight" style={{ fontFamily: t.fonts.display }}>{c.name}</h3>
      {showDescription && c.description && <p className="m-0 mt-1.5 line-clamp-2 text-sm leading-relaxed" style={{ color: colors.inkMuted }}>{c.description}</p>}
    </Link>
  );
}

export function CollectionListSection({ section, colors }: SharedSectionProps) {
  const { store } = useStorefront();
  const [items, setItems] = useState<PublicCollectionSummary[] | null>(null);
  useEffect(() => {
    let off = false;
    apiGetPublicCollections(store.storeId).then(r => { if (!off) setItems(r.data ?? []); }).catch(() => { if (!off) setItems([]); });
    return () => { off = true; };
  }, [store.storeId]);
  if (!items || items.length === 0) return null;
  const cols = [2, 3, 4].includes(Number(section.settings.columns)) ? Number(section.settings.columns) : 3;
  const limit = Math.min(24, Math.max(1, Number(section.settings.limit) || 6));
  return (
    <SectionShell colors={colors} heading={section.settings.heading}>
      <div className="grid gap-x-5 gap-y-9" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${Math.floor(960 / cols)}px), 1fr))` }}>
        {items.slice(0, limit).map(c => <Tile key={c._id} c={c} colors={colors} ratio={section.settings.imageRatio} showDescription={section.settings.showDescription === true} />)}
      </div>
    </SectionShell>
  );
}
