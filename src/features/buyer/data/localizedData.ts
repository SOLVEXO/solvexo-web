import type { SiteLang } from '@/i18n/site/siteLanguage';
import type { PlatformProduct } from './platformProducts';
import type { Solution } from './solutions';
import { PLATFORM_PRODUCTS_AR } from './platformProducts.ar';
import { SOLUTIONS_AR } from './solutions.ar';

/**
 * The English product/solution data stays the source of truth (the SEO build reads it directly);
 * the Arabic site overlays its text by slug. A product without an Arabic entry shows in English.
 */
export function localizeProduct(p: PlatformProduct, lang: SiteLang): PlatformProduct {
  if (lang !== 'ar') return p;
  const ar = PLATFORM_PRODUCTS_AR[p.slug];
  return ar ? { ...p, ...ar } : p;
}

export function localizeSolution(s: Solution, lang: SiteLang): Solution {
  if (lang !== 'ar') return s;
  const ar = SOLUTIONS_AR[s.slug];
  return ar ? { ...s, ...ar } : s;
}
