import { useRef } from 'react';
import { columnCount } from '@/features/storefront/browse/gridLayout';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { CollectionTileCard, tileOptions, useCollectionTiles, type CollectionTileData } from '../../../collectionTiles';
import { baseTheme as t, type BaseColors } from '../../theme.base';
import { SectionShell } from '../SectionShell';
import type { SharedSectionProps } from './types';

export function CollectionListSection({ section, blocks, colors }: SharedSectionProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const tiles = useCollectionTiles(section, blocks);
  if (!tiles || tiles.length === 0) return null;
  const cols = columnCount(section.settings.columns, 3);
  const opts = tileOptions(section.settings);
  const eyebrow = typeof section.settings.eyebrow === 'string' && section.settings.eyebrow.trim() ? section.settings.eyebrow.trim() : undefined;
  const arrow = <span className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full transition-transform duration-300 group-hover:rotate-45" style={{ background: colors.bg, color: colors.ink }}><ArrowUpRight size={16} className="tx-flip-rtl" aria-hidden /></span>;
  const tile = (c: CollectionTileData) => (
    <CollectionTileCard key={c.key} tile={c} colors={colors as BaseColors} fonts={t.fonts} imageRadius={t.imageRadiusPx} buttonRadius={t.buttonRadiusPx} opts={opts} arrow={arrow} fallbackClass="tx-serif" />
  );
  if (section.settings.layout === 'carousel') {
    const scroll = (dir: 1 | -1) => rowRef.current?.scrollBy({ left: dir * Math.max(240, (rowRef.current?.clientWidth ?? 600) * 0.8), behavior: 'smooth' });
    return (
      <SectionShell colors={colors} heading={section.settings.heading} eyebrow={eyebrow}>
        <div className="relative">
          <div ref={rowRef} className="flex gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ scrollSnapType: 'x mandatory' }}>
            {tiles.map(c => <div key={c.key} className="shrink-0" style={{ width: `min(75%, ${Math.floor(960 / cols)}px)`, scrollSnapAlign: 'start' }}>{tile(c)}</div>)}
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
