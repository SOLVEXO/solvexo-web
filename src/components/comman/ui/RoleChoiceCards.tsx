import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface RoleChoiceOption {
  value:       string;
  label:       string;
  description?: string;
  Icon:        LucideIcon;
}

interface RoleChoiceCardsProps {
  options:    RoleChoiceOption[];
  value:      string;
  onChange:   (value: string) => void;
  /** 'lg' — Register's first-screen decision (full descriptions, bigger touch
   *  target). 'compact' — Login's inline role switch (icon + label only). */
  size?:      'lg' | 'compact';
  className?: string;
}

// Shared Buyer/Seller role-choice UI for Register and Login — same card
// language as the onboarding wizard's Seller-Type/Product-Type pickers
// (rounded-2xl, 2px border, brand-pale-orange selected fill, checkmark
// badge) so the whole auth → onboarding journey reads as one design system
// instead of a segmented-control here and big cards there.
export function RoleChoiceCards({ options, value, onChange, size = 'lg', className }: RoleChoiceCardsProps) {
  const compact = size === 'compact';
  return (
    <div role="radiogroup" className={clsx('grid grid-cols-2 gap-3', className)}>
      {options.map(opt => {
        const selected = opt.value === value;
        return (
          <button
            type="button"
            key={opt.value}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={clsx(
              'text-left rounded-2xl border-2 cursor-pointer transition-all duration-200 ease-out',
              compact ? 'p-[10px] flex items-center gap-[10px]' : 'p-5',
              !compact && 'hover:-translate-y-0.5 active:translate-y-0',
              selected ? 'bg-brand-pale-orange/40 border-brand-orange' : 'bg-white border-bone hover:border-slate/40',
            )}
          >
            <span className={clsx(
              'flex items-center justify-center rounded-full shrink-0 transition-colors duration-150',
              compact ? 'size-8' : 'size-11 mb-3',
              selected ? 'bg-brand-orange text-white' : 'bg-cream text-slate',
            )}>
              <opt.Icon size={compact ? 15 : 20} />
            </span>

            {compact ? (
              <span className="flex-1 min-w-0 flex items-center justify-between gap-2">
                <span className={clsx('text-[13px] leading-tight', selected ? 'font-semibold text-carbon' : 'font-medium text-slate')}>
                  {opt.label}
                </span>
                <Check size={14} className={clsx('shrink-0 transition-opacity duration-150', selected ? 'text-brand-orange opacity-100' : 'opacity-0')} />
              </span>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[15px] font-bold text-carbon">{opt.label}</p>
                  <span className={clsx(
                    'size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-200',
                    selected ? 'border-brand-orange bg-brand-orange' : 'border-bone bg-white',
                  )}>
                    {selected && <Check size={10} className="text-white" />}
                  </span>
                </div>
                {opt.description && <p className="text-[11.5px] text-slate leading-[1.45]">{opt.description}</p>}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
