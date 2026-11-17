import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ts } from '@/utils/tStatic';

/** One collapsible filter group (accordion). */
export function LedupFilterGroup({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#9b928c] px-6 py-5 last:border-b-0">
      <button type="button" aria-expanded={open} onClick={() => setOpen(o => !o)} className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent p-0 text-start text-[14px] font-normal text-black">
        {title}
        {open ? <ChevronUp size={15} className="text-stone-400" aria-hidden /> : <ChevronDown size={15} className="text-stone-400" aria-hidden />}
      </button>
      {open && <div className="ld-pop mt-3 flex flex-col gap-2.5">{children}</div>}
    </div>
  );
}

/** A checkbox row with the number of matching products. */
export function LedupFilterCheck({ label, count, checked, onToggle }: { label: string; count?: number; checked: boolean; onToggle: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-[#8c847e]">
      <input type="checkbox" checked={checked} onChange={onToggle} className="h-4 w-4 rounded accent-[var(--ld-accent)]" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count != null && <span className="text-[13px] text-[#8c847e]">({count})</span>}
    </label>
  );
}

export function LedupFilterShell({ children, onClear, canClear }: { children: ReactNode; onClear: () => void; canClear: boolean }) {
  return (
    <aside className="w-full shrink-0 rounded-3xl bg-[#f4f4f4] p-6 lg:w-80" aria-label={ts('browse.filters', 'Filters')}>
      <div className="flex min-h-5 justify-end">
        {canClear && <button type="button" onClick={onClear} className="cursor-pointer border-0 bg-transparent p-0 text-[13px] font-normal text-[#b47a55]">{ts('browse.clearAll', 'Clear all')}</button>}
      </div>
      {children}
    </aside>
  );
}
