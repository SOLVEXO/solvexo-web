import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Block } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { PreviewBlock } from '../../../previewInspector';
import { imageFit } from '../../../imageFit';
import { fashionTheme as t, type FashionColors } from '../../theme.config';
import { SectionShell } from '../SectionShell';
import type { SharedSectionProps } from './types';

function Photo({ block, colors, ratio }: { block: Block; colors: FashionColors; ratio: unknown }) {
  const { resolveLink } = useStorefront();
  const [errored, setErrored] = useState(false);
  const s = block.settings;
  if (!s.imageUrl || errored) return null;
  const fit = imageFit(ratio, '1 / 1');
  const img = (
    <div className="group overflow-hidden" style={{ ...fit.box, background: colors.bgAlt, borderRadius: t.imageRadiusPx }}>
      <img src={s.imageUrl} alt={s.alt ?? ''} loading="lazy" onError={() => setErrored(true)} className="transition-transform duration-700 group-hover:scale-105" style={fit.img} />
    </div>
  );
  if (!s.link) return img;
  const target = resolveLink(s.link);
  return target.to ? <Link to={target.to} className="block">{img}</Link>
    : <a href={target.href} className="block" {...(target.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{img}</a>;
}

export function GalleryGridSection({ section, blocks, colors }: SharedSectionProps) {
  if (blocks.length === 0) return null;
  const cols = [2, 3, 4, 5].includes(Number(section.settings.columns)) ? Number(section.settings.columns) : 3;
  return (
    <SectionShell colors={colors} heading={section.settings.heading}>
      <div className="grid gap-3 md:gap-4" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${Math.floor(1100 / cols)}px), 1fr))` }}>
        {blocks.map((b, i) => (
          <PreviewBlock key={b._id ?? i} blockId={String(b._id ?? i)}>
            <Photo block={b} colors={colors} ratio={section.settings.imageRatio} />
          </PreviewBlock>
        ))}
      </div>
    </SectionShell>
  );
}
