import { tt } from '@/utils/tStatic';
import type { StoreCreditTransaction } from '@/api/services/storeCredit';
import { activeLocale } from './core/locale';

/** Shared (theme-agnostic) labels/helpers for the buyer "Store credit" pages. */
export const STORE_CREDIT_TYPE_LABEL: Record<string, string> = {
  issue: tt('credit.added', "Credit added"),
  adjust_credit: tt('credit.added', "Credit added"),
  adjust_debit: tt('credit.removed', "Credit removed"),
  redeem: tt('credit.used', "Used at checkout"),
  restore: tt('credit.restored', "Restored"),
  refund_credit: tt('credit.refund', "Refund to store credit"),
  expire: tt('credit.expired', "Expired"),
};

/** Whether the ledger row adds to (true) or removes from (false) the balance. */
export function isStoreCreditIncrease(tx: StoreCreditTransaction): boolean {
  return tx.type === 'issue' || tx.type === 'adjust_credit' || tx.type === 'restore' || tx.type === 'refund_credit';
}

export function formatStoreCreditDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(activeLocale(), { year: 'numeric', month: 'short', day: 'numeric' });
}
