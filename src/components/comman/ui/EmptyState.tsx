import { type ReactNode } from 'react';
import { clsx } from 'clsx';

interface EmptyStateProps {
  icon:         ReactNode;
  title:        string;
  description?: string;
  action?:      { label: string; onClick: () => void; icon?: ReactNode };
  className?:   string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('dash-section-enter flex flex-col items-center text-center py-[72px] px-5', className)}>
      <div className="relative mb-[18px] shrink-0">
        <div className="absolute inset-0 rounded-full bg-brand-orange/[0.08] blur-xl scale-125" />
        <div className="relative w-[72px] h-[72px] rounded-[20px] bg-gradient-to-b from-cream to-bone/60 border border-bone flex items-center justify-center shadow-[0_1px_2px_rgba(20,20,19,0.04)]">
          {icon}
        </div>
      </div>
      <p className="text-[17px] font-bold text-carbon mb-2">{title}</p>
      {description && (
        <p className="text-[13px] text-slate max-w-[330px] leading-[1.6] mb-[22px]">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-[6px] px-[22px] py-[10px] bg-brand-orange text-white border-0 rounded-[9px] text-[13px] font-semibold cursor-pointer shadow-[0_1px_2px_rgba(184,90,54,0.15)] transition-all duration-150 hover:bg-brand-deep-orange hover:shadow-[0_2px_8px_rgba(184,90,54,0.25)] hover:-translate-y-px"
        >
          {action.icon}
          {action.label}
        </button>
      )}
    </div>
  );
}
