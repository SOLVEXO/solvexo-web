import type { ReactNode } from 'react';
import type { Section, Block } from '@/api/services/storefrontTypes';

/**
 * The storefront's open section-render registry — replaces the old
 * hardcoded `switch (section.type)` in `SectionRenderer.tsx`. A new section
 * type is added by calling `registerSection()` once, from that section's
 * own component file (see the bottom of `sections/HeroSection.tsx` for the
 * pattern) — never by editing a central branching statement here.
 *
 * `SectionRenderer.tsx` still has to *import* every section module once (so
 * their registration side-effects actually run — the same "must be
 * required somewhere" requirement any plugin-registration architecture has,
 * JS module bundling included), but that import list is a flat, order-
 * independent list, not branching logic that has to be edited correctly
 * per case. This is what "registerable without rewriting an enormous
 * central switch statement" means in practice.
 */
export type SectionRenderFn = (section: Section, blocks: Block[]) => ReactNode;

const registry = new Map<string, SectionRenderFn>();

export function registerSection(type: string, render: SectionRenderFn): void {
  if (registry.has(type)) {
    throw new Error(`Section type "${type}" is already registered — each type may only register one renderer.`);
  }
  registry.set(type, render);
}

export function getSectionRender(type: string): SectionRenderFn | undefined {
  return registry.get(type);
}

export function isSectionRegistered(type: string): boolean {
  return registry.has(type);
}
