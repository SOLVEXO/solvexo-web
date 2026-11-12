import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/comman/ui';

/**
 * Shown in place of a page whose feature the store's plan does not include (opened by URL, bookmark or
 * a stale link — the sidebar already hides these). Only the owner can change the plan, so staff just
 * read the message. The backend still refuses the actual calls.
 */
export function PlanUpgradeNeeded({ storeId, requiredPlan, canUpgrade }: { storeId: string; requiredPlan: string | null; canUpgrade: boolean }) {
  const navigate = useNavigate();
  return (
    <div role="alert" className="px-4 lg:px-7 py-16 flex flex-col items-center text-center gap-3">
      <div className="size-12 rounded-full bg-[#f3f2ec] flex items-center justify-center"><Lock size={20} className="text-slate" /></div>
      <h2 className="text-[17px] font-bold text-charcoal">This feature isn't included in your plan</h2>
      <p className="text-[13px] text-slate max-w-[420px]">
        {requiredPlan ? <>It is available on the <span className="font-semibold text-charcoal">{requiredPlan}</span> plan and above.</> : 'It is available on a higher plan.'}
        {canUpgrade ? '' : ' Ask the store owner to upgrade the plan.'}
      </p>
      {canUpgrade && <Button size="sm" onClick={() => navigate(`/store/${storeId}/plan-billing`)}>See plans</Button>}
    </div>
  );
}
