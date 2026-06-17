import { clsx } from 'clsx';
import { type ReactNode } from 'react';

interface CardProps {
  children:   ReactNode;
  className?: string;
  padding?:   'none' | 'sm' | 'md' | 'lg';
  shadow?:    boolean;
  hover?:     boolean;
  onClick?:   () => void;
}

const PADDING = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-7',
};

export function Card({
  children, className, padding = 'md', shadow = true, hover = false, onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-[10px] border border-bone',
        shadow && 'shadow-[0_1px_4px_rgba(0,0,0,0.04)]',
        PADDING[padding],
        hover && 'transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]',
        (hover || onClick) && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}
