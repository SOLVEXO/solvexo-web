import { usePageTitle } from '@/hooks/usePageTitle';
import { AdminPageHeader } from '@/components/comman/ui';
import { AdminPlatformPlans } from './AdminPlatformPlans';
import { ComplimentaryPlansPanel } from './ComplimentaryPlansPanel';

// ── Billing — SELLERS paying Solvexo itself for platform access
// (Basic/Pro/Enterprise SaaS tiers). This is Solvexo's OWN money, so its
// admin refund action stays untouched. Complimentary plans (given by admins
// for free) are tracked in their own panel at the top so none is forgotten. ──
export function AdminBilling() {
  usePageTitle('Billing');

  return (
    <>
      <AdminPageHeader title="Billing" subtitle="Seller-to-Solvexo platform plans." />
      <ComplimentaryPlansPanel />
      <AdminPlatformPlans embedded />
    </>
  );
}
