/** Pure helpers behind the automatic success / error toasts of the API client (see `api/client.ts`). */

/** The dashboards only: seller/staff workspace and admin (optionally under a country prefix such as /pk). */
export function isWorkspacePath(pathname: string): boolean {
  return /^\/(?:[a-z]{2}\/)?(?:store|admin|seller)(?:\/|$)/.test(pathname);
}

/** Writes that happen in the background or are part of a bigger flow with its own feedback: never toast their success. */
const QUIET_PATHS = /\/(analytics|storefront-analytics|track|tracking|sessions?|heartbeat|presence|typing|notifications?|mark-read|read-all|badges|store-badges|dashboard-layouts|upload\/chunk|package\/upload|autosave|events?|log|logs|search|seen|view|views)(\/|\?|$)/i;

export function isQuietPath(url: string | undefined): boolean {
  return !!url && QUIET_PATHS.test(url.split('?')[0]);
}

const WRITE_WORD: Record<string, string> = { post: 'Created', put: 'Saved', patch: 'Saved', delete: 'Deleted' };

/** "Saved" / "Created" / "Deleted", or the server's own short sentence when it sent one. */
export function successMessage(method: string | undefined, body: unknown): string {
  const m = (body as { message?: unknown } | null)?.message;
  if (typeof m === 'string') {
    const t = m.trim();
    if (t.length >= 4 && t.length <= 90 && !/^(ok|success|successful)\.?$/i.test(t) && !/\b[a-z0-9]+\.\d+\./i.test(t)) return t;
  }
  return WRITE_WORD[(method ?? 'post').toLowerCase()] ?? 'Done';
}

interface ErrorInput {
  status?: number;
  code?: string;
  message?: unknown;
  isNetworkError: boolean;
  online: boolean;
  method?: string;
}

/** Backend validation messages can be one string or a list; keep the first two readable lines. */
export function flattenMessage(message: unknown): string {
  if (Array.isArray(message)) return message.filter(x => typeof x === 'string').slice(0, 2).join('. ');
  return typeof message === 'string' ? message.trim() : '';
}

/** A friendly message per error type. `key` groups repeats so a failing screen does not spam. */
export function describeError(e: ErrorInput): { message: string; key: string } {
  const server = flattenMessage(e.message);
  const human = server && server.length <= 160 ? server : '';
  if (e.isNetworkError) {
    if (!e.online) return { message: "You're offline. Check your internet connection and try again.", key: 'offline' };
    if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT') return { message: 'The request took too long. Please try again.', key: 'timeout' };
    return { message: "Can't reach the server. Check your connection and try again.", key: 'network' };
  }
  const s = e.status ?? 0;
  if (s === 400 || s === 422) return { message: human || 'Some details are missing or invalid. Please check and try again.', key: `validation:${human}` };
  if (s === 401) return { message: 'Your session has expired. Please log in again.', key: 'auth' };
  if (s === 402) return { message: human || 'This needs an active plan or a successful payment.', key: `payment:${human}` };
  if (s === 403) return { message: human && !/forbidden/i.test(human) ? human : "You don't have permission to do this.", key: 'permission' };
  if (s === 404) return { message: human || 'We could not find that item. It may have been removed.', key: `notfound:${human}` };
  if (s === 409) return { message: human || 'This conflicts with something that already exists.', key: `conflict:${human}` };
  if (s === 413) return { message: 'That file is too large.', key: 'toolarge' };
  if (s === 415) return { message: 'That file type is not supported.', key: 'filetype' };
  if (s === 429) return { message: 'Too many requests. Please wait a minute and try again.', key: 'ratelimit' };
  if (s === 503) return { message: 'The service is busy right now. Please try again in a moment.', key: 'unavailable' };
  if (s >= 500) return { message: 'Something went wrong on our side. Please try again.', key: 'server' };
  return { message: human || 'Something went wrong. Please try again.', key: `other:${human}` };
}

/** Should this failure raise a toast on its own? Reads only for big, screen-wide problems; writes for everything. */
export function shouldToastError(e: { method?: string; status?: number; isNetworkError: boolean; authAttempt: boolean }): boolean {
  if (e.authAttempt) return false; // login / OTP forms show their own inline error
  const read = (e.method ?? 'get').toLowerCase() === 'get';
  if (!read) return true;
  return e.isNetworkError || (e.status ?? 0) >= 500 || e.status === 429;
}
