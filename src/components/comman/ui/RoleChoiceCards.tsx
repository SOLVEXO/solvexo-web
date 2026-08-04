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
  className?: string;
}

// Shared Buyer/Seller role-choice UI — Register's first-screen decision.
// Same card language as the onboarding wizard's Seller-Type/Product-Type
// pickers (rounded-2xl, 2px border, brand-pale-orange selected fill,
// checkmark badge) so the auth → onboarding journey reads as one design
// system. Stacks to one column below `sm` (~640px) — two cards with full
// descriptions side by side get cramped on a 320–414px phone screen.
export function RoleChoiceCards({ options, value, onChange, className }: RoleChoiceCardsProps) {
  return (
    <div role="radiogroup" className={clsx('grid grid-cols-1 sm:grid-cols-2 gap-3', className)}>
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
              'text-left rounded-2xl border-2 cursor-pointer p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0',
              selected ? 'bg-brand-pale-orange/40 border-brand-orange' : 'bg-white border-bone hover:border-slate/40',
            )}
          >
            <span className={clsx(
              'flex items-center justify-center rounded-full shrink-0 size-11 mb-3 transition-colors duration-150',
              selected ? 'bg-brand-orange text-white' : 'bg-cream text-slate',
            )}>
              <opt.Icon size={20} />
            </span>

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
          </button>
        );
      })}
    </div>
  );
}
