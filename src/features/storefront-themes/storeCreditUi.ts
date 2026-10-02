import type { StoreCreditTransaction } from '@/api/services/storeCredit';

/** Shared (theme-agnostic) labels/helpers for the buyer "Store credit" pages. */
export const STORE_CREDIT_TYPE_LABEL: Record<string, string> = {
  issue: 'Credit added',
  adjust_credit: 'Credit added',
  adjust_debit: 'Credit removed',
  redeem: 'Used at checkout',
  restore: 'Restored',
  refund_credit: 'Refund to store credit',
  expire: 'Expired',
};

/** Whether the ledger row adds to (true) or removes from (false) the balance. */
export function isStoreCreditIncrease(tx: StoreCreditTransaction): boolean {
  return tx.type === 'issue' || tx.type === 'adjust_credit' || tx.type === 'restore' || tx.type === 'refund_credit';
}

export function formatStoreCreditDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
