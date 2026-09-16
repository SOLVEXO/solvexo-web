const KEY = 'anonVisitorId';

/**
 * Phase 5 — Product Tracking Foundation.
 *
 * A stable, client-generated id for an anonymous (not-logged-in) visitor, so
 * the product-view beacon can dedup repeat views from the same browser
 * without requiring login. Persisted in localStorage rather than a Date.now()
 * one-off, so it survives a page refresh — otherwise every reload would look
 * like a brand-new visitor and inflate view counts with fabricated "distinct"
 * views. Never sent anywhere except the view beacon itself, and never merged
 * with a real userId — a logged-in buyer is identified by their own userId,
 * not this id (see ProductViewsService.recordView on the backend).
 */
export function getAnonymousVisitorId(): string | null {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null; // localStorage unavailable — view simply won't be recorded for this visitor
  }
}
