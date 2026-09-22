import { getCountries } from 'react-phone-number-input';

// A single, real, canonical country list shared by every "pick a country"
// field in the app (buyer checkout address, seller shipping-zone country) —
// built once from `react-phone-number-input`'s own real ISO-3166 country
// code list (already a dependency, no new package) + the browser's built-in
// `Intl.DisplayNames` for the English name. Sharing one list is what makes a
// buyer's address country and a seller's shipping-zone country comparable at
// all — before this, the zone country was free-typed text and the address
// had no country field, so the two could never reliably match (a real,
// confirmed bug: shipping zones were never actually filtered by country).
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

export interface CountryOption {
  code: string; // ISO-3166 alpha-2, e.g. 'PK'
  name: string; // English display name, e.g. 'Pakistan'
}

export const COUNTRY_OPTIONS: CountryOption[] = getCountries()
  .map(code => {
    let name: string = code;
    try { name = regionNames.of(code) ?? code; } catch { /* unrecognized code, fall back to the raw code */ }
    return { code, name };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

/** Case/whitespace-insensitive compare — matches a dropdown-picked name
 *  against another dropdown-picked name, AND (for backward compatibility)
 *  against an older free-typed zone country string that happens to already
 *  be the correct English name (the common case), without requiring a data
 *  migration for existing sellers' zones. */
export function isSameCountry(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
