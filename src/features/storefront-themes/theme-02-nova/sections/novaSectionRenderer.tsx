import type { ReactNode } from 'react';
import type { Section, Block } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { resolveSectionColors, type NovaSectionColors } from '../theme.config';

/** Third argument is this section's resolved color palette; fourth is the
 *  Dynamic Sources lookup (current resource's real metafield values, keyed
 *  `"namespace:key"`) — see `atelierSectionRenderer.tsx`'s identical
 *  `SectionRenderFn` doc comment for the full rationale on both. */
type SectionRenderFn = (section: Section, blocks: Block[], colors: NovaSectionColors, dynamicSourceValues: Record<string, string>) => ReactNode;

/** Nova's own open section registry — byte-for-byte the same pattern as
 *  `atelierSectionRenderer.tsx` (see that file's doc comment for the full
 *  rationale: section *data* is real shared platform infra, only the
 *  rendering is theme-specific), scoped to this theme's own render
 *  functions. This is the exact mechanism that makes a second theme
 *  possible without any change to the section-data layer or the editor. */
const registry = new Map<string, SectionRenderFn>();

export function registerNovaSection(type: string, render: SectionRenderFn) {
  registry.set(type, render);
}

export function getNovaSectionRender(type: string): SectionRenderFn | undefined {
  return registry.get(type);
}

/** Every section type this theme actually has a render function for — read
 *  by `theme.preview.ts` at registration time and published as
 *  `ThemePreviewComponents.supportedSectionTypes`, so `AddSectionModal` can
 *  offer merchants only what this theme can really render (this is exactly
 *  what closes the gap this theme's own `sections/index.ts` doc comment
 *  flagged: Video/DropCountdown being unregistered here used to be silently
 *  invisible to the "Add a Section" picker too, not just to rendering). */
export function getRegisteredNovaSectionTypes(): string[] {
  return Array.from(registry.keys());
}

interface NovaSectionRendererProps {
  sections: Section[];
  /** Editor-only click-to-select — same contract as
   *  `AtelierSectionRenderer`'s own `selectable` prop, so the generic
   *  Customize page's click-to-select preview works identically regardless
   *  of which theme is active. */
  selectable?: boolean;
  selectedSectionId?: string | null;
  onSelectSection?: (sectionId: string) => void;
  /** Dynamic Sources lookup — see `SectionRenderFn`'s own doc comment. */
  dynamicSourceValues?: Record<string, string>;
}

/** Renders a real `Section[]` (as authored via the seller's Pages editor)
 *  through Nova's own section components. Unknown/unregistered types (this
 *  theme implements a real subset of the shared vocabulary — see this
 *  theme's own README in `theme.config.ts`) and `enabled: false` sections
 *  are skipped silently — matches the platform's own established convention. */
export function NovaSectionRenderer({ sections, selectable, selectedSectionId, onSelectSection, dynamicSourceValues }: NovaSectionRendererProps) {
  const { theme } = useStorefront();
  const colorSchemes = theme?.theme.colorSchemes;
  const dynamicValues = dynamicSourceValues ?? {};

  if (!selectable) {
    return (
      <>
        {sections.map((section, i) => {
          if (section.enabled === false) return null;
          const render = getNovaSectionRender(section.type);
          if (!render) return null;
          const blocks = (section.blocks ?? []).filter(b => b.enabled !== false);
          const colors = resolveSectionColors(section.colorSchemeId, colorSchemes);
          return <div key={section._id ?? i} style={{ background: colors.bg }}>{render(section, blocks, colors, dynamicValues)}</div>;
        })}
      </>
    );
  }

  return (
    <>
      <style>{`
        .nova-section-selectable{outline:2px solid transparent;outline-offset:-2px;cursor:pointer;transition:outline-color 120ms ease;}
        .nova-section-selectable:hover{outline-color:rgba(75,59,255,0.35);}
        .nova-section-selected{outline:2px solid #4B3BFF;outline-offset:-2px;cursor:pointer;}
      `}</style>
      {sections.map((section, i) => {
        if (section.enabled === false) return null;
        const render = getNovaSectionRender(section.type);
        if (!render) return null;
        const blocks = (section.blocks ?? []).filter(b => b.enabled !== false);
        const colors = resolveSectionColors(section.colorSchemeId, colorSchemes);
        const sectionId = String(section._id ?? i);
        const isSelected = selectedSectionId === sectionId;
        return (
          <div
            key={section._id ?? i}
            data-nova-section-id={sectionId}
            className={isSelected ? 'nova-section-selected' : 'nova-section-selectable'}
            style={{ background: colors.bg }}
            onClickCapture={e => {
              e.preventDefault();
              e.stopPropagation();
              onSelectSection?.(sectionId);
            }}
          >
            {render(section, blocks, colors, dynamicValues)}
          </div>
        );
      })}
    </>
  );
}
