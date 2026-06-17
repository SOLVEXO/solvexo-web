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
    <div className={clsx('flex flex-col items-center text-center py-[72px] px-5', className)}>
      <div className="w-[72px] h-[72px] rounded-[20px] bg-cream border border-bone flex items-center justify-center mb-[18px] shrink-0">
        {icon}
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
          className="flex items-center gap-[6px] px-[22px] py-[10px] bg-brand-orange text-white border-0 rounded-[9px] text-[13px] font-semibold cursor-pointer"
        >
          {action.icon}
          {action.label}
        </button>
      )}
    </div>
  );
}
