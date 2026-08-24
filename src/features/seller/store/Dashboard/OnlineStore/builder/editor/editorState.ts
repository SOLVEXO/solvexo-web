/**
 * The Store Builder's new editor-state core — pure, framework-agnostic
 * reducer logic (no React import here on purpose, so it's trivially unit
 * testable without a DOM/component-testing setup).
 *
 * Models exactly the architecture the Store Builder Ground-Up Specification
 * calls for: three separated concerns —
 *   - `published`    the server-truth cache (last known live value)
 *   - `workingCopy`  the single mutable draft every tab edits, and what
 *                     preview/save/publish all read from
 *   - `history`/`future`  the undo/redo command stack, layered on top of
 *                     `workingCopy` only — UI-only state (selection, panel
 *                     open/closed) never goes through this reducer at all,
 *                     by construction, since nothing here models it.
 *
 * `phase` is the save/publish lifecycle the spec calls for:
 *   clean -> dirty -> saving -> saved -> publishing -> published -> error
 * It's a distinct concern from `hasUnpublishedChanges` (below) — `phase`
 * answers "what just happened / is happening", the derived helper answers
 * "does the content actually differ from what's live" (what a persistent
 * "you have unpublished changes" banner should key off, independent of
 * whatever the last action's outcome was).
 */

export type EditorPhase = 'clean' | 'dirty' | 'saving' | 'saved' | 'publishing' | 'published' | 'error';

export interface EditorState<T> {
  published: T | null;
  workingCopy: T | null;
  history: T[];
  future: T[];
  phase: EditorPhase;
  errorMessage: string | null;
}

export type EditorAction<T> =
  /** Loads server state fresh — a page/tab switch, or the initial fetch. Always clears undo/redo history: those only ever apply within one continuous editing session on one loaded document. */
  | { type: 'LOAD'; published: T; workingCopy?: T }
  /** A real content edit. `updater` may be the next value directly, or a function of the previous working copy (for edits that need to read current state, e.g. toggling a nested flag). */
  | { type: 'EDIT'; updater: T | ((prev: T) => T) }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SAVE_START' }
  /** `workingCopy` is optional — pass it only if the server responded with a normalized/merged value that should replace the client's. */
  | { type: 'SAVE_SUCCESS'; workingCopy?: T }
  | { type: 'SAVE_ERROR'; message: string }
  | { type: 'PUBLISH_START' }
  /** Publishing always resolves working copy = published = this value (or the current working copy if the server didn't echo one back) and clears history — matches the documented Shopify convention: undo/redo never survives a publish. */
  | { type: 'PUBLISH_SUCCESS'; published?: T }
  | { type: 'PUBLISH_ERROR'; message: string }
  /** "Discard unsaved changes" — resets the working copy to a given value (typically the last-published one) without touching `published` itself. */
  | { type: 'DISCARD_DRAFT'; workingCopy: T };

/** Bounded, per the spec's "safe history boundaries" requirement — an editing session that makes more than this many edits simply loses its oldest undo steps, rather than growing the history array without limit. */
export const MAX_EDITOR_HISTORY = 50;

function phaseAfterHistoryNavigation<T>(workingCopy: T, published: T | null): EditorPhase {
  if (published !== null && JSON.stringify(workingCopy) === JSON.stringify(published)) return 'clean';
  return 'dirty';
}

export function editorReducer<T>(state: EditorState<T>, action: EditorAction<T>): EditorState<T> {
  switch (action.type) {
    case 'LOAD':
      return {
        published: action.published,
        workingCopy: action.workingCopy ?? action.published,
        history: [],
        future: [],
        phase: 'clean',
        errorMessage: null,
      };

    case 'EDIT': {
      if (state.workingCopy === null) return state;
      const next = typeof action.updater === 'function'
        ? (action.updater as (prev: T) => T)(state.workingCopy)
        : action.updater;
      const history = [...state.history, state.workingCopy].slice(-MAX_EDITOR_HISTORY);
      return { ...state, workingCopy: next, history, future: [], phase: 'dirty', errorMessage: null };
    }

    case 'UNDO': {
      if (state.history.length === 0 || state.workingCopy === null) return state;
      const previous = state.history[state.history.length - 1];
      const history = state.history.slice(0, -1);
      const future = [state.workingCopy, ...state.future];
      return {
        ...state,
        workingCopy: previous,
        history,
        future,
        phase: phaseAfterHistoryNavigation(previous, state.published),
        errorMessage: null,
      };
    }

    case 'REDO': {
      if (state.future.length === 0 || state.workingCopy === null) return state;
      const [next, ...restFuture] = state.future;
      const history = [...state.history, state.workingCopy];
      return {
        ...state,
        workingCopy: next,
        history,
        future: restFuture,
        phase: phaseAfterHistoryNavigation(next, state.published),
        errorMessage: null,
      };
    }

    case 'SAVE_START':
      return { ...state, phase: 'saving', errorMessage: null };

    case 'SAVE_SUCCESS':
      return {
        ...state,
        workingCopy: action.workingCopy ?? state.workingCopy,
        phase: 'saved',
        errorMessage: null,
      };

    case 'SAVE_ERROR':
      // Deliberately does NOT touch workingCopy — a failed save must never
      // discard what the seller typed; they keep editing/retrying from
      // exactly where they were.
      return { ...state, phase: 'error', errorMessage: action.message };

    case 'PUBLISH_START':
      return { ...state, phase: 'publishing', errorMessage: null };

    case 'PUBLISH_SUCCESS': {
      const published = action.published ?? state.workingCopy;
      return {
        ...state,
        published,
        workingCopy: published,
        history: [],
        future: [],
        phase: 'published',
        errorMessage: null,
      };
    }

    case 'PUBLISH_ERROR':
      return { ...state, phase: 'error', errorMessage: action.message };

    case 'DISCARD_DRAFT':
      return {
        ...state,
        workingCopy: action.workingCopy,
        history: [],
        future: [],
        phase: 'clean',
        errorMessage: null,
      };

    default:
      return state;
  }
}

export function initialEditorState<T>(): EditorState<T> {
  return { published: null, workingCopy: null, history: [], future: [], phase: 'clean', errorMessage: null };
}

/**
 * The one thing every "you have unpublished changes" banner in the app
 * should key off — deliberately a pure function of `published`/`workingCopy`
 * rather than a stored flag, so it can never drift out of sync with the data
 * it describes. Mirrors the exact `JSON.stringify(...) !== JSON.stringify(...)`
 * comparison `StoreBuilder.tsx` already does today for Theme/Pages, just
 * centralized so every future tab gets it for free instead of re-deriving it.
 */
export function hasUnpublishedChanges<T>(state: Pick<EditorState<T>, 'published' | 'workingCopy'>): boolean {
  if (state.published === null || state.workingCopy === null) return false;
  return JSON.stringify(state.workingCopy) !== JSON.stringify(state.published);
}
