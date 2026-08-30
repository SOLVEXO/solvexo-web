import { describe, it, expect } from 'vitest';
import { editorReducer, initialEditorState, hasUnpublishedChanges, MAX_EDITOR_HISTORY, type EditorState } from './editorState';

interface Doc { title: string; count: number }

function loaded(published: Doc, workingCopy?: Doc): EditorState<Doc> {
  return editorReducer(initialEditorState<Doc>(), { type: 'LOAD', published, workingCopy });
}

describe('editorReducer', () => {
  describe('LOAD', () => {
    it('sets published and working copy to the same value when no separate draft is given, and clears history', () => {
      const state = loaded({ title: 'Home', count: 1 });
      expect(state.published).toEqual({ title: 'Home', count: 1 });
      expect(state.workingCopy).toEqual({ title: 'Home', count: 1 });
      expect(state.history).toEqual([]);
      expect(state.future).toEqual([]);
      expect(state.phase).toBe('clean');
    });

    it('lets the working copy start already different from published — a pre-existing unpublished draft', () => {
      const state = loaded({ title: 'Home', count: 1 }, { title: 'Home Draft', count: 1 });
      expect(hasUnpublishedChanges(state)).toBe(true);
    });

    it('a second LOAD racing in after an in-progress edit must NOT clobber the unsaved working copy — the original data-loss bug', () => {
      // Reproduces: mount fires an initial fetch, the merchant edits before it
      // resolves (or a duplicate/slow fetch resolves late — e.g. React 18
      // StrictMode's double-invoke, or a second real network round trip) —
      // that late LOAD must never silently overwrite what's on screen.
      let state = loaded({ title: 'Home', count: 1 });
      state = editorReducer(state, { type: 'EDIT', updater: { title: 'Home (typed by merchant)', count: 1 } });
      expect(state.dirty).toBe(true);

      const lateLoad = editorReducer(state, { type: 'LOAD', published: { title: 'Home', count: 1 } });
      expect(lateLoad.workingCopy).toEqual({ title: 'Home (typed by merchant)', count: 1 });
      expect(lateLoad.dirty).toBe(true);
      // The late fetch's server value is still worth capturing as the new
      // "published" baseline (e.g. for a concurrent-editor conflict banner
      // later) — it just must never become the working copy.
      expect(lateLoad.published).toEqual({ title: 'Home', count: 1 });
    });

    it('a LOAD while clean (no in-progress edit) behaves exactly as a fresh load — re-syncs the working copy normally', () => {
      let state = loaded({ title: 'Home', count: 1 });
      expect(state.dirty).toBe(false);

      const state2 = editorReducer(state, { type: 'LOAD', published: { title: 'Home v2', count: 2 } });
      expect(state2.workingCopy).toEqual({ title: 'Home v2', count: 2 });
      expect(state2.published).toEqual({ title: 'Home v2', count: 2 });
      expect(state2.dirty).toBe(false);
    });

    it('dirty clears on SAVE_SUCCESS and PUBLISH_SUCCESS, so a LOAD after a real save/publish resyncs normally again', () => {
      let state = loaded({ title: 'Home', count: 1 });
      state = editorReducer(state, { type: 'EDIT', updater: { title: 'Edited', count: 1 } });
      expect(state.dirty).toBe(true);

      state = editorReducer(state, { type: 'SAVE_SUCCESS' });
      expect(state.dirty).toBe(false);

      const afterLoad = editorReducer(state, { type: 'LOAD', published: { title: 'Edited', count: 1 } });
      expect(afterLoad.workingCopy).toEqual({ title: 'Edited', count: 1 });
    });
  });

  describe('EDIT', () => {
    it('updates the working copy, marks the phase dirty, and pushes the previous value onto history', () => {
      let state = loaded({ title: 'Home', count: 1 });
      state = editorReducer(state, { type: 'EDIT', updater: { title: 'Home 2', count: 1 } });
      expect(state.workingCopy).toEqual({ title: 'Home 2', count: 1 });
      expect(state.phase).toBe('dirty');
      expect(state.history).toEqual([{ title: 'Home', count: 1 }]);
    });

    it('accepts a function updater that reads the current working copy', () => {
      let state = loaded({ title: 'Home', count: 1 });
      state = editorReducer(state, { type: 'EDIT', updater: (prev) => ({ ...prev, count: prev.count + 1 }) });
      expect(state.workingCopy).toEqual({ title: 'Home', count: 2 });
    });

    it('clears the redo (future) stack — a new edit after an undo abandons the undone branch', () => {
      let state = loaded({ title: 'A', count: 0 });
      state = editorReducer(state, { type: 'EDIT', updater: { title: 'B', count: 0 } });
      state = editorReducer(state, { type: 'UNDO' });
      expect(state.future.length).toBe(1);
      state = editorReducer(state, { type: 'EDIT', updater: { title: 'C', count: 0 } });
      expect(state.future).toEqual([]);
    });

    it('is a no-op if nothing has been loaded yet (working copy is null)', () => {
      const state = editorReducer(initialEditorState<Doc>(), { type: 'EDIT', updater: { title: 'X', count: 0 } });
      expect(state.workingCopy).toBeNull();
    });

    it('caps history at MAX_EDITOR_HISTORY, dropping the oldest entries first', () => {
      let state = loaded({ title: 'v0', count: 0 });
      for (let i = 1; i <= MAX_EDITOR_HISTORY + 10; i++) {
        state = editorReducer(state, { type: 'EDIT', updater: { title: `v${i}`, count: i } });
      }
      expect(state.history.length).toBe(MAX_EDITOR_HISTORY);
      // The oldest surviving entry should be v10 (v0..v9 pushed out), since
      // the working copy itself is the newest edit (vMAX+10), not in history.
      expect(state.history[0]).toEqual({ title: 'v10', count: 10 });
    });
  });

  describe('UNDO / REDO — must actually restore the previous working state', () => {
    it('undo restores the exact previous value and moves it to the redo stack', () => {
      let state = loaded({ title: 'A', count: 0 });
      state = editorReducer(state, { type: 'EDIT', updater: { title: 'B', count: 1 } });
      state = editorReducer(state, { type: 'EDIT', updater: { title: 'C', count: 2 } });

      state = editorReducer(state, { type: 'UNDO' });
      expect(state.workingCopy).toEqual({ title: 'B', count: 1 });

      state = editorReducer(state, { type: 'UNDO' });
      expect(state.workingCopy).toEqual({ title: 'A', count: 0 });
      expect(state.phase).toBe('clean'); // back to matching published exactly
    });

    it('redo re-applies an undone edit exactly', () => {
      let state = loaded({ title: 'A', count: 0 });
      state = editorReducer(state, { type: 'EDIT', updater: { title: 'B', count: 1 } });
      state = editorReducer(state, { type: 'UNDO' });
      expect(state.workingCopy).toEqual({ title: 'A', count: 0 });

      state = editorReducer(state, { type: 'REDO' });
      expect(state.workingCopy).toEqual({ title: 'B', count: 1 });
      expect(state.phase).toBe('dirty');
    });

    it('undo is a no-op with empty history', () => {
      const state = loaded({ title: 'A', count: 0 });
      const after = editorReducer(state, { type: 'UNDO' });
      expect(after).toEqual(state);
    });

    it('redo is a no-op with empty future', () => {
      const state = loaded({ title: 'A', count: 0 });
      const after = editorReducer(state, { type: 'REDO' });
      expect(after).toEqual(state);
    });

    it('a full undo/redo/undo/redo round trip is lossless', () => {
      let state = loaded({ title: 'A', count: 0 });
      state = editorReducer(state, { type: 'EDIT', updater: { title: 'B', count: 1 } });
      const afterEdit = state;

      state = editorReducer(state, { type: 'UNDO' });
      state = editorReducer(state, { type: 'REDO' });
      expect(state.workingCopy).toEqual(afterEdit.workingCopy);

      state = editorReducer(state, { type: 'UNDO' });
      state = editorReducer(state, { type: 'REDO' });
      expect(state.workingCopy).toEqual(afterEdit.workingCopy);
    });
  });

  describe('Save lifecycle', () => {
    it('SAVE_START -> saving, SAVE_SUCCESS -> saved, never discards the working copy', () => {
      let state = loaded({ title: 'A', count: 0 });
      state = editorReducer(state, { type: 'EDIT', updater: { title: 'B', count: 0 } });
      state = editorReducer(state, { type: 'SAVE_START' });
      expect(state.phase).toBe('saving');
      state = editorReducer(state, { type: 'SAVE_SUCCESS' });
      expect(state.phase).toBe('saved');
      expect(state.workingCopy).toEqual({ title: 'B', count: 0 });
      // Saving to draft never touches `published` — that's publish's job.
      expect(state.published).toEqual({ title: 'A', count: 0 });
    });

    it('SAVE_ERROR keeps the dirty working copy intact — a failed save must never lose the edit', () => {
      let state = loaded({ title: 'A', count: 0 });
      state = editorReducer(state, { type: 'EDIT', updater: { title: 'B', count: 0 } });
      state = editorReducer(state, { type: 'SAVE_START' });
      state = editorReducer(state, { type: 'SAVE_ERROR', message: 'Network error' });
      expect(state.phase).toBe('error');
      expect(state.errorMessage).toBe('Network error');
      expect(state.workingCopy).toEqual({ title: 'B', count: 0 });
    });

    it('a later successful save clears a previous error', () => {
      let state = loaded({ title: 'A', count: 0 });
      state = editorReducer(state, { type: 'SAVE_ERROR', message: 'oops' });
      state = editorReducer(state, { type: 'SAVE_START' });
      expect(state.errorMessage).toBeNull();
      state = editorReducer(state, { type: 'SAVE_SUCCESS' });
      expect(state.errorMessage).toBeNull();
    });
  });

  describe('Publish lifecycle', () => {
    it('PUBLISH_SUCCESS sets published = workingCopy and clears undo/redo history — matches the documented "undo never survives a publish" rule', () => {
      let state = loaded({ title: 'A', count: 0 });
      state = editorReducer(state, { type: 'EDIT', updater: { title: 'B', count: 0 } });
      state = editorReducer(state, { type: 'EDIT', updater: { title: 'C', count: 0 } });
      expect(state.history.length).toBe(2);

      state = editorReducer(state, { type: 'PUBLISH_START' });
      expect(state.phase).toBe('publishing');

      state = editorReducer(state, { type: 'PUBLISH_SUCCESS' });
      expect(state.published).toEqual({ title: 'C', count: 0 });
      expect(state.workingCopy).toEqual({ title: 'C', count: 0 });
      expect(state.phase).toBe('published');
      expect(state.history).toEqual([]);
      expect(state.future).toEqual([]);
      expect(hasUnpublishedChanges(state)).toBe(false);
    });

    it('PUBLISH_SUCCESS can take a server-echoed published value distinct from the client working copy', () => {
      let state = loaded({ title: 'A', count: 0 });
      state = editorReducer(state, { type: 'EDIT', updater: { title: 'B', count: 0 } });
      state = editorReducer(state, { type: 'PUBLISH_SUCCESS', published: { title: 'B (normalized)', count: 0 } });
      expect(state.published).toEqual({ title: 'B (normalized)', count: 0 });
      expect(state.workingCopy).toEqual({ title: 'B (normalized)', count: 0 });
    });

    it('PUBLISH_ERROR leaves published and workingCopy untouched — no accidental partial publish', () => {
      let state = loaded({ title: 'A', count: 0 });
      state = editorReducer(state, { type: 'EDIT', updater: { title: 'B', count: 0 } });
      const beforePublish = state;
      state = editorReducer(state, { type: 'PUBLISH_START' });
      state = editorReducer(state, { type: 'PUBLISH_ERROR', message: 'Server rejected' });
      expect(state.published).toEqual(beforePublish.published);
      expect(state.workingCopy).toEqual(beforePublish.workingCopy);
      expect(state.phase).toBe('error');
    });
  });

  describe('DISCARD_DRAFT', () => {
    it('resets the working copy without touching published, and clears history', () => {
      let state = loaded({ title: 'A', count: 0 });
      state = editorReducer(state, { type: 'EDIT', updater: { title: 'B', count: 0 } });
      state = editorReducer(state, { type: 'DISCARD_DRAFT', workingCopy: { title: 'A', count: 0 } });
      expect(state.workingCopy).toEqual({ title: 'A', count: 0 });
      expect(state.published).toEqual({ title: 'A', count: 0 });
      expect(state.phase).toBe('clean');
      expect(state.history).toEqual([]);
      expect(hasUnpublishedChanges(state)).toBe(false);
    });
  });
});

describe('hasUnpublishedChanges', () => {
  it('is false before anything has loaded', () => {
    expect(hasUnpublishedChanges(initialEditorState<Doc>())).toBe(false);
  });

  it('is false when working copy structurally equals published, even as a different object reference', () => {
    const state = loaded({ title: 'A', count: 0 }, { title: 'A', count: 0 });
    expect(hasUnpublishedChanges(state)).toBe(false);
  });

  it('is true whenever the working copy differs from published, regardless of how it got there', () => {
    const state = loaded({ title: 'A', count: 0 }, { title: 'A', count: 1 });
    expect(hasUnpublishedChanges(state)).toBe(true);
  });
});
