import type { Section, CoreSectionPreviewContext } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { resolveSectionColors, fashionTypographyCss } from '../theme.config';
import { SECTION_SPACING_CSS, sectionSpacing, sectionAnchorId, sectionScopedCss } from '../../sectionSpacing';
import { PreviewInspectorProvider, type PreviewBlockSelection } from '../../previewInspector';
import { registry } from './sectionRegistry';
import { useStoreTextIndex } from '@/features/storefront/storeTextContext';
import { localizeSections } from '@/utils/storeText';
import { InlineEditProvider, type InlineEditHandler } from '../../inlineEdit';

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
.fx-sel{outline:2px solid transparent;outline-offset:-2px;cursor:pointer;transition:outline-color .12s}
.fx-sel:hover{outline-color:rgba(9,9,11,.35)}
.fx-sel-on{outline:2px solid #09090B;outline-offset:-2px;cursor:pointer}
.theme-editor-block-target{outline:1px dashed transparent;outline-offset:2px;cursor:pointer}
.theme-editor-block-target:hover{outline-color:rgba(9,9,11,.7)}
.theme-editor-block-selected{outline:2px solid #09090B;outline-offset:2px;cursor:pointer}
[data-inline-edit]{cursor:text;outline:1px dashed transparent;outline-offset:3px;border-radius:2px}
[data-inline-edit]:hover{outline-color:rgba(217,119,87,.7)}
[data-inline-edit]:focus{outline:2px solid #D97757;background:rgba(217,119,87,.08)}`;

/** Renders a store's authored `Section[]` through this theme's own section components.
 *  Types the theme has no renderer for, and `enabled:false` sections, are skipped. */
export function FashionSectionRenderer({ sections: authored, selectable, selectedSectionId, onSelectSection, selectedBlockId, onSelectBlock, dynamicSourceValues, previewContext, onEditText }: Props) {
  const { theme } = useStorefront();
  // Visitors in another language see the seller's translations; the editor always shows the source text.
  const textIndex = useStoreTextIndex();
  const sections = selectable ? authored : localizeSections(authored, textIndex);
  const schemes = theme?.theme?.colorSchemes;
  const dynamic = dynamicSourceValues ?? {};

  return (
    <>
      <style>{SECTION_SPACING_CSS}{fashionTypographyCss('[data-sx]')}{selectable ? EDITOR_CSS : ''}</style>
      {sections.map((section, i) => {
        if (section.enabled === false) return null;
        const render = registry.get(section.type);
        if (!render) return null;
        const blocks = (section.blocks ?? []).map((b, index) => (b._id ? b : { ...b, _id: String(index) })).filter(b => b.enabled !== false);
        const colors = resolveSectionColors(section.colorSchemeId, schemes);
        const spacing = sectionSpacing(section.settings);
        const key = String(section._id ?? i);
        const scoped = sectionScopedCss(section.settings, key);
        const common = { id: sectionAnchorId(section.settings), 'data-sx': key, style: { backgroundColor: colors.bg, color: colors.ink, ...spacing.style } };

        if (!selectable) {
          return (
            <div key={key} {...common} className={`fx-bidi ${spacing.className}`.trim()}>
              {scoped && <style>{scoped}</style>}
              {render(section, blocks, colors, dynamic, previewContext)}
            </div>
          );
        }
        const on = selectedSectionId === key;
        return (
          <div key={key} {...common} data-fx-section-id={key} className={`fx-bidi ${on ? 'fx-sel-on' : 'fx-sel'} ${spacing.className}`}
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
