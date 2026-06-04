import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const paddingClasses = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-7',
};

export function Card({ children, className, padding = 'md', hover: _hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-xl border border-bone',
        paddingClasses[padding],
        // hover && 'cursor-pointer transition-shadow duration-200 hover:shadow-lg',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}
