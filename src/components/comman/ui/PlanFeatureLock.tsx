import { Lock } from 'lucide-react';

/**
 * Shared "this feature is locked on your plan" placeholder — same visual
 * convention as StoreSettings.tsx's Custom Domain/White Label fields, just
 * scaled up to replace a WHOLE tab/page's content rather than one field.
 * Used wherever an entire tab is gated by a PlatformPlan boolean entitlement
 * (Marketing's Abandoned Cart/Email Campaigns tabs, SEO's Audit/AI/Search
 * Console/Redirects+Canonical tabs) so a seller sees the lock BEFORE trying
 * the feature, instead of only finding out when the backend 403s them.
 */
export function PlanFeatureLock({ label, description, requiredPlan }: { label: string; description: string; requiredPlan: string | null }) {
  return (
    <div className="bg-white border border-bone rounded-[10px] px-6 py-10 flex flex-col items-center text-center gap-2.5">
      <div className="w-10 h-10 rounded-full bg-[#f3f2ec] flex items-center justify-center text-slate">
        <Lock size={17} />
      </div>
      <p className="text-[14.5px] font-bold text-carbon">{label} is locked on your plan</p>
      <p className="text-[12.5px] text-slate max-w-[420px]">{description}</p>
      <p className="text-[12px] font-semibold text-brand-orange mt-1">Requires the {requiredPlan ?? 'a higher'} plan — upgrade from Billing.</p>
    </div>
  );
}

/** Narrow slice of `EntitlementsSummary` this component's callers actually need — avoids importing the full platformPlans service type into every consumer. */
export type PlanFeatureFlag = { allowed: boolean; requiredPlan: string | null } | undefined;
