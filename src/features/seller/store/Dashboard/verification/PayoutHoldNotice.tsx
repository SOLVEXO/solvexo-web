import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { isStaffSession } from '@/hooks/auth/useCan';
import { useStoreVerification } from './useStoreVerification';

/** Finance: explains held payouts while the store is limited for being unverified. The API refuses the payout itself. */
export function PayoutHoldNotice({ storeId }: { storeId: string }) {
  const { data } = useStoreVerification(storeId, { enabled: !isStaffSession(), quiet: true });
  if (!data || data.verificationStatus === 'verified' || !data.deadline?.limited) return null;
  return (
    <div role="status" className="flex items-start sm:items-center justify-between gap-3 flex-wrap bg-error-bg border border-error/15 rounded-[10px] px-4 py-3">
      <div className="flex items-start gap-2.5 min-w-0">
        <ShieldAlert size={16} className="text-error shrink-0 mt-[1px]" />
        <p className="text-[12.5px] text-charcoal leading-[1.5]">
          <strong>Payouts are on hold until your business is verified.</strong> Card and online payments stay in your balance; cash on delivery is not affected.
        </p>
      </div>
      <Link to={`/store/${storeId}/settings/verification`} className="text-[12.5px] font-semibold text-brand-deep-orange underline shrink-0">
        {data.verificationStatus === 'pending' || data.verificationStatus === 'under_review' ? 'View status' : 'Verify now'}
      </Link>
    </div>
  );
}
