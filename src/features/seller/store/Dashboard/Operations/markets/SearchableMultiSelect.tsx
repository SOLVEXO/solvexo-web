import { useId, useMemo, useState } from 'react';
import { X } from 'lucide-react';

export interface MultiOption { value: string; label: string }

interface Props {
  legend: string;
  options: MultiOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  searchPlaceholder?: string;
  hint?: string;
  error?: string;
  emptyText?: string;
}

/** Searchable checkbox list with removable chips: used for countries and languages. */
export function SearchableMultiSelect({ legend, options, selected, onChange, searchPlaceholder = 'Search', hint, error, emptyText = 'Nothing selected' }: Props) {
  const [q, setQ] = useState('');
  const searchId = useId();
  const labelOf = useMemo(() => new Map(options.map(o => [o.value, o.label])), [options]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? options.filter(o => o.label.toLowerCase().includes(needle) || o.value.toLowerCase() === needle) : options;
  }, [options, q]);
  const set = useMemo(() => new Set(selected), [selected]);

  const toggle = (v: string) => onChange(set.has(v) ? selected.filter(s => s !== v) : [...selected, v]);

  return (
    <fieldset className="m-0 p-0 border-0 min-w-0">
      <legend className="block text-[12px] font-medium text-charcoal mb-1.5 p-0">{legend}</legend>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px]" aria-live="polite">
        {selected.length === 0 && <span className="text-[12px] text-slate">{emptyText}</span>}
        {selected.map(v => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full bg-brand-pale-orange text-brand-deep-orange text-[11.5px] font-medium pl-2.5 pr-1 py-0.5">
            {labelOf.get(v) ?? v}
            <button type="button" onClick={() => toggle(v)} aria-label={`Remove ${labelOf.get(v) ?? v}`} className="bg-transparent border-0 cursor-pointer p-0.5 text-current flex">
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <label htmlFor={searchId} className="sr-only">{searchPlaceholder}</label>
      <input
        id={searchId}
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder={searchPlaceholder}
        className="w-full py-[8px] px-3 rounded-md border border-bone bg-white text-[13px] text-charcoal outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10"
      />
      <ul className="m-0 mt-1.5 p-0 list-none max-h-[180px] overflow-y-auto rounded-md border border-bone bg-white">
        {shown.length === 0 && <li className="px-3 py-2 text-[12px] text-slate">No matches</li>}
        {shown.map(o => (
          <li key={o.value}>
            <label className="flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-charcoal cursor-pointer hover:bg-cream">
              <input type="checkbox" checked={set.has(o.value)} onChange={() => toggle(o.value)} />
              <span className="flex-1 min-w-0 truncate">{o.label}</span>
              <span className="text-[11px] text-slate font-mono">{o.value}</span>
            </label>
          </li>
        ))}
      </ul>
      {hint && !error && <p className="mt-1 text-[11px] text-slate">{hint}</p>}
      {error && <p role="alert" className="mt-1 text-[11px] text-error">{error}</p>}
    </fieldset>
  );
}
