import { clsx } from 'clsx';

export interface RoleSegmentOption {
  value:        string;
  label:        string;
  description?: string;
}

interface RoleSegmentedControlProps {
  options:    RoleSegmentOption[];
  value:      string;
  onChange:   (value: string) => void;
  label?:     string;
  className?: string;
}

// Animated Buyer/Seller selector — replaces the plain pill toggle (LoginPage)
// and the RadioButton card group (RegisterPage) with one shared component: a
// sliding highlight `thumb` animates between segments instead of just
// swapping background classes on click.
export function RoleSegmentedControl({
  options,
  value,
  onChange,
  label,
  className,
}: RoleSegmentedControlProps) {
  const activeIndex = Math.max(0, options.findIndex(o => o.value === value));
  const hasDescriptions = options.some(o => o.description);

  return (
    <div className={className}>
      {label && (
        <label className="block text-[12px] font-medium text-charcoal mb-[6px]">{label}</label>
      )}
      <div
        role="radiogroup"
        aria-label={label ?? 'Select an option'}
        className="relative flex rounded-2xl bg-cream p-1 gap-1 border border-bone"
      >
        {/* Sliding thumb */}
        <div
          aria-hidden
          className="absolute top-1 bottom-1 rounded-[14px] bg-white shadow-[0_2px_10px_rgba(20,20,19,0.10)] transition-[transform,width] duration-[280ms] ease-out"
          style={{
            width: `calc(${100 / options.length}% - 4px)`,
            transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 4}px))`,
          }}
        />
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={clsx(
                'relative z-10 flex-1 flex flex-col items-center justify-center gap-0.5 py-[10px] px-3 rounded-[14px]',
                'border-none bg-transparent cursor-pointer select-none outline-none',
                'transition-colors duration-200 ease-out',
                hasDescriptions ? 'text-left items-start' : '',
                active ? 'text-carbon' : 'text-slate hover:text-charcoal',
              )}
            >
              <span className={clsx('text-[13px] leading-tight', active ? 'font-semibold' : 'font-medium')}>
                {opt.label}
              </span>
              {opt.description && (
                <span className={clsx('text-[10.5px] leading-[1.3] transition-colors duration-200', active ? 'text-slate' : 'text-slate/70')}>
                  {opt.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
