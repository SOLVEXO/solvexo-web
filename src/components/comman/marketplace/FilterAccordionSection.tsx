import { useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

/** Collapsible sidebar filter section — shared by the general Marketplace and the Education marketplace filter panels. */
export function FilterAccordionSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-bone pb-4 last:border-b-0 last:pb-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between mb-[10px] bg-transparent border-none cursor-pointer p-0 group"
      >
        <span className="text-[11px] font-bold text-charcoal uppercase tracking-[0.08em] group-hover:text-brand-orange transition-colors">
          {title}
        </span>
        <ChevronDown size={14} className={clsx('text-slate transition-transform duration-200', open && 'rotate-180')} />
      </button>
      <div className={clsx('overflow-hidden transition-all duration-200', open ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0')}>
        {children}
      </div>
    </div>
  );
}

/** Rounded pill chip used inside filter sections — active/inactive styling matches the Marketplace sidebar exactly. */
export function FilterChipPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-[11px] py-[6px] rounded-full text-[11.5px] font-semibold border transition-all duration-150 cursor-pointer leading-none',
        active
          ? 'bg-brand-orange text-white border-brand-orange shadow-[0_2px_8px_rgba(184,90,54,0.25)]'
          : 'bg-cream text-charcoal border-transparent hover:border-brand-orange/40 hover:text-brand-orange',
      )}
    >
      {label}
    </button>
  );
}
