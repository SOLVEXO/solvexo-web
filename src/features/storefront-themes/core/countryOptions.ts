import { COUNTRY_OPTIONS, type CountryOption } from '@/utils/countries';
import { activeLocale } from './locale';

/** Country list for a storefront picker: `name` is the stored (English) value, `label` the name in the active language, sorted by it. */
export function localizedCountryOptions(): Array<CountryOption & { label: string }> {
  const lang = activeLocale();
  let names: Intl.DisplayNames | null = null;
  try { if (lang) names = new Intl.DisplayNames([lang], { type: 'region' }); } catch { names = null; }
  const list = COUNTRY_OPTIONS.map(c => {
    let label = c.name;
    try { label = names?.of(c.code) ?? c.name; } catch { /* keep English */ }
    return { ...c, label };
  });
  return lang ? list.sort((a, b) => a.label.localeCompare(b.label, lang)) : list;
}
