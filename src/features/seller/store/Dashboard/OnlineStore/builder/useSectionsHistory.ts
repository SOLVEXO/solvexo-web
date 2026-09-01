import { useCallback, useState } from 'react';
import type { Section } from '@/api/services/storefrontTypes';

const MAX_HISTORY = 50;

/**
 * Bounded undo/redo for the Pages/Sections editor only (scope confirmed —
 * Theme/Header/Footer/Store Info keep their existing Save + Discard Draft
 * safety net instead). Exposes the exact same `sections`/`setSections`
 * shape `StoreBuilder` already used as a plain `useState`, so every
 * existing `onChange`/`onPersist` call site in `PageSectionsEditor.tsx`
 * needs zero changes — only `StoreBuilder` itself swaps its `useState` for
 * this hook and gains `undo`/`redo`/`canUndo`/`canRedo` plus `resetSections`
 * (used only on page load/switch, so a page's history never bleeds into
 * another's and the initial load is never itself an undoable step).
 */
export function useSectionsHistory() {
  const [present, setPresent] = useState<Section[]>([]);
  const [past, setPast] = useState<Section[][]>([]);
  const [future, setFuture] = useState<Section[][]>([]);

  const setSections = useCallback((next: Section[]) => {
    setPast(p => [...p.slice(-(MAX_HISTORY - 1)), present]);
    setFuture([]);
    setPresent(next);
  }, [present]);

  /** Silent set — no history entry. Used only when loading a page or switching between pages. */
  const resetSections = useCallback((initial: Section[]) => {
    setPast([]);
    setFuture([]);
    setPresent(initial);
  }, []);

  const undo = useCallback(() => {
    setPast(p => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];
      setFuture(f => [present, ...f]);
      setPresent(prev);
      return p.slice(0, -1);
    });
  }, [present]);

  const redo = useCallback(() => {
    setFuture(f => {
      if (f.length === 0) return f;
      const [next, ...rest] = f;
      setPast(p => [...p, present]);
      setPresent(next);
      return rest;
    });
  }, [present]);

  return {
    sections: present,
    setSections,
    resetSections,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
