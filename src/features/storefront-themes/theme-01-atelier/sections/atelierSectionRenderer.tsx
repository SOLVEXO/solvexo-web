import type { ReactNode } from 'react';
import type { Section, Block } from '@/api/services/storefrontTypes';

type SectionRenderFn = (section: Section, blocks: Block[]) => ReactNode;

/** Atelier's own open section registry — mirrors the app's established
 *  self-registration pattern (each section file calls `registerAtelierSection`
 *  at its own bottom), but scoped to this theme's own render functions
 *  instead of the legacy shared engine's. Section *data* (`Section`/`Block`,
 *  `SectionType`) is real shared infra — validated by the same backend
 *  `section-settings.validator.ts` every theme's content goes through — only
 *  the rendering is theme-specific. */
const registry = new Map<string, SectionRenderFn>();

export function registerAtelierSection(type: string, render: SectionRenderFn) {
  registry.set(type, render);
}

export function getAtelierSectionRender(type: string): SectionRenderFn | undefined {
  return registry.get(type);
}

interface AtelierSectionRendererProps {
  sections: Section[];
  /** Editor-only click-to-select. When true, each rendered section becomes a
   *  click target — intercepted in the CAPTURE phase (before the click can
   *  reach a real `<a>`/`<button>`/form inside the section), so clicking a
   *  section in a live preview selects it instead of actually navigating,
   *  submitting, or adding to cart. Defaults to `undefined`/falsy, in which
   *  case this renders through the exact same code path as before this prop
   *  existed — no extra attributes, no listeners, no style — so the real
   *  storefront (which renders through this same component for every buyer)
   *  and any other existing caller are byte-for-byte unaffected. */
  selectable?: boolean;
  selectedSectionId?: string | null;
  onSelectSection?: (sectionId: string) => void;
}

/** Renders a real `Section[]` (as authored via the seller's Pages editor)
 *  through Atelier's own section components. Unknown/unregistered types and
 *  `enabled: false` sections are skipped silently — matches the legacy
 *  engine's own established convention (missing `enabled` behaves like `true`). */
export function AtelierSectionRenderer({ sections, selectable, selectedSectionId, onSelectSection }: AtelierSectionRendererProps) {
  if (!selectable) {
    return (
      <>
        {sections.map((section, i) => {
          if (section.enabled === false) return null;
          const render = getAtelierSectionRender(section.type);
          if (!render) return null;
          const blocks = (section.blocks ?? []).filter(b => b.enabled !== false);
          return <div key={section._id ?? i}>{render(section, blocks)}</div>;
        })}
      </>
    );
  }

  return (
    <>
      {/* Scoped, editor-only selection styling — only ever rendered when
         `selectable` is explicitly on, i.e. never on the real storefront. */}
      <style>{`
        .atelier-section-selectable{outline:2px solid transparent;outline-offset:-2px;cursor:pointer;transition:outline-color 120ms ease;}
        .atelier-section-selectable:hover{outline-color:rgba(217,119,87,0.35);}
        .atelier-section-selected{outline:2px solid #D97757;outline-offset:-2px;cursor:pointer;}
      `}</style>
      {sections.map((section, i) => {
        if (section.enabled === false) return null;
        const render = getAtelierSectionRender(section.type);
        if (!render) return null;
        const blocks = (section.blocks ?? []).filter(b => b.enabled !== false);
        const sectionId = String(section._id ?? i);
        const isSelected = selectedSectionId === sectionId;
        return (
          <div
            key={section._id ?? i}
            data-atelier-section-id={sectionId}
            className={isSelected ? 'atelier-section-selected' : 'atelier-section-selectable'}
            onClickCapture={e => {
              e.preventDefault();
              e.stopPropagation();
              onSelectSection?.(sectionId);
            }}
          >
            {render(section, blocks)}
          </div>
        );
      })}
    </>
  );
}
