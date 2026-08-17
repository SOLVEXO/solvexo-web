/** Validates a `?redirect=` query value before ever passing it to `navigate()`.
 *  Only a same-origin relative path is allowed — rejects protocol-relative
 *  URLs (`//evil.com`), absolute URLs, and anything that isn't a plain path,
 *  so this can never be used as an open-redirect vector. Also rejects a
 *  redirect back into a login page itself (would loop). */
export function safeRedirectPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  if (value.startsWith('/login') || value.startsWith('/admin/login')) return null;
  return value;
}
