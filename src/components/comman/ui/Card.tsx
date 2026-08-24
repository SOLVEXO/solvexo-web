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
  const isInteractive = !!onClick;
  return (
    <div
      onClick={onClick}
      // A plain <div onClick> is invisible to keyboard/screen-reader users —
      // it's never in the tab order and has no assistive-tech semantics.
      // Fixed once here (role/tabIndex/Enter+Space) instead of patching each
      // of the ~40 call sites that pass onClick individually.
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? (e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); }
      }) : undefined}
      className={clsx(
        // surface-panel = the Solvexo signature depth treatment (warm paper
        // tone, inset top highlight, --shadow-glow lift on hover/focus) —
        // see index.css. Replaces the old flat bg-white + tint-on-hover.
        'surface-panel rounded-xl',
        (hover || isInteractive) && 'surface-panel-interactive cursor-pointer',
        // The glow-on-focus above is a visual bonus, not the accessibility
        // mechanism — a real outline ring still has to be the thing that
        // actually satisfies keyboard-focus visibility/contrast.
        isInteractive && 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange',
        PADDING[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}
