import { type ReactNode } from 'react';
import { clsx } from 'clsx';

export interface Tab {
  id:     string;
  label:  string;
  icon?:  ReactNode;
  count?: number;
}

interface TabBarProps {
  tabs:       Tab[];
  active:     string;
  onChange:   (id: string) => void;
  className?: string;
}

export function TabBar({ tabs, active, onChange, className }: TabBarProps) {
  return (
    <div className={clsx('flex items-center border-b border-bone', className)}>
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex items-center gap-[6px] px-4 py-[10px] text-[13px] font-medium',
              'border-b-2 -mb-px bg-transparent border-l-0 border-r-0 border-t-0',
              'outline-none cursor-pointer transition-all duration-150 whitespace-nowrap',
              isActive
                ? 'border-b-brand-orange text-brand-orange'
                : 'border-b-transparent text-slate hover:text-carbon',
            )}
          >
            {tab.icon && <span className="leading-none shrink-0">{tab.icon}</span>}
            {tab.label}
            {tab.count != null && (
              <span className={clsx(
                'text-[10px] font-semibold px-[6px] py-[1px] rounded-full',
                isActive ? 'bg-brand-pale-orange text-brand-deep-orange' : 'bg-cream text-slate',
              )}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
