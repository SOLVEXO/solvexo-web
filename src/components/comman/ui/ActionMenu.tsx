import { useState, useRef, useEffect, type ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';
import { clsx } from 'clsx';

export interface ActionMenuItem {
  label:   string;
  onClick: () => void;
  icon?:   ReactNode;
  danger?: boolean;
}

interface ActionMenuProps {
  items:      ActionMenuItem[];
  align?:     'left' | 'right';
  className?: string;
}

export function ActionMenu({ items, align = 'right', className }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className={clsx('relative inline-block', className)}>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className={clsx(
          'w-8 h-8 rounded-[7px] border flex items-center justify-center transition-colors cursor-pointer',
          open
            ? 'bg-brand-pale-orange border-brand-orange text-brand-orange'
            : 'bg-white border-bone text-slate hover:bg-cream hover:border-[#c5c4bc]',
        )}
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div className={clsx(
          'absolute top-full mt-1 z-50 bg-white border border-bone rounded-[10px] py-1 min-w-[140px]',
          align === 'right' ? 'right-0' : 'left-0',
        )}>
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={e => { e.stopPropagation(); item.onClick(); setOpen(false); }}
              className={clsx(
                'w-full flex items-center gap-2 px-4 py-[9px] text-[13px] font-medium text-left cursor-pointer transition-colors',
                item.danger
                  ? 'text-error hover:bg-error-bg'
                  : 'text-carbon hover:bg-cream',
              )}
            >
              {item.icon && <span className="shrink-0 opacity-70">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
