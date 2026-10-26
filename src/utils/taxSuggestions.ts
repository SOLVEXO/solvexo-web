/** Standard national consumption-tax rates offered as a STARTING POINT only (from memory, not live data). Rates change and
 *  many have reduced rates, state/provincial parts or registration thresholds, so every use must be confirmed with an
 *  accountant: admin adds them as DRAFT, a seller adds them as an editable tax region. */
export interface TaxSuggestion { rate: number; label: string }

export const TAX_SUGGESTIONS: Record<string, TaxSuggestion> = {
  PK: { rate: 18, label: 'Sales Tax' },
  AE: { rate: 5, label: 'VAT' },
  SA: { rate: 15, label: 'VAT' },
  GB: { rate: 20, label: 'VAT' },
  DE: { rate: 19, label: 'VAT' },
  FR: { rate: 20, label: 'VAT' },
  IT: { rate: 22, label: 'VAT' },
  ES: { rate: 21, label: 'VAT' },
  NL: { rate: 21, label: 'VAT' },
  IE: { rate: 23, label: 'VAT' },
  IN: { rate: 18, label: 'GST' },
  AU: { rate: 10, label: 'GST' },
  CA: { rate: 5, label: 'GST' },
  NZ: { rate: 15, label: 'GST' },
  SG: { rate: 9, label: 'GST' },
  ZA: { rate: 15, label: 'VAT' },
  TR: { rate: 20, label: 'VAT' },
};

export function taxSuggestionFor(country: string | null | undefined): TaxSuggestion | null {
  return TAX_SUGGESTIONS[String(country ?? '').trim().toUpperCase()] ?? null;
}
