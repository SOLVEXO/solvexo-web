import { useEffect } from 'react';

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * True while focus is inside a native form control or a contentEditable
 * region. Ctrl/Cmd+Z inside one of these is deliberately left to the
 * browser's own native per-field undo instead of also triggering the
 * editor's structural undo — firing both at once (revert the field's text,
 * *and* jump the whole working copy back a step) would be a confusing
 * double-undo. The editor's own Ctrl+Z takes over once the field is blurred.
 * This is a real, disclosed scope boundary, not an oversight: reconciling
 * per-field text undo with the editor's structural undo into one unified
 * history is a materially harder problem (Shopify's own theme editor keeps
 * them separate for the same reason) and isn't required by anything this
 * pass needs to ship.
 */
function isTypingInEditableField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (EDITABLE_TAGS.has(target.tagName)) return true;
  return target.isContentEditable;
}

/**
 * Wires Ctrl/Cmd+Z (undo) and Ctrl/Cmd+Shift+Z (redo) — matching the Ground-Up
 * Specification's requirement for real keyboard shortcuts alongside the
 * toolbar buttons. `enabled` lets a screen only listen while it's actually
 * the active editor surface (e.g. only while the Theme tab, not the Pages
 * tab, is selected) rather than every mounted `useEditorState` instance
 * fighting over the same keystroke.
 */
export function useUndoRedoShortcuts(undo: () => void, redo: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isUndoRedoChord = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z';
      if (!isUndoRedoChord) return;
      if (isTypingInEditableField(e.target)) return;

      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, enabled]);
}
