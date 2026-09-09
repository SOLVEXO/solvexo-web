import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import { MagneticButton } from '@/components/comman/motion/MagneticButton';
import { PremiumCard } from '@/components/comman/motion/PremiumCard';
import { AnimatedCounter } from '@/components/comman/motion/AnimatedCounter';
import type { PlatformPlan } from '@/api/services/platformPlans';

interface PlanCardProps {
  plan: PlatformPlan;
  billing: 'monthly' | 'annual';
  ctaLabel: string;
  onCta: () => void;
  /** Shows a filled check badge + orange ring — used by the onboarding plan
   *  picker so a chosen plan is visually obvious; the public Pricing page
   *  never passes this (nothing is ever "selected" there). */
  selected?: boolean;
  className?: string;
}

// The exact plan-card visual from the public Pricing page, extracted so
// onboarding's "choose a plan" step can never visually drift from the real
// pricing page — one card design, two call sites, not a second stripped-down
// copy. Only the CTA behavior/label and the `selected` affordance vary by caller.
export function PlanCard({ plan, billing, ctaLabel, onCta, selected, className }: PlanCardProps) {
  const isFeatured = !!plan.badge;
  const monthlyEquivalent = billing === 'annual'
    ? Math.round((plan.yearlyPriceUSD ?? (plan.monthlyPriceUSD ?? 0) * 12) / 12)
    : (plan.monthlyPriceUSD ?? 0);
  const yearlyTotal = plan.yearlyPriceUSD ?? (plan.monthlyPriceUSD ?? 0) * 12;

  return (
    <PremiumCard
      tone={isFeatured ? 'dark' : 'light'}
      className={clsx(
        'w-full sm:w-[300px] p-7', isFeatured && 'border-brand-orange!',
        selected && 'ring-2 ring-brand-orange ring-offset-2 ring-offset-cream',
        className,
      )}
    >
      {plan.badge && (
        <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 bg-brand-orange text-white rounded-[20px] px-[14px] py-1 text-[11px] font-bold whitespace-nowrap">
          {plan.badge}
        </div>
      )}
      {selected && (
        <div className="absolute top-3 right-3 size-6 rounded-full bg-brand-orange flex items-center justify-center">
          <Check size={13} className="text-white" />
        </div>
      )}

      <p className={clsx('text-[15px] font-bold mb-2', isFeatured ? 'text-white' : 'text-carbon')}>{plan.name}</p>
      <p className={clsx('text-[11px] mb-5 leading-[1.5]', isFeatured ? 'text-[#b0aea8]' : 'text-slate')}>{plan.description ?? ' '}</p>

      <div className="mb-6">
        {plan.isCustomPricing ? (
          <p className={clsx('text-[28px] font-bold', isFeatured ? 'text-white' : 'text-carbon')}>Custom</p>
        ) : plan.isFree ? (
          <p className={clsx('text-[36px] font-bold', isFeatured ? 'text-white' : 'text-carbon')}>Free</p>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className={clsx('text-[36px] font-bold', isFeatured ? 'text-brand-orange' : 'text-carbon')}>
              <AnimatedCounter value={monthlyEquivalent} format={n => `$${Math.round(n)}`} duration={0.8} />
            </span>
            <span className={clsx('text-[13px]', isFeatured ? 'text-[#b0aea8]' : 'text-slate')}>/month</span>
          </div>
        )}
        {billing === 'annual' && !plan.isFree && !plan.isCustomPricing && (
          <p className={clsx('text-[11px] mt-1', isFeatured ? 'text-brand-orange' : 'text-success')}>
            Billed ${yearlyTotal}/year
          </p>
        )}
        {billing === 'monthly' && plan.introOfferEnabled && plan.introPriceUSD != null && plan.introDurationCycles != null && (
          <p className={clsx('text-[11px] mt-1 font-medium', isFeatured ? 'text-brand-orange' : 'text-success')}>
            ${plan.introPriceUSD}/mo for {plan.introDurationCycles} month{plan.introDurationCycles === 1 ? '' : 's'}, then ${plan.monthlyPriceUSD}/mo
          </p>
        )}
      </div>

      <MagneticButton className="block mb-6">
        <button
          type="button"
          onClick={onCta}
          className={clsx(
            'w-full py-[10px] rounded-lg text-[13px] font-semibold cursor-pointer flex justify-center transition-all duration-[180ms] border',
            isFeatured ? 'border-brand-orange bg-brand-orange text-white' : 'border-bone bg-transparent text-charcoal',
          )}
        >
          {ctaLabel}
        </button>
      </MagneticButton>

      <div className={clsx('h-px mb-5', isFeatured ? 'bg-[rgba(255,255,255,0.1)]' : 'bg-bone')} />

      <div className="flex flex-col gap-[10px]">
        {(plan.featureBullets ?? []).map(f => (
          <div key={f} className="flex gap-2 items-start">
            <Check size={13} className="text-success flex-shrink-0 mt-[1px]" />
            <span className={clsx('text-[12px] leading-[1.5]', isFeatured ? 'text-[#d0cec8]' : 'text-charcoal')}>{f}</span>
          </div>
        ))}
      </div>
    </PremiumCard>
  );
}
