import type { ReactNode } from 'react';
import type { Block, Section } from '@/api/services/storefrontTypes';
import { StoreSectionHost, type Shell } from './StoreSectionHost';
import type { StoreSectionColors } from './StoreSectionView';

/** The section key every seller-built section starts with. */
export const STORE_SECTION_PREFIX = 'my.';
export const isStoreSectionKey = (key: unknown): key is string => typeof key === 'string' && key.startsWith(STORE_SECTION_PREFIX);

/** What a theme's `theme_section` renderer returns for a key it has no code for: the seller's own design, or nothing. */
export function renderStoreSection<C extends StoreSectionColors>(section: Section, blocks: Block[], colors: C, Shell: Shell<C>): ReactNode {
  if (!isStoreSectionKey(section.settings?.sectionKey)) return null;
  return <StoreSectionHost section={section} blocks={blocks} colors={colors} Shell={Shell} />;
}
