/* eslint-disable react-refresh/only-export-components -- context hook lives with its provider */
import { createContext, useContext, type ReactNode } from 'react';
import { blockStyle } from './blockStyle';

export type PreviewBlockSelection = (sectionId: string, blockId: string) => void;

interface PreviewInspectorValue {
  sectionId: string;
  selectedBlockId?: string | null;
  onSelectBlock?: PreviewBlockSelection;
  /** blockId -> the block's `settings.style` (no-code block Style panel). */
  blockStyles?: Record<string, unknown>;
}

const PreviewInspectorContext = createContext<PreviewInspectorValue | null>(null);
/** Live storefront: only the blocks' `settings.style` (no editor click targets). */
const BlockStyleContext = createContext<Record<string, unknown> | null>(null);

export function BlockStyleProvider({ blocks, children }: { blocks: { _id?: unknown; settings?: unknown }[]; children: ReactNode }) {
  const map: Record<string, unknown> = {};
  for (const b of blocks) { const st = (b.settings as Record<string, unknown> | undefined)?.style; if (st) map[String(b._id)] = st; }
  return <BlockStyleContext.Provider value={Object.keys(map).length ? map : null}>{children}</BlockStyleContext.Provider>;
}

export function PreviewInspectorProvider({ value, children }: { value: PreviewInspectorValue; children: ReactNode }) {
  return <PreviewInspectorContext.Provider value={value}>{children}</PreviewInspectorContext.Provider>;
}

/** The editor-preview inspector, or null on the live storefront. */
export function usePreviewInspector() {
  return useContext(PreviewInspectorContext);
}

/** Adds an inspector hit target only in the editor preview. Storefront output
 * remains unchanged because the section renderer doesn't provide this context. */
export function PreviewBlock({ blockId, children }: { blockId: string; children: ReactNode }) {
  const inspector = useContext(PreviewInspectorContext);
  const liveStyles = useContext(BlockStyleContext);
  if (!inspector) {
    const live = blockStyle(liveStyles?.[blockId]);
    return live ? <div className={live.className} style={live.style}>{children}</div> : <>{children}</>;
  }
  const bs = blockStyle(inspector.blockStyles?.[blockId]);
  const selected = inspector.selectedBlockId === blockId;
  return (
    <div
      data-editor-block-id={blockId}
      className={`${selected ? 'theme-editor-block-selected' : 'theme-editor-block-target'} ${bs?.className ?? ''}`}
      style={bs?.style}
      onClickCapture={event => {
        event.preventDefault();
        event.stopPropagation();
        inspector.onSelectBlock?.(inspector.sectionId, blockId);
      }}
    >
      {children}
    </div>
  );
}
