/* eslint-disable react-refresh/only-export-components -- the hook lives with its context provider */
import { createContext, useContext, type CSSProperties, type ElementType, type ReactNode } from 'react';

/** Customize preview only: lets the merchant click a headline in the preview and type, instead of using the side form. */
export type InlineEditHandler = (sectionId: string, blockId: string | null, key: string, value: string) => void;

const InlineEditContext = createContext<{ sectionId: string; onEdit: InlineEditHandler } | null>(null);

export function InlineEditProvider({ sectionId, onEdit, children }: { sectionId: string; onEdit: InlineEditHandler; children: ReactNode }) {
  return <InlineEditContext.Provider value={{ sectionId, onEdit }}>{children}</InlineEditContext.Provider>;
}

/** True only inside the Customize preview. */
export function useInlineEditActive() {
  return useContext(InlineEditContext) !== null;
}

/**
 * A text value that becomes click-to-type in the Customize preview. On the live store (no provider) it renders the bare text,
 * so nothing about the storefront's markup changes. Enter or clicking away saves, Escape cancels, empty text is ignored.
 */
export function EditableText({ value, settingKey, blockId = null, as, className, style }: {
  value: string; settingKey: string; blockId?: string | null; as?: ElementType; className?: string; style?: CSSProperties;
}) {
  const ctx = useContext(InlineEditContext);
  if (!ctx) return <>{value}</>;
  const Tag = as ?? 'span';
  return (
    <Tag
      contentEditable suppressContentEditableWarning role="textbox" aria-label={settingKey} spellCheck data-inline-edit className={className} style={style}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const next = (e.currentTarget.textContent ?? '').replace(/\s+/g, ' ').trim();
        if (!next) { e.currentTarget.textContent = value; return; }
        if (next !== value) ctx.onEdit(ctx.sectionId, blockId, settingKey, next);
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
        else if (e.key === 'Escape') { e.currentTarget.textContent = value; e.currentTarget.blur(); }
      }}
      onPaste={(e: React.ClipboardEvent<HTMLElement>) => {
        e.preventDefault();
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain').replace(/\s+/g, ' '));
      }}
    >{value}</Tag>
  );
}
