import type { Section } from '@/api/services/storefrontTypes';
import type { StoreThemeData } from '@/api/services/storeTheme';

/**
 * The cross-tab sync layer that makes Live Preview show the actual current
 * working copy instead of a stale server refetch — the exact gap the
 * Ground-Up Specification flagged (the old preview only ever showed the last
 * *saved* draft, never in-progress unsaved edits). `BroadcastChannel` is a
 * standard browser API, no dependency needed: the editor tab posts on every
 * working-copy change, the preview tab (opened via "Preview" in the
 * unpublished-changes banner) listens and overrides its initial
 * server-fetched draft with whatever arrives live.
 *
 * Deliberately NOT an embedded in-page preview panel — that was tried
 * before, found to add real complexity for a "live" preview that only ever
 * showed drafts anyway, and was removed in favor of "Preview opens the real
 * thing in its own tab" (see StoreBuilder.tsx's own history). This keeps
 * that same UX; it only fixes what that tab actually shows once open.
 */
export type ThemeWorkingCopy = StoreThemeData['draft'];

export type PreviewSyncMessage =
  | { type: 'theme'; theme: ThemeWorkingCopy }
  | { type: 'homeSections'; sections: Section[] };

export function previewChannelName(storeId: string): string {
  return `solvexo-store-builder-preview-${storeId}`;
}
