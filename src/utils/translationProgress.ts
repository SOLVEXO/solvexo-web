export type TranslationFields = Partial<Record<'title' | 'description' | 'handle' | 'metaTitle' | 'metaDescription', string | null | undefined>>;

export const TRANSLATION_FIELDS = ['title', 'description', 'handle', 'metaTitle', 'metaDescription'] as const;
export type TranslationField = typeof TRANSLATION_FIELDS[number];

const filled = (v: string | null | undefined) => typeof v === 'string' && v.trim().length > 0;

/** Fields the seller has not translated yet, ignoring fields the source itself has no text for (nothing to translate). */
export function untranslatedFields(source: TranslationFields, tr: TranslationFields | undefined): TranslationField[] {
  return TRANSLATION_FIELDS.filter(f => filled(source[f]) && !filled(tr?.[f]));
}

/** {done, total} over the fields that have source text. */
export function translationProgress(source: TranslationFields, tr: TranslationFields | undefined): { done: number; total: number } {
  const total = TRANSLATION_FIELDS.filter(f => filled(source[f])).length;
  return { total, done: total - untranslatedFields(source, tr).length };
}

/** Menu progress: one label per menu item. */
export function menuProgress(items: { id: string; label: string; labelTranslations?: Record<string, string> }[], locale: string): { done: number; total: number } {
  const total = items.filter(i => filled(i.label)).length;
  const done = items.filter(i => filled(i.label) && filled(i.labelTranslations?.[locale])).length;
  return { done, total };
}

/** `{{tag}}` placeholders used in `text` that are not in the allowed list (deduplicated, in order of appearance). */
export function findUnknownTags(text: string, allowed: string[]): string[] {
  const ok = new Set(allowed);
  const seen: string[] = [];
  for (const m of text.matchAll(/\{\{\s*([A-Za-z0-9_.]+)\s*\}\}/g)) {
    if (!ok.has(m[1]) && !seen.includes(m[1])) seen.push(m[1]);
  }
  return seen;
}
