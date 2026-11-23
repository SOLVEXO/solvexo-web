/** Shared types and formatting for the Accounting screens (amounts arrive in integer minor units of the base currency). */

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface AccountRow {
  key: string; code: string; name: string; type: AccountType; group: string; system: boolean; archived: boolean; externalCode: string | null;
  debitMinor: number; creditMinor: number; balanceMinor: number;
}
export interface JournalLine { accountKey: string; debitMinor: number; creditMinor: number; memo?: string }
export interface JournalEntry {
  _id: string; seq: number; date: string; kind: 'auto' | 'manual' | 'opening' | 'reversal'; sourceType: string; sourceId: string | null;
  reference: string; memo: string; lines: JournalLine[]; totalMinor: number; currency: string; reversesEntryId: string | null; reversed?: boolean;
  reversal?: { _id: string; seq: number; date: string } | null;
}
export interface AccountingSettings {
  enabled: boolean; goLiveDate: string; baseCurrency: string; lastSyncAt: string | null; openingEntryId: string | null;
  lastSync: { posted: Record<string, number>; skipped: Record<string, number>; errors: number } | null;
  skippedTotals: Record<string, number>;
  lastCheck: { at: string; ok: boolean; debitMinor: number; creditMinor: number; entries: number } | null;
}
export interface SettingsResponse { enabled: boolean; settings: AccountingSettings | null; currency: string; exponent: number }

export const TYPE_LABEL: Record<AccountType, string> = { asset: 'Asset', liability: 'Liability', equity: 'Equity', income: 'Income', expense: 'Expense' };

export const SOURCE_LABEL: Record<string, string> = {
  pos_sale: 'POS sale', pos_refund: 'POS refund', pos_void: 'POS void', expense: 'Expense', cash_movement: 'Cash in / out', shift_close: 'Shift close',
  stock: 'Stock', receipt: 'Goods received', supplier: 'Supplier', khata: 'Khata', order: 'Online order', order_refund: 'Online refund',
  fee: 'Solvexo fee', payout: 'Payout', manual: 'Journal entry', opening: 'Opening balances',
};

/** Why records were left out of the books, in plain words. */
export const SKIP_LABEL: Record<string, string> = {
  currency: 'in another currency (converting them comes in a later phase)',
  no_cost: 'stock movements with no cost price on the product',
  before_go_live: 'dated before the go-live date (their effect belongs in the opening balances)',
  deleted: 'deleted orders',
  original_missing: 'khata reversals whose original entry was not found',
};

/** Minor units → a formatted amount, e.g. 1234500 (PKR, 2) → "12,345.00". */
export function fmt(minor: number | null | undefined, exponent: number): string {
  const v = (minor ?? 0) / 10 ** exponent;
  return v.toLocaleString(undefined, { minimumFractionDigits: exponent, maximumFractionDigits: exponent });
}

/** A typed amount (major units, commas allowed) → minor units; null when it is not a number. */
export function toMinor(input: string, exponent: number): number | null {
  const s = input.replace(/,/g, '').trim();
  if (s === '') return 0;
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return Math.round(Number(s) * 10 ** exponent);
}

export const dayIso = (d: Date) => d.toISOString().slice(0, 10);
export const shortDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : '—');
export const isBalanceSheet = (t: AccountType) => t === 'asset' || t === 'liability' || t === 'equity';
export const isDebitNormal = (t: AccountType) => t === 'asset' || t === 'expense';
