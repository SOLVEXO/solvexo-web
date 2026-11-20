import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, History } from 'lucide-react';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { SettingsCard } from '@/components/comman/settings';
import { BillingTimeline } from '@/components/comman/billing/BillingTimeline';
import { BillingInvoicesList } from '@/components/comman/billing/BillingInvoicesList';
import { apiGetBillingTimeline, apiExportBillingTimeline, type BillingTimelineParams } from '@/api/services/billingTimeline';

/**
 * The store's complete Solvexo billing record on one page: the timeline (plan changes, payments with card + line items,
 * failed attempts, refunds, fee bills, monthly statement, CSV) on the left and the invoices on the right.
 * Reached from Plan & Billing → "View billing activity".
 */
export default function StoreBillingActivity() {
  const { storeId } = useStoreWorkspace();
  const load = useCallback((p: BillingTimelineParams) => apiGetBillingTimeline(storeId, p), [storeId]);
  const exportCsv = useCallback((p: BillingTimelineParams) => apiExportBillingTimeline(storeId, p), [storeId]);

  return (
    <>
      <StorePageHeader title="Billing activity" subtitle="Everything you were charged, credited or refunded by Solvexo — and your invoices." />
      <div className="px-4 lg:px-7 py-6 flex flex-col gap-4">
        <Link to={`/store/${storeId}/settings/billing`} className="inline-flex w-fit items-center gap-1.5 text-[12.5px] font-semibold text-slate hover:text-charcoal">
          <ArrowLeft size={14} aria-hidden /> Back to Billing Center
        </Link>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 xl:items-start">
          <SettingsCard title="Activity" icon={<History size={14} />} description="Plan changes, payments, failed attempts and refunds, newest first." divided bodyClassName="px-0 pb-0">
            <BillingTimeline compact load={load} exportCsv={exportCsv} />
          </SettingsCard>
          <SettingsCard title="Invoices" icon={<FileText size={14} />} description="Download or open any invoice." divided bodyClassName="px-0 pb-0">
            <BillingInvoicesList storeId={storeId} />
          </SettingsCard>
        </div>
      </div>
    </>
  );
}
