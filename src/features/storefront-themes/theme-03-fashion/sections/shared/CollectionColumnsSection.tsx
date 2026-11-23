import { CollectionColumnsGrid } from '@/features/storefront/sections/CollectionColumnsGrid';
import { fashionTheme as t } from '../../theme.config';
import { SectionShell } from '../SectionShell';
import type { SharedSectionProps } from './types';

/** "Collection columns": columns of compact product rows; the seller sets every size and colour, Maison supplies fonts and defaults. */
export function CollectionColumnsSection({ section, blocks, colors }: SharedSectionProps) {
  if (blocks.length === 0) return null;
  return (
    <SectionShell colors={colors} heading={section.settings.heading}>
      <CollectionColumnsGrid settings={section.settings} blocks={blocks} tokens={{
        fontDisplay: t.fonts.display, fontBody: t.fonts.body, ink: colors.ink, inkMuted: colors.inkMuted, border: colors.border,
        panelBg: colors.bgAlt, accent: colors.accent, radius: t.sectionRadiusPx,
      }} />
    </SectionShell>
  );
}
