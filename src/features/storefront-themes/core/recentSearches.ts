// Recent searches, kept in this browser only (per store). Newest first, no duplicates, capped.
const MAX_RECENT = 5;
const keyFor = (storeId: string) => `sx:recent-searches:${storeId}`;

export function readRecentSearches(storeId: string): string[] {
  try {
    const raw = window.localStorage.getItem(keyFor(storeId));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string').slice(0, MAX_RECENT) : [];
  } catch { return []; }
}

function write(storeId: string, list: string[]): string[] {
  try {
    if (list.length) window.localStorage.setItem(keyFor(storeId), JSON.stringify(list));
    else window.localStorage.removeItem(keyFor(storeId));
  } catch { /* storage blocked: the list just lives for this page view */ }
  return list;
}

export function addRecentSearch(storeId: string, term: string): string[] {
  const clean = term.trim().slice(0, 100);
  if (!clean) return readRecentSearches(storeId);
  const rest = readRecentSearches(storeId).filter(x => x.toLowerCase() !== clean.toLowerCase());
  return write(storeId, [clean, ...rest].slice(0, MAX_RECENT));
}

export function removeRecentSearch(storeId: string, term: string): string[] {
  return write(storeId, readRecentSearches(storeId).filter(x => x !== term));
}

export function clearRecentSearches(storeId: string): string[] {
  return write(storeId, []);
}
