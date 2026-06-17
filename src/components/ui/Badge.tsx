import { clsx } from 'clsx';
import type { BadgeColor } from '@/types';
import { STATUS_COLORS } from '@/constants/tokens';

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  className?: string;
}

// Reference exact values: py-[3px] px-[9px], rounded-full, text-[11px], font-semibold
const colorClasses: Record<BadgeColor, string> = {
  gray:   'bg-[#F1EFE8] text-slate',
  orange: 'bg-brand-pale-orange text-brand-deep-orange',
  green:  'bg-success-bg text-success',
  red:    'bg-error-bg text-error',
  yellow: 'bg-warning-bg text-warning',
  blue:   'bg-info-bg text-info',
};

export function Badge({ children, color = 'gray', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full whitespace-nowrap',
        'text-[11px] font-semibold py-[3px] px-[9px]',
        colorClasses[color],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? 'gray';
  return <Badge color={color}>{status}</Badge>;
}
