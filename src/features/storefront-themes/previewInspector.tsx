import { createContext, useContext, type ReactNode } from 'react';

export type PreviewBlockSelection = (sectionId: string, blockId: string) => void;

interface PreviewInspectorValue {
  sectionId: string;
  selectedBlockId?: string | null;
  onSelectBlock?: PreviewBlockSelection;
}

const PreviewInspectorContext = createContext<PreviewInspectorValue | null>(null);

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
  if (!inspector) return <>{children}</>;
  const selected = inspector.selectedBlockId === blockId;
  return (
    <div
      data-editor-block-id={blockId}
      className={selected ? 'theme-editor-block-selected' : 'theme-editor-block-target'}
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
