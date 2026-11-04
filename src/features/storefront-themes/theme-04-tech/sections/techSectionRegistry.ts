import { registry as baseRegistry, type FashionSectionRender } from '../../theme-03-fashion/sections/sectionRegistry';

/** Tech-owned renderers. A section type Tech does not draw itself falls back to the shared renderer, which reads the
 *  bridged palette/fonts (see `theme.config.ts`), so every platform section type still renders in the Tech colours. */
export type TechSectionRender = FashionSectionRender;

const techRegistry = new Map<string, TechSectionRender>();

export function registerTechSection(type: string, render: TechSectionRender) {
  techRegistry.set(type, render);
}

export function resolveTechSection(type: string): TechSectionRender | undefined {
  return techRegistry.get(type) ?? baseRegistry.get(type);
}

export function getRegisteredTechSectionTypes(): string[] {
  return Array.from(new Set([...baseRegistry.keys(), ...techRegistry.keys()]));
}
