import type { Section, CoreSectionPreviewContext } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useStoreTextIndex } from '@/features/storefront/storeTextContext';
import { useExperimentSections } from '../../core/experiments/useExperimentSections';
import { localizeSections } from '@/utils/storeText';
import { resolveSectionColors, baseTypographyCss, baseTheme } from '../theme.base';
import { SectionContentLayer } from '../../shared/SectionContentLayer';
import { BLOCK_STYLE_CSS } from '../../blockStyle';
import { SECTION_SPACING_CSS, sectionSpacing, sectionAnchorId, sectionScopedCss } from '../../sectionSpacing';
import { SectionRulesGate, SectionVideoBg } from '../../sectionDesignRuntime';
import { useSectionReveal } from '../../useSectionReveal';
import { useResolvedSavedSections } from '../../useSavedSections';
import { PreviewInspectorProvider, BlockStyleProvider, type PreviewBlockSelection } from '../../previewInspector';
import { InlineEditProvider, type InlineEditHandler } from '../../inlineEdit';
import { useEffect, useRef } from 'react';
import { ledupTheme } from '../theme.config';
import './register';
import { resolveLedupSection } from './ledupSectionRegistry';

interface Props {
  sections: Section[];
  selectable?: boolean;
  selectedSectionId?: string | null;
  onSelectSection?: (sectionId: string) => void;
  selectedBlockId?: string | null;
  onSelectBlock?: PreviewBlockSelection;
  dynamicSourceValues?: Record<string, string>;
  previewContext?: CoreSectionPreviewContext;
  onEditText?: InlineEditHandler;
}

const EDITOR_CSS = `
.ld-sel{outline:2px solid transparent;outline-offset:-2px;cursor:pointer;transition:outline-color .12s}
.ld-sel:hover{outline-color:rgba(140,115,85,.4)}
.ld-sel-on{outline:2px solid var(--ld-accent);outline-offset:-2px;cursor:pointer}
.theme-editor-block-target{outline:1px dashed transparent;outline-offset:2px;cursor:pointer}
.theme-editor-block-target:hover{outline-color:rgba(140,115,85,.7)}
.theme-editor-block-selected{outline:2px solid var(--ld-accent);outline-offset:2px;cursor:pointer}
[data-inline-edit]{cursor:text;outline:1px dashed transparent;outline-offset:3px;border-radius:2px}
[data-inline-edit]:hover{outline-color:rgba(140,115,85,.7)}
[data-inline-edit]:focus{outline:2px solid var(--ld-accent);background:rgba(140,115,85,.08)}`;

function RevealBox({ children, ...rest }: React.HTMLAttributes<HTMLDivElement> & { 'data-sx'?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { el.classList.add('is-in'); return; }
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { el.classList.add('is-in'); io.disconnect(); } }, { rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} {...rest}>{children}</div>;
}

export function LedupSectionRenderer({
  sections: authored,
  selectable,
  selectedSectionId,
  onSelectSection,
  selectedBlockId,
  onSelectBlock,
  dynamicSourceValues,
  previewContext,
  onEditText,
}: Props) {
  const { theme, store } = useStorefront();
  // Saved (global) sections: a reference on the page is drawn from the store's library.
  const authoredResolved = useResolvedSavedSections(authored, store?.storeId);
  const textIndex = useStoreTextIndex();
  // A/B tests: the visitor's variant of an experiment section (never in the editor).
  const sections = useExperimentSections(selectable ? authoredResolved : localizeSections(authoredResolved, textIndex), !selectable);
  const schemes = theme?.theme?.colorSchemes;
  const dynamic = dynamicSourceValues ?? {};
  useSectionReveal(!selectable, sections.map(sec => String(sec._id ?? '')).join(','));

  return (
    <>
      <style>{SECTION_SPACING_CSS}{BLOCK_STYLE_CSS}{baseTypographyCss('[data-sx]')}{selectable ? EDITOR_CSS : ''}</style>
      {sections.map((rawSection, i) => {
        if (rawSection.enabled === false) return null;
        const render = resolveLedupSection(rawSection.type);
        if (!render) return null;
        // The database drops an empty `settings: {}`, so a section saved with no settings arrives with none at all.
        const section = rawSection.settings ? rawSection : { ...rawSection, settings: {} };
        const blocks = (section.blocks ?? []).map((b, index) => ({ ...b, settings: b.settings ?? {}, _id: b._id ?? String(index) })).filter(b => b.enabled !== false);
        const colors = resolveSectionColors(section.colorSchemeId, schemes);
        const spacing = sectionSpacing(section.settings);
        const key = String(section._id ?? i);
        const scoped = sectionScopedCss(section.settings, key);
        const common = { id: sectionAnchorId(section.settings), 'data-sx': key, style: { backgroundColor: baseTheme.pageBg.image && colors === baseTheme.colors ? 'transparent' : colors.bg, color: colors.ink, ...spacing.style } };

        if (!selectable) {
          const reveal = ledupTheme.reveal && i > 0 && section.type !== 'hero';
          const Box = reveal ? RevealBox : 'div';
          return (
            <SectionRulesGate key={key} settings={section.settings}>
            <Box {...common} className={`relative ${spacing.className} ${reveal ? 'ld-rv' : ''}`}>
              <SectionVideoBg settings={section.settings} />
              {scoped && <style>{scoped}</style>}
              <SectionContentLayer items={section.settings.contentItems} ink={colors.ink} displayFont={baseTheme.fonts.display} bodyFont={baseTheme.fonts.body} />
              <BlockStyleProvider blocks={blocks}>{render(section, blocks, colors, dynamic, previewContext)}</BlockStyleProvider>
            </Box>
          </SectionRulesGate>
          );
        }
        const on = selectedSectionId === key;
        return (
          <div
            key={key}
            {...common}
            data-fx-section-id={key} data-fx-section-type={section.type}
            className={`relative ${on ? 'ld-sel-on' : 'ld-sel'} ${spacing.className}`}
            onClickCapture={e => {
              const block = (e.target as HTMLElement).closest<HTMLElement>('[data-editor-block-id]');
              e.preventDefault();
              e.stopPropagation();
              if (block) onSelectBlock?.(key, block.dataset.editorBlockId ?? '');
              else onSelectSection?.(key);
            }}
          >
            <SectionVideoBg settings={section.settings} />
            {scoped && <style>{scoped}</style>}
            <SectionContentLayer items={section.settings.contentItems} ink={colors.ink} displayFont={baseTheme.fonts.display} bodyFont={baseTheme.fonts.body} selectable />
            <PreviewInspectorProvider value={{ sectionId: key, selectedBlockId: on ? selectedBlockId : null, onSelectBlock, blockStyles: Object.fromEntries(blocks.map(b => [String(b._id), (b.settings as Record<string, unknown>).style])) }}>
              {onEditText ? (
                <InlineEditProvider sectionId={key} onEdit={onEditText}>
                  {render(section, blocks, colors, dynamic, previewContext)}
                </InlineEditProvider>
              ) : (
                render(section, blocks, colors, dynamic, previewContext)
              )}
            </PreviewInspectorProvider>
          </div>
        );
      })}
    </>
  );
}
