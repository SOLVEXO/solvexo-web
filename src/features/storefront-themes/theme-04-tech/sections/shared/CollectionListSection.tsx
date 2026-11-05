import { useEffect, useRef, useState } from 'react';
import { handleOf } from '@/utils/activeStoreText';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicCollections, type PublicCollectionSummary } from '@/api/services/collections';
import { imageFit } from '../../../imageFit';
import { baseTheme as t, type BaseColors } from '../../theme.base';
import { SectionShell } from '../SectionShell';
import type { SharedSectionProps } from './types';

function Tile({ c, colors, ratio, showDescription, simple, center }: { c: PublicCollectionSummary; simple?: boolean; center?: boolean; colors: BaseColors; ratio: unknown; showDescription: boolean }) {
  const [errored, setErrored] = useState(false);
  const fit = imageFit(ratio, '4 / 5');
  const hasImage = !!c.image && !errored;
  return (
    <Link to={`/collections/${handleOf(c)}`} className="group block no-underline" style={{ color: colors.ink, textAlign: center ? 'center' : undefined }}>
      <div className="relative overflow-hidden" style={{ ...fit.box, background: colors.bgAlt, borderRadius: t.imageRadiusPx, display: hasImage ? undefined : 'grid', placeItems: 'center' }}>
        {hasImage
          ? <img src={c.image ?? undefined} alt={c.name} loading="lazy" onError={() => setErrored(true)} className="transition-transform duration-700 group-hover:scale-105" style={fit.img} />
          : <span className="tx-serif p-4 text-center text-2xl" style={{ color: colors.inkMuted }}>{c.name}</span>}
        {!simple && <span className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full transition-transform duration-300 group-hover:rotate-45" style={{ background: colors.bg, color: colors.ink }}><ArrowUpRight size={16} className="tx-flip-rtl" aria-hidden /></span>}
      </div>
      <h3 className="m-0 mt-4 text-lg font-semibold tracking-tight" style={{ fontFamily: t.fonts.display }}>{c.name}</h3>
      {showDescription && c.description && <p className="m-0 mt-1.5 line-clamp-2 text-sm leading-relaxed" style={{ color: colors.inkMuted }}>{c.description}</p>}
    </Link>
  );
}

export function CollectionListSection({ section, colors }: SharedSectionProps) {
  const rowRef = useRef<HTMLDivElement>(null);
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
  const simple = section.settings.tileStyle === 'simple';
  const center = section.settings.textAlign === 'center';
  const eyebrow = typeof section.settings.eyebrow === 'string' && section.settings.eyebrow.trim() ? section.settings.eyebrow.trim() : undefined;
  const tiles = items.slice(0, limit);
  const tile = (c: PublicCollectionSummary) => <Tile key={c._id} c={c} colors={colors} ratio={section.settings.imageRatio} showDescription={section.settings.showDescription === true} simple={simple} center={center} />;
  if (section.settings.layout === 'carousel') {
    const scroll = (dir: 1 | -1) => rowRef.current?.scrollBy({ left: dir * Math.max(240, (rowRef.current?.clientWidth ?? 600) * 0.8), behavior: 'smooth' });
    return (
      <SectionShell colors={colors} heading={section.settings.heading} eyebrow={eyebrow}>
        <div className="relative">
          <div ref={rowRef} className="flex gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ scrollSnapType: 'x mandatory' }}>
            {tiles.map(c => <div key={c._id} className="shrink-0" style={{ width: `min(75%, ${Math.floor(960 / cols)}px)`, scrollSnapAlign: 'start' }}>{tile(c)}</div>)}
          </div>
          {tiles.length > cols && (
            <>
              <button type="button" aria-label="Previous" onClick={() => scroll(-1)} className="absolute left-0 top-1/3 grid size-10 -translate-x-1/2 cursor-pointer place-items-center rounded-full border-0 shadow" style={{ background: colors.bg, color: colors.ink }}><ChevronLeft size={18} aria-hidden /></button>
              <button type="button" aria-label="Next" onClick={() => scroll(1)} className="absolute right-0 top-1/3 grid size-10 translate-x-1/2 cursor-pointer place-items-center rounded-full border-0 shadow" style={{ background: colors.bg, color: colors.ink }}><ChevronRight size={18} aria-hidden /></button>
            </>
          )}
        </div>
      </SectionShell>
    );
  }
  return (
    <SectionShell colors={colors} heading={section.settings.heading} eyebrow={eyebrow}>
      <div className="grid gap-x-5 gap-y-9" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${Math.floor(960 / cols)}px), 1fr))` }}>
        {tiles.map(tile)}
      </div>
    </SectionShell>
  );
}
