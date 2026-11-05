/** Where people email Solvexo directly (sales, plan enquiries, general contact). */
export const SALES_EMAIL = 'sales@solvexo.store';

/** `mailto:` link to SALES_EMAIL, optionally with a subject. */
export function salesMailto(subject?: string): string {
  return `mailto:${SALES_EMAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
}
