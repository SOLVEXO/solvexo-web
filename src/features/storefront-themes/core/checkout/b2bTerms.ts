import { ts } from '@/utils/tStatic';

export interface CheckoutB2B {
  companyName: string;
  poNumber: string | null;
  paymentTerms: { type: 'due_on_order' | 'net' | 'due_on_fulfilment'; netDays?: number | null } | null;
}

/** "Net 30", "Due on order", "Due on fulfilment": the words a wholesale buyer sees for their payment terms. */
export function termsText(terms: CheckoutB2B['paymentTerms'] | undefined): string {
  if (!terms) return '';
  if (terms.type === 'net') return ts('b2b.net_days', 'Net {{days}}', { days: terms.netDays ?? 30 });
  if (terms.type === 'due_on_order') return ts('b2b.due_on_order', 'Due on order');
  return ts('b2b.due_on_fulfilment', 'Due on fulfilment');
}

/** Parses a quick-order list: one "SKU, quantity" (or "SKU quantity" / tab separated) per line. A header row and blank lines are skipped. */
export function parseQuickOrderText(text: string): { sku: string; quantity: number }[] {
  const out: { sku: string; quantity: number }[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(/[,\t;]|\s{2,}|\s(?=\d+$)/).map((s) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
    const sku = parts[0] ?? '';
    const q = parts.length > 1 ? Number(parts[1]) : 1;
    if (/^(sku|item|product)$/i.test(sku) && Number.isNaN(q)) continue; // header row
    out.push({ sku, quantity: Number.isFinite(q) ? Math.trunc(q) : 0 });
  }
  return out.slice(0, 100);
}
