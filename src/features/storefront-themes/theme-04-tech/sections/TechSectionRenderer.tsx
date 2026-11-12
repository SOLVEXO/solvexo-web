import type { Section, CoreSectionPreviewContext } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useStoreTextIndex } from '@/features/storefront/storeTextContext';
import { useExperimentSections } from '../../core/experiments/useExperimentSections';
import { localizeSections } from '@/utils/storeText';
import { resolveSectionColors, baseTypographyCss } from '../theme.base';
import { SECTION_SPACING_CSS, sectionSpacing, sectionAnchorId, sectionScopedCss } from '../../sectionSpacing';
import { PreviewInspectorProvider, type PreviewBlockSelection } from '../../previewInspector';
import { InlineEditProvider, type InlineEditHandler } from '../../inlineEdit';
import './register';
import { resolveTechSection } from './techSectionRegistry';

interface Props {
  sections: Section[];
  /** Editor only: click a section / block to select it. */
  selectable?: boolean;
  selectedSectionId?: string | null;
  onSelectSection?: (sectionId: string) => void;
  selectedBlockId?: string | null;
  onSelectBlock?: PreviewBlockSelection;
  dynamicSourceValues?: Record<string, string>;
  previewContext?: CoreSectionPreviewContext;
  /** Editor only: headlines become click-to-type; called with the edited value. */
  onEditText?: InlineEditHandler;
}

const EDITOR_CSS = `
.tx-sel{outline:2px solid transparent;outline-offset:-2px;cursor:pointer;transition:outline-color .12s}
.tx-sel:hover{outline-color:rgba(1,86,255,.4)}
.tx-sel-on{outline:2px solid #0156FF;outline-offset:-2px;cursor:pointer}
.theme-editor-block-target{outline:1px dashed transparent;outline-offset:2px;cursor:pointer}
.theme-editor-block-target:hover{outline-color:rgba(1,86,255,.7)}
.theme-editor-block-selected{outline:2px solid #0156FF;outline-offset:2px;cursor:pointer}
[data-inline-edit]{cursor:text;outline:1px dashed transparent;outline-offset:3px;border-radius:2px}
[data-inline-edit]:hover{outline-color:rgba(1,86,255,.7)}
[data-inline-edit]:focus{outline:2px solid #0156FF;background:rgba(1,86,255,.08)}`;

/** Renders a store's authored `Section[]` through the Tech renderers. Sections the theme cannot draw, and `enabled:false` ones, are skipped. */
export function TechSectionRenderer({ sections: authored, selectable, selectedSectionId, onSelectSection, selectedBlockId, onSelectBlock, dynamicSourceValues, previewContext, onEditText }: Props) {
  const { theme } = useStorefront();
  const textIndex = useStoreTextIndex();
  // A/B tests: the visitor's variant of an experiment section (never in the editor).
  const sections = useExperimentSections(selectable ? authored : localizeSections(authored, textIndex), !selectable);
  const schemes = theme?.theme?.colorSchemes;
  const dynamic = dynamicSourceValues ?? {};

  return (
    <>
      <style>{SECTION_SPACING_CSS}{baseTypographyCss('[data-sx]')}{selectable ? EDITOR_CSS : ''}</style>
      {sections.map((rawSection, i) => {
        if (rawSection.enabled === false) return null;
        const render = resolveTechSection(rawSection.type);
        if (!render) return null;
        // The database drops an empty `settings: {}`, so a section saved with no settings arrives with none at all.
        const section = rawSection.settings ? rawSection : { ...rawSection, settings: {} };
        const blocks = (section.blocks ?? []).map((b, index) => ({ ...b, settings: b.settings ?? {}, _id: b._id ?? String(index) })).filter(b => b.enabled !== false);
        const colors = resolveSectionColors(section.colorSchemeId, schemes);
        const spacing = sectionSpacing(section.settings);
        const key = String(section._id ?? i);
        const scoped = sectionScopedCss(section.settings, key);
        const common = { id: sectionAnchorId(section.settings), 'data-sx': key, style: { backgroundColor: colors.bg, color: colors.ink, ...spacing.style } };

        if (!selectable) {
          return (
            <div key={key} {...common} className={`tx-bidi ${spacing.className}`.trim()}>
              {scoped && <style>{scoped}</style>}
              {render(section, blocks, colors, dynamic, previewContext)}
            </div>
          );
        }
        const on = selectedSectionId === key;
        return (
          <div key={key} {...common} data-fx-section-id={key} className={`tx-bidi ${on ? 'tx-sel-on' : 'tx-sel'} ${spacing.className}`}
            onClickCapture={e => {
              const block = (e.target as HTMLElement).closest<HTMLElement>('[data-editor-block-id]');
              e.preventDefault();
              e.stopPropagation();
              if (block) onSelectBlock?.(key, block.dataset.editorBlockId ?? '');
              else onSelectSection?.(key);
            }}>
            {scoped && <style>{scoped}</style>}
            <PreviewInspectorProvider value={{ sectionId: key, selectedBlockId: on ? selectedBlockId : null, onSelectBlock }}>
              {onEditText ? <InlineEditProvider sectionId={key} onEdit={onEditText}>{render(section, blocks, colors, dynamic, previewContext)}</InlineEditProvider> : render(section, blocks, colors, dynamic, previewContext)}
            </PreviewInspectorProvider>
          </div>
        );
      })}
    </>
  );
}
