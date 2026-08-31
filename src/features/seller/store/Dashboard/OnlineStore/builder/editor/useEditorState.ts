import { useCallback, useMemo, useReducer } from 'react';
import {
  editorReducer,
  initialEditorState,
  hasUnpublishedChanges as computeHasUnpublishedChanges,
  type EditorState,
} from './editorState';

/**
 * The React-facing half of the new editor engine — a thin `useReducer`
 * wrapper exposing one stable-identity action per verb (so a component can
 * pass e.g. `edit` into a `useCallback` dependency array without it changing
 * every render) plus the two values every tab's UI actually needs to render
 * (`canUndo`/`canRedo`, `hasUnpublishedChanges`).
 *
 * Deliberately generic over `T` — one instance of this hook per editable
 * surface (Theme, a StorePage's sections, Header, Footer, ...), not a single
 * global store. Each surface keeps its own independent undo/redo history and
 * save/publish lifecycle, matching how they're actually saved/published
 * independently today.
 */
export function useEditorState<T>() {
  const [state, dispatch] = useReducer(editorReducer<T>, undefined, initialEditorState<T>);

  const load = useCallback((published: T, workingCopy?: T) => dispatch({ type: 'LOAD', published, workingCopy }), []);
  const edit = useCallback((updater: T | ((prev: T) => T)) => dispatch({ type: 'EDIT', updater }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const markSaving = useCallback(() => dispatch({ type: 'SAVE_START' }), []);
  const markSaved = useCallback((workingCopy?: T) => dispatch({ type: 'SAVE_SUCCESS', workingCopy }), []);
  const markSaveError = useCallback((message: string) => dispatch({ type: 'SAVE_ERROR', message }), []);
  const markPublishing = useCallback(() => dispatch({ type: 'PUBLISH_START' }), []);
  const markPublished = useCallback((published?: T) => dispatch({ type: 'PUBLISH_SUCCESS', published }), []);
  const markPublishError = useCallback((message: string) => dispatch({ type: 'PUBLISH_ERROR', message }), []);
  const discardDraft = useCallback((workingCopy: T) => dispatch({ type: 'DISCARD_DRAFT', workingCopy }), []);

  const derived = useMemo(
    () => ({
      canUndo: state.history.length > 0,
      canRedo: state.future.length > 0,
      hasUnpublishedChanges: computeHasUnpublishedChanges(state),
    }),
    [state],
  );

  return {
    ...state,
    ...derived,
    load,
    edit,
    undo,
    redo,
    markSaving,
    markSaved,
    markSaveError,
    markPublishing,
    markPublished,
    markPublishError,
    discardDraft,
  };
}

export type UseEditorStateReturn<T> = ReturnType<typeof useEditorState<T>>;
export type { EditorState };
