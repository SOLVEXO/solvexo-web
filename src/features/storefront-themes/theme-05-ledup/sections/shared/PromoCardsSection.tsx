import { PromoCardsGrid } from '@/features/storefront/sections/PromoCardsGrid';
import { baseTheme as t } from '../../theme.base';
import { SectionShell } from '../SectionShell';
import type { SharedSectionProps } from './types';

/** "Promo cards": free-form image + text cards; the seller sets layout, size and colours, the theme supplies fonts, shapes and defaults. */
export function PromoCardsSection({ section, blocks, colors }: SharedSectionProps) {
  if (blocks.length === 0) return null;
  const cardRadius = (t as { sectionRadiusPx?: string }).sectionRadiusPx ?? '24px';
  return (
    <SectionShell colors={colors} heading={section.settings.heading}>
      <PromoCardsGrid settings={section.settings} blocks={blocks} tokens={{
        fontDisplay: t.fonts.display, fontBody: t.fonts.body, buttonRadius: t.buttonRadiusPx, cardRadius,
        ink: colors.ink, inkMuted: colors.inkMuted, panelBg: colors.bgAlt, accent: colors.accent, accentInk: colors.accentInk,
      }} />
    </SectionShell>
  );
}
