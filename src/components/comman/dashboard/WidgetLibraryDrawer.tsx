import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';
import type { DashboardLayoutApi } from './useDashboardLayout';
import type { DashboardWidgetDef } from './dashboardTypes';

interface Props {
  defs: DashboardWidgetDef[];
  layout: DashboardLayoutApi;
  onClose: () => void;
}

/** Searchable widget library. A widget already on the dashboard shows "Added"; one that is only hidden can be shown again. */
export function WidgetLibraryDrawer({ defs, layout, onClose }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = new Map<string, DashboardWidgetDef[]>();
    for (const d of defs) {
      if (q && !`${d.title} ${d.description} ${d.category}`.toLowerCase().includes(q)) continue;
      map.set(d.category, [...(map.get(d.category) ?? []), d]);
    }
    return [...map.entries()];
  }, [defs, query]);

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label="Add widgets">
      <button type="button" aria-label="Close widget library" className="absolute inset-0 bg-black/30 border-0 cursor-default" onClick={onClose} />
      <aside className="relative w-full max-w-[400px] h-full bg-white border-l border-bone flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-bone shrink-0">
          <p className="text-[15px] font-semibold text-carbon">Add widgets</p>
          <button type="button" onClick={onClose} aria-label="Close" className="size-8 inline-flex items-center justify-center rounded-lg border-0 bg-transparent text-slate hover:bg-fog cursor-pointer"><X size={16} /></button>
        </div>
        <div className="px-5 py-3 border-b border-bone shrink-0">
          <label className="relative block">
            <span className="sr-only">Search widgets</span>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
            <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search widgets…"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-bone text-[13px] text-carbon bg-white" />
          </label>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {groups.length === 0 && <p className="text-[13px] text-slate text-center py-10">No widget matches “{query}”.</p>}
          {groups.map(([category, items]) => (
            <section key={category}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate mb-2">{category}</p>
              <ul className="flex flex-col gap-2 list-none p-0 m-0">
                {items.map(d => {
                  const placed = layout.widgets.find(w => w.id === d.id);
                  const onScreen = !!placed && placed.visible;
                  return (
                    <li key={d.id} className="flex items-start gap-3 rounded-xl border border-bone px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-carbon">{d.title}</p>
                        <p className="text-[12px] text-slate leading-snug">{d.description}</p>
                      </div>
                      {onScreen ? (
                        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-success shrink-0 mt-0.5"><Check size={13} /> Added</span>
                      ) : (
                        <button type="button" onClick={() => layout.add(d.id)}
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-bone bg-white text-[12px] font-semibold text-carbon hover:bg-fog cursor-pointer shrink-0">
                          <Plus size={12} /> {placed ? 'Show' : 'Add'}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}
