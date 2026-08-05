import { clsx } from 'clsx';
import { type ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children:   ReactNode;
  className?: string;
  padding?:   CardPadding;
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
  hover    = false,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        // No shadow, no hover border-color change — hover reads through a
        // warm background tint + lift instead.
        'bg-white rounded-xl border border-bone duration-200 ease-out',
        (hover || !!onClick) && 'hover:bg-brand-pale-orange/[0.12] hover:-translate-y-[2px] cursor-pointer',
        PADDING[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}
