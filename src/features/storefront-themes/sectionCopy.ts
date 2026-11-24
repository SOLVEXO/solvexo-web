import { tCopyDefault } from '@/utils/tStatic';

/** Theme copy a seller can override per section/block (Shopify themes expose
 *  every visible string as a setting). Unset/blank = the theme's own text (translated for the active language). */
export function copyText(settings: Record<string, unknown> | undefined, key: string, fallback: string): string {
  const v = settings?.[key];
  return typeof v === 'string' && v.trim() ? v : tCopyDefault(fallback);
}

/** The small label above a heading ("eyebrow"); `showEyebrow: false` hides it. */
export function showEyebrow(settings: Record<string, unknown> | undefined): boolean {
  return settings?.showEyebrow !== false;
}

/** The small label above a heading: ONLY what the seller typed (and not switched off). Themes add no words of their own,
 *  so a section never shows text the seller never wrote. */
export function eyebrowText(settings: Record<string, unknown> | undefined): string | undefined {
  if (settings?.showEyebrow === false) return undefined;
  const v = settings?.eyebrow;
  return typeof v === 'string' && v.trim() ? v : undefined;
}
