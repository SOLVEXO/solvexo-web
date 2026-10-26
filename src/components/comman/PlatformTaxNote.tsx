import { useEffect, useState } from 'react';
import { apiGetPlatformTaxQuote, type PlatformTaxQuote } from '@/api/services/adminPlatformTax';

const usd = (n: number) => `$${n.toFixed(2)}`;

/** "+ Sales Tax 17% ($8.50) = $58.50 total" for an amount the seller is about to pay Solvexo. Renders nothing when no tax applies or the quote cannot load (the charge itself is always computed by the server). */
export function PlatformTaxNote({ storeId, amountUSD, className }: { storeId: string; amountUSD: number; className?: string }) {
  const [quote, setQuote] = useState<PlatformTaxQuote | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!storeId || !(amountUSD > 0)) return;
    apiGetPlatformTaxQuote(storeId, amountUSD)
      .then(res => { if (!cancelled) setQuote(res.data); })
      .catch(() => { if (!cancelled) setQuote(null); });
    return () => { cancelled = true; };
  }, [storeId, amountUSD]);

  if (!quote || !(quote.taxUSD > 0) || !(amountUSD > 0)) return null;
  return (
    <p role="status" className={className ?? 'text-[12px] text-charcoal'}>
      + {quote.label ?? 'Tax'} {quote.ratePercent}% ({usd(quote.taxUSD)}) = <b>{usd(quote.totalUSD)}</b> total
    </p>
  );
}
