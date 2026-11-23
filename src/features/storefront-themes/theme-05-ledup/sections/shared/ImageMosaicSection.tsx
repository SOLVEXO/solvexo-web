import { ImageMosaicGrid } from '@/features/storefront/sections/ImageMosaicGrid';
import { baseTheme as t } from '../../theme.base';
import { SectionShell } from '../SectionShell';
import type { SharedSectionProps } from './types';

/** "Image mosaic": a free grid of linked images; the seller sets columns, sizes, links and hover, the theme supplies corners and font. */
export function ImageMosaicSection({ section, blocks, colors }: SharedSectionProps) {
  if (blocks.length === 0) return null;
  return (
    <SectionShell colors={colors} heading={section.settings.heading}>
      <ImageMosaicGrid settings={section.settings} blocks={blocks} defaultRadius={t.imageRadiusPx} fontFamily={t.fonts.body} />
    </SectionShell>
  );
}
