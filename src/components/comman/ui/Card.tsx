import { clsx } from 'clsx';
import { type ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children:   ReactNode;
  className?: string;
  padding?:   CardPadding;
  shadow?:    boolean;
  hover?:     boolean;
  onClick?:   () => void;
}

// ─── Style Maps ───────────────────────────────────────────────────────────────

const PADDING: Record<CardPadding, string> = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-7',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Card({
  children,
  className,
  padding  = 'md',
  shadow   = true,
  hover    = false,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-[10px] border border-bone',
        shadow && 'shadow-[0_1px_4px_rgba(0,0,0,0.04)]',
        PADDING[padding],
        (hover || !!onClick) && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}