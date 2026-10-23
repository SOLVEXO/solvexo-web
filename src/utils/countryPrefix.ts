/**
 * Country in the URL of the platform site (apex): `/pk/pricing`, `/ae/register`.
 * The router gets it as its basename (see `router/index.tsx`), so every route stays prefix-free and
 * in-app links keep the prefix by themselves. Not used on store hosts (they have their own language prefix).
 * The visitor's chosen country is also kept in a host-only cookie that the Vercel middleware honours.
 */
import { COUNTRY_OPTIONS } from '@/utils/countries';

export const COUNTRY_COOKIE = 'sx_country';

const CODES = new Set(COUNTRY_OPTIONS.map(c => c.code.toLowerCase()));

/** `/pk/pricing` -> `pk` (lower case). Only real ISO country codes count. */
export function countryFromPathname(pathname: string): string | null {
  const seg = pathname.split('/')[1]?.toLowerCase();
  return seg && seg.length === 2 && CODES.has(seg) ? seg : null;
}

/** Router basename for a pathname: `/pk` or `/`. */
export function countryBasename(pathname: string): string {
  const c = countryFromPathname(pathname);
  return c ? `/${c}` : '/';
}

/** Same page in another country: strips any current prefix and adds the new one. */
export function switchCountryPath(pathname: string, search: string, hash: string, target: string): string {
  const current = countryFromPathname(pathname);
  let rest = current ? pathname.slice(current.length + 1) : pathname;
  if (!rest.startsWith('/')) rest = `/${rest}`;
  const prefix = `/${target.toLowerCase()}`;
  return `${rest === '/' ? `${prefix}/` : prefix + rest}${search}${hash}`;
}

/** Remembers the country the visitor is browsing in (cookie read by the edge middleware). */
export function rememberCountry(code: string | null): void {
  if (!code) return;
  try {
    document.cookie = `${COUNTRY_COOKIE}=${code.toLowerCase()}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // cookies blocked — the visitor just gets the IP-based country next time
  }
}
