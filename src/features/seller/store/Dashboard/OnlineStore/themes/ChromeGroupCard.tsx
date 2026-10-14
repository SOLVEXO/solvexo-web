import { useEffect, useRef, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

/** One collapsible row in the Customize sidebar's Header / Footer groups
 *  (announcement bar, header, footer). Opening it selects that part in the
 *  preview; selecting the part in the preview opens it here. */
export function ChromeGroupCard({ title, subtitle, icon, open, onToggle, children }: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [open]);
  return (
    <div ref={ref} className={`border rounded-2xl bg-white ${open ? 'border-[#D97757]' : 'border-bone'}`}>
      <button type="button" onClick={onToggle} aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer text-left">
        <span className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-cream text-charcoal">{icon}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-semibold text-charcoal">{title}</span>
          {subtitle && <span className="block text-[11.5px] text-slate truncate">{subtitle}</span>}
        </span>
        {open ? <ChevronDown size={15} className="text-slate shrink-0" /> : <ChevronRight size={15} className="text-slate shrink-0" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-bone/70">{children}</div>}
    </div>
  );
}
