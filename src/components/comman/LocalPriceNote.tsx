import type { LocalCurrency } from '@/features/buyer/pages/pricing/localPrice';
import { localPriceNote } from '@/utils/localPlanPrice';

/** The "prices are approximate, you are billed in US dollars" line; renders nothing without a local currency. */
export function LocalPriceNote({ local, className }: { local: LocalCurrency | null; className?: string }) {
  const note = localPriceNote(local);
  if (!note) return null;
  return <p className={className ?? 'text-[11.5px] leading-[1.5] text-slate'}>{note}</p>;
}
