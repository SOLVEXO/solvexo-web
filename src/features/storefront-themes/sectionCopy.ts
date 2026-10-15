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
