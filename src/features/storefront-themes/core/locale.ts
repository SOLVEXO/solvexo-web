import i18n from '@/i18n';

/** The storefront's active language tag (what the buyer picked), never the browser's own locale. */
export function activeLocale(): string | undefined {
  const lang = i18n.language;
  if (!lang) return undefined;
  try { return Intl.DateTimeFormat.supportedLocalesOf([lang]).length ? lang : undefined; } catch { return undefined; }
}
