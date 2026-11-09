import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ts } from '@/utils/tStatic';

/** One collapsible filter group (accordion). */
export function LedupFilterGroup({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-stone-200/70 py-4">
      <button type="button" aria-expanded={open} onClick={() => setOpen(o => !o)} className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent p-0 text-start text-sm font-semibold text-stone-900">
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
    <label className="flex cursor-pointer items-center gap-2.5 text-xs text-stone-700">
      <input type="checkbox" checked={checked} onChange={onToggle} className="h-3.5 w-3.5 accent-[var(--ld-accent)]" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count != null && <span className="text-[11px] text-stone-400">{count}</span>}
    </label>
  );
}

export function LedupFilterShell({ children, onClear, canClear }: { children: ReactNode; onClear: () => void; canClear: boolean }) {
  return (
    <aside className="w-full shrink-0 md:w-64" aria-label={ts('browse.filters', 'Filters')}>
      <div className="flex items-center justify-between border-b border-stone-200/70 pb-3">
        <span className="text-sm font-bold text-stone-900">{ts('browse.filters', 'Filters')}</span>
        {canClear && <button type="button" onClick={onClear} className="cursor-pointer border-0 bg-transparent p-0 text-xs font-medium text-[var(--ld-accent)] underline">{ts('browse.clearAll', 'Clear all')}</button>}
      </div>
      {children}
    </aside>
  );
}
