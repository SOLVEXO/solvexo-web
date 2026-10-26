const EU = new Set(['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE']);

/** What a seller's tax registration number is called in their country. Only a label; the number itself is free text. */
export function taxIdLabelForCountry(country: string | null | undefined): string {
  const cc = String(country ?? '').trim().toUpperCase();
  if (cc === 'PK') return 'NTN / STRN';
  if (cc === 'AE' || cc === 'SA') return 'TRN (tax registration number)';
  if (cc === 'GB' || EU.has(cc)) return 'VAT number';
  if (cc === 'IN') return 'GSTIN';
  if (cc === 'AU') return 'ABN';
  if (cc === 'CA') return 'GST/HST number';
  if (cc === 'US') return 'EIN / sales tax ID';
  return 'Tax number';
}
