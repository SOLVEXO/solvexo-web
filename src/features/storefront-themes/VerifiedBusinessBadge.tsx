import { ShieldCheck } from 'lucide-react';
import { ts } from '@/utils/tStatic';

/** Small "Verified business" mark for a store Solvexo has verified (`badges` includes 'verified').
 *  Inherits the surrounding text colour and font, so every theme keeps its own look. */
export function VerifiedBusinessBadge({ badges, className }: { badges: string[] | null | undefined; className?: string }) {
  if (!badges?.includes('verified')) return null;
  const label = ts('pg.verified_business', 'Verified business');
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap align-middle ${className ?? ''}`}
      title={ts('pg.verified_business_hint', 'Business identity checked by Solvexo')}
    >
      <ShieldCheck size={13} aria-hidden strokeWidth={2.2} />
      {label}
    </span>
  );
}
