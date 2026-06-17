import { type ReactNode } from 'react';
import { clsx } from 'clsx';

export interface RadioOption {
  value:        string;
  label:        string;
  description?: string;
  icon?:        ReactNode;
}

interface RadioButtonProps {
  options:    RadioOption[];
  value:      string;
  onChange:   (value: string) => void;
  name:       string;
  layout?:    'row' | 'col';
  className?: string;
}

function RadioCard({
  option,
  selected,
  onClick,
}: {
  option:   RadioOption;
  selected: boolean;
  onClick:  () => void;
}) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className={clsx(
        'flex-1 flex items-center gap-3 py-[14px] px-4 rounded-[10px] border-2 cursor-pointer',
        'transition-all duration-[180ms] select-none outline-none',
        selected
          ? 'border-brand-orange bg-brand-pale-orange shadow-[0_0_0_3px_rgba(217,119,87,0.15)]'
          : 'border-bone bg-white',
      )}
    >
      {/* Radio circle */}
      <div
        className={clsx(
          'size-[18px] rounded-full border-2 bg-white flex items-center justify-center shrink-0',
          'transition-all duration-[180ms]',
          selected ? 'border-brand-orange' : 'border-bone',
        )}
      >
        {selected && (
          <div className="size-[9px] rounded-full bg-brand-orange transition-all duration-[180ms]" />
        )}
      </div>

      {option.icon && (
        <span className="text-[20px] shrink-0 flex items-center">{option.icon}</span>
      )}

      <div className="flex-1 min-w-0">
        <p
          className={clsx(
            'text-[14px] leading-[1.3] m-0 transition-all duration-[180ms]',
            selected ? 'font-semibold text-brand-deep-orange' : 'font-medium text-carbon',
          )}
        >
          {option.label}
        </p>
        {option.description && (
          <p className="text-[12px] text-slate mt-0.5 leading-[1.4]">
            {option.description}
          </p>
        )}
      </div>
    </div>
  );
}

export function RadioButton({
  options,
  value,
  onChange,
  name: _name,
  layout = 'row',
  className,
}: RadioButtonProps) {
  return (
    <div className={clsx('flex gap-[10px]', layout === 'col' ? 'flex-col' : 'flex-row', className)}>
      {options.map(opt => (
        <RadioCard
          key={opt.value}
          option={opt}
          selected={value === opt.value}
          onClick={() => onChange(opt.value)}
        />
      ))}
    </div>
  );
}
