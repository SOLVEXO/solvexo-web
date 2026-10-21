import type { ReactNode } from 'react';
import { ts } from '@/utils/tStatic';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useRequireRealAccount } from '@/hooks/auth/useRequireRealAccount';
import { fashionTheme as t } from '../../theme.config';
import { PillButton, Spinner, StatusPill } from '../../ui/primitives';
import type { OrderBadgeInfo } from '../../../orderUi';
import { PILL_TONE } from './orderLook';

/** Account pages need a real (non-guest) account; a guest is sent to /login and sees a spinner meanwhile. */
export function RequireAccount({ children }: { children: ReactNode }) {
  const guest = useRequireRealAccount();
  return guest ? <Spinner label={ts('pg.redirecting_to_sign_in', 'Redirecting to sign in')} /> : <>{children}</>;
}

export function OrderPill({ badge }: { badge: OrderBadgeInfo }) {
  return <StatusPill tone={PILL_TONE[badge.tone]}>{badge.label}</StatusPill>;
}

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium no-underline" style={{ color: t.colors.inkMuted }}>
      <ArrowLeft size={15} aria-hidden />{children}
    </Link>
  );
}

/** Previous / Next pager with a live "Page x of y" label. Renders nothing for a single page. */
export function Pager({ page, totalPages, onChange, busy }: { page: number; totalPages: number; onChange: (p: number) => void; busy?: boolean }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label={ts('pg.pagination', 'Pagination')} className="mt-6 flex items-center justify-between gap-3">
      <PillButton variant="outline" disabled={page <= 1 || busy} onClick={() => onChange(page - 1)}>{ts('orders.previous', 'Previous')}</PillButton>
      <span aria-live="polite" className="text-sm" style={{ color: t.colors.inkMuted }}>{ts('pg.page_page_of_total', 'Page {{page}} of {{total}}', { page, total: totalPages })}</span>
      <PillButton variant="outline" disabled={page >= totalPages || busy} onClick={() => onChange(page + 1)}>{ts('orders.next', 'Next')}</PillButton>
    </nav>
  );
}
