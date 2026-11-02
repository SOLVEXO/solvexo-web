import type { ImportRow } from '@/api/services/salesOps';

export type Field = keyof ImportRow;
export const FIELDS: { key: Field; label: string; match: RegExp }[] = [
  { key: 'name', label: 'Name', match: /^(full\s*|contact\s*|customer\s*)?name$|^contact\s*person$|^person$/i },
  { key: 'businessName', label: 'Business name', match: /business|company|shop|store|brand/i },
  { key: 'email', label: 'Email', match: /e-?mail/i },
  { key: 'phone', label: 'Phone / WhatsApp', match: /phone|mobile|whats|cell|contact\s*no|number/i },
  { key: 'city', label: 'City', match: /city|town|location/i },
  { key: 'businessType', label: 'What they sell', match: /sell|category|type|industry|niche/i },
  { key: 'dealValuePKR', label: 'Deal value (PKR)', match: /value|deal|amount|budget/i },
  { key: 'note', label: 'Note', match: /note|comment|remark|message/i },
];
export const TEMPLATE_HEADERS = ['Name', 'Business name', 'Email', 'Phone', 'City', 'What they sell', 'Deal value (PKR)', 'Note'];

/** Guess which column holds which field from the header row; each column is used once. */
export function guessMapping(headers: string[]): Partial<Record<Field, number>> {
  const out: Partial<Record<Field, number>> = {};
  const used = new Set<number>();
  for (const f of FIELDS) {
    const i = headers.findIndex((h, idx) => !used.has(idx) && f.match.test(h.trim()));
    if (i >= 0) { out[f.key] = i; used.add(i); }
  }
  return out;
}

