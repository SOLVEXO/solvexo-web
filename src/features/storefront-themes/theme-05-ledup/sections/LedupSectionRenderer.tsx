import type { Section, CoreSectionPreviewContext } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useStoreTextIndex } from '@/features/storefront/storeTextContext';
import { useExperimentSections } from '../../core/experiments/useExperimentSections';
import { localizeSections } from '@/utils/storeText';
import { resolveSectionColors, baseTypographyCss } from '../theme.base';
import { SECTION_SPACING_CSS, sectionSpacing, sectionAnchorId, sectionScopedCss } from '../../sectionSpacing';
import { PreviewInspectorProvider, type PreviewBlockSelection } from '../../previewInspector';
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
        const render = resolveLedupSection(rawSection.type);
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
          const reveal = ledupTheme.reveal && i > 0 && section.type !== 'hero';
          const Box = reveal ? RevealBox : 'div';
          return (
            <Box key={key} {...common} className={`${spacing.className} ${reveal ? 'ld-rv' : ''}`}>
              {scoped && <style>{scoped}</style>}
              {render(section, blocks, colors, dynamic, previewContext)}
            </Box>
          );
        }
        const on = selectedSectionId === key;
        return (
          <div
            key={key}
            {...common}
            data-fx-section-id={key}
            className={`${on ? 'ld-sel-on' : 'ld-sel'} ${spacing.className}`}
            onClickCapture={e => {
              const block = (e.target as HTMLElement).closest<HTMLElement>('[data-editor-block-id]');
              e.preventDefault();
              e.stopPropagation();
              if (block) onSelectBlock?.(key, block.dataset.editorBlockId ?? '');
              else onSelectSection?.(key);
            }}
          >
            {scoped && <style>{scoped}</style>}
            <PreviewInspectorProvider value={{ sectionId: key, selectedBlockId: on ? selectedBlockId : null, onSelectBlock }}>
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
