/** Form text -> variant payload fields (blank -> null so an edit clears the value). */
export function customsPayload(f: { countryOfOrigin: string; hsCode: string; customsDescription: string }) {
  return {
    countryOfOrigin: f.countryOfOrigin.trim().toUpperCase() || null,
    hsCode: f.hsCode.trim() || null,
    customsDescription: f.customsDescription.trim() || null,
  };
}

export function customsText(v: { countryOfOrigin?: string | null; hsCode?: string | null; customsDescription?: string | null }) {
  return {
    countryOfOrigin: v.countryOfOrigin ?? '',
    hsCode: v.hsCode ?? '',
    customsDescription: v.customsDescription ?? '',
  };
}
