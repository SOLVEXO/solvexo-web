import type { ReactNode } from 'react';
import type { Section, Block, CoreSectionPreviewContext } from '@/api/services/storefrontTypes';
import type { FashionColors } from '../theme.config';

/** (section, visible blocks, resolved palette, dynamic-source values, editor-preview context) -> markup */
export type FashionSectionRender = (
  section: Section, blocks: Block[], colors: FashionColors, dynamicSourceValues: Record<string, string>, previewContext?: CoreSectionPreviewContext,
) => ReactNode;

export const registry = new Map<string, FashionSectionRender>();

export function registerFashionSection(type: string, render: FashionSectionRender) {
  registry.set(type, render);
}

export function getRegisteredFashionSectionTypes(): string[] {
  return Array.from(registry.keys());
}
