import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface RoleChoiceOption {
  value:       string;
  label:       string;
  description?: string;
  Icon:        LucideIcon;
  /** Fixed per-option icon color — stays constant regardless of selection,
   *  so the list reads consistently at a glance. Defaults to 'orange'. */
  accent?:     'orange' | 'success';
}

interface RoleChoiceCardsProps {
  options:    RoleChoiceOption[];
  value:      string;
  onChange:   (value: string) => void;
  className?: string;
}

const ACCENT_ICON: Record<'orange' | 'success', string> = {
  orange:  'bg-brand-pale-orange text-brand-orange',
  success: 'bg-success-bg text-success',
};

// Shared Buyer/Seller role-choice UI — Register's first-screen decision,
// also reused by Login's role step. A horizontal row (icon left, label +
// description middle, radio/check right) rather than a 2-up card grid —
// selection is shown only by the border/fill tint and the checkmark, never
// by recoloring the icon, so each role keeps its own identity color.
export function RoleChoiceCards({ options, value, onChange, className }: RoleChoiceCardsProps) {
  return (
    <div role="radiogroup" className={clsx('flex flex-col gap-3', className)}>
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
              'flex items-center gap-4 text-left rounded-2xl border-2 cursor-pointer p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0',
              selected ? 'bg-brand-pale-orange/40 border-brand-orange' : 'bg-white border-bone hover:border-slate/40',
            )}
          >
            <span className={clsx('flex items-center justify-center rounded-full shrink-0 size-12', ACCENT_ICON[opt.accent ?? 'orange'])}>
              <opt.Icon size={22} />
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-carbon">{opt.label}</p>
              {opt.description && <p className="text-[12px] text-slate leading-[1.45] mt-0.5">{opt.description}</p>}
            </div>

            <span className={clsx(
              'size-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-200',
              selected ? 'border-brand-orange bg-brand-orange' : 'border-bone bg-white',
            )}>
              {selected && <Check size={12} className="text-white" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
