import { formatMoneyCompact } from '@/utils/currency';

/**
 * Platform-owner amount cell — always USD (Solvexo's books are USD via Stripe).
 * Non-USD ledger rows arrive pre-converted from the API as `usd`; with no FX
 * rate for that currency we show a dash and a hint, never a guessed value or
 * the raw local-currency number.
 */
export function UsdAmount({ usd, native, currency, signed }: { usd: number | null | undefined; native: number; currency: string; signed?: boolean }) {
  const value = currency === 'USD' ? native : usd;
  if (value == null) {
    return (
      <span>
        —
        <span className="block text-[10px] text-error">no FX rate set</span>
      </span>
    );
  }
  const sign = signed && value >= 0 ? '+' : '';
  return <>{sign}{formatMoneyCompact(value, 'USD')}</>;
}
