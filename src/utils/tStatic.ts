import i18n from '@/i18n';

/**
 * Translation for code that is not a React component (pure helpers, copy defaults). Language switches reload
 * the page, so reading the active language at call time is enough - no re-render subscription needed.
 */
export function ts(key: string, defaultValue: string, vars?: Record<string, unknown>): string {
  return i18n.t(key, { ns: 'storefront', defaultValue, ...vars }) as string;
}

/** Translates an English theme-copy default (looked up literally under `copy.<text>`); unknown text is returned as is. */
export function tCopyDefault(text: string): string {
  return i18n.t(`copy.${text}`, { ns: 'storefront', defaultValue: text, keySeparator: false, nsSeparator: false }) as string;
}

/** Alias of ts() for modules that already have a local named ts. */
export const tt = ts;
