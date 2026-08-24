import type { ReactNode } from 'react';
import { clsx } from 'clsx';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={clsx('flex items-start justify-between gap-4 flex-wrap', className)}>
      <div key={title} className="min-w-0">
        {eyebrow && (
          <p className="solvexo-subtitle-reveal text-[11px] font-semibold text-slate uppercase tracking-[0.06em] mb-1">{eyebrow}</p>
        )}
        <h1 className="solvexo-title-reveal text-[19px] sm:text-[22px] font-bold text-charcoal leading-tight truncate">{title}</h1>
        {description && (
          <p className="solvexo-subtitle-reveal text-[12.5px] text-slate mt-1 max-w-[560px] leading-relaxed">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
