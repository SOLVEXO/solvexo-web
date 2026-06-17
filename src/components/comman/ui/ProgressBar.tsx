import { clsx } from 'clsx';

interface ProgressBarProps {
  value:      number;  // 0-100
  label?:     string;
  showValue?: boolean;
  color?:     'orange' | 'green' | 'blue' | 'gray';
  size?:      'sm' | 'md';
  className?: string;
}

const FILL: Record<string, string> = {
  orange: 'bg-brand-orange',
  green:  'bg-success',
  blue:   'bg-info',
  gray:   'bg-slate',
};

export function ProgressBar({ value, label, showValue, color = 'orange', size = 'sm', className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={clsx('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label    && <span className="text-[12px] text-slate">{label}</span>}
          {showValue && <span className="text-[12px] font-semibold text-carbon">{pct}%</span>}
        </div>
      )}
      <div className={clsx('w-full bg-bone rounded-full overflow-hidden', size === 'sm' ? 'h-[5px]' : 'h-2')}>
        <div
          className={clsx(FILL[color], 'h-full rounded-full transition-[width] duration-300')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
