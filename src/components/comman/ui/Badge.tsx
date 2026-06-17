import { type ReactNode } from 'react';
import { clsx } from 'clsx';
import type { BadgeColor } from '@/types';
import { STATUS_COLORS } from '@/constants/tokens';

interface BadgeProps {
  children:   ReactNode;
  color?:     BadgeColor;
  size?:      'sm' | 'md';
  dot?:       boolean;
  className?: string;
}

const colorClasses: Record<BadgeColor, string> = {
  gray:   'bg-[#F1EFE8] text-slate',
  orange: 'bg-brand-pale-orange text-brand-deep-orange',
  green:  'bg-success-bg text-success',
  red:    'bg-error-bg text-error',
  yellow: 'bg-warning-bg text-warning',
  blue:   'bg-info-bg text-info',
};

const dotColor: Record<BadgeColor, string> = {
  gray:   'bg-slate',
  orange: 'bg-brand-orange',
  green:  'bg-success',
  red:    'bg-error',
  yellow: 'bg-warning',
  blue:   'bg-info',
};

export function Badge({ children, color = 'gray', size = 'md', dot, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-[5px] rounded-full whitespace-nowrap font-semibold',
        size === 'md' ? 'text-[11px] py-[3px] px-[9px]' : 'text-[10px] py-[2px] px-[7px]',
        colorClasses[color],
        className,
      )}
    >
      {dot && <span className={clsx('w-[5px] h-[5px] rounded-full shrink-0', dotColor[color])} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, size }: { status: string; size?: 'sm' | 'md' }) {
  const color  = STATUS_COLORS[status] ?? STATUS_COLORS[status?.toLowerCase()] ?? 'gray';
  const label  = status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge color={color} size={size}>{label}</Badge>;
}
