import type { ReactNode } from 'react';
import type { Section, Block, CoreSectionPreviewContext } from '@/api/services/storefrontTypes';
import type { BaseColors } from '../theme.base';

/** (section, visible blocks, resolved palette, dynamic-source values, editor-preview context) -> markup */
export type TechSectionRender = (
  section: Section, blocks: Block[], colors: BaseColors, dynamicSourceValues: Record<string, string>, previewContext?: CoreSectionPreviewContext,
) => ReactNode;

const registry = new Map<string, TechSectionRender>();

export function registerTechSection(type: string, render: TechSectionRender) {
  registry.set(type, render);
}

export function resolveTechSection(type: string): TechSectionRender | undefined {
  return registry.get(type);
}

export function getRegisteredTechSectionTypes(): string[] {
  return Array.from(registry.keys());
}
