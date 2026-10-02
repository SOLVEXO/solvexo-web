import { usePageTitle } from '@/hooks/usePageTitle';
import { AdminPageHeader } from '@/components/comman/ui';
import { AdminPlatformPlans } from './AdminPlatformPlans';

// ── Billing — SELLERS paying Solvexo itself for platform access
// (Basic/Pro/Enterprise SaaS tiers). This is Solvexo's OWN money, so its
// admin refund action stays untouched. ─────────────────────────────────────
export function AdminBilling() {
  usePageTitle('Billing');

  return (
    <>
      <AdminPageHeader title="Billing" subtitle="Seller-to-Solvexo platform plans." />
      <AdminPlatformPlans embedded />
    </>
  );
}
