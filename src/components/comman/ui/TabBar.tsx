import { type ReactNode, useId } from 'react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';

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
  /** Tighter padding/font — for narrow containers where the default size would clip. */
  dense?: boolean;
}

export function TabBar({ tabs, active, onChange, className, dense = false }: TabBarProps) {
  // Scoped per instance (not one global string) so two TabBars rendered on
  // the same page at once never try to slide one shared indicator between
  // each other's tabs.
  const indicatorId = useId();

  return (
    <div className={clsx('border-b border-bone overflow-x-auto scrollbar-hide', className)}>
      <div className="flex items-center min-w-max">
        {tabs.map(tab => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={clsx(
                'relative flex items-center font-medium shrink-0',
                dense ? 'gap-[4px] px-[10px] py-2 text-[11.5px]' : 'gap-[6px] px-4 py-[10px] text-[13px]',
                '-mb-px bg-transparent border-none',
                'outline-none cursor-pointer transition-colors duration-150 whitespace-nowrap',
                isActive ? 'text-brand-orange' : 'text-slate hover:text-carbon',
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
              {/* Shared layoutId — slides between tabs on click instead of
                 two independent borders instantly swapping color. */}
              {isActive && (
                <motion.span
                  layoutId={`tabbar-indicator-${indicatorId}`}
                  className="absolute left-0 right-0 bottom-0 h-[2px] bg-brand-orange"
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
