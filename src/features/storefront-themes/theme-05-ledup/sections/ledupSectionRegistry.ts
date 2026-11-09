import type { ReactNode } from 'react';
import type { Section, Block, CoreSectionPreviewContext } from '@/api/services/storefrontTypes';
import type { BaseColors } from '../theme.base';

export type LedupSectionRender = (
  section: Section,
  blocks: Block[],
  colors: BaseColors,
  dynamicSourceValues: Record<string, string>,
  previewContext?: CoreSectionPreviewContext,
) => ReactNode;

const registry = new Map<string, LedupSectionRender>();

export function registerLedupSection(type: string, render: LedupSectionRender) {
  registry.set(type, render);
}

export function resolveLedupSection(type: string): LedupSectionRender | undefined {
  return registry.get(type);
}

export function getRegisteredLedupSectionTypes(): string[] {
  return Array.from(registry.keys());
}
