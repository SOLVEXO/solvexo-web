import { useState, useEffect } from 'react';
import { apiGetCustomLevelSuggestions } from '@/api/services/product';

/** Debounced autocomplete for the "Other" custom education level — shared by
 *  StoreAddProduct and StoreEditProduct. Nudges reuse of existing labels
 *  without forcing them; normalization always happens server-side regardless. */
export function CustomLevelInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [focused, setFocused]         = useState(false);

  useEffect(() => {
    if (!value.trim()) { setSuggestions([]); return; }
    let cancelled = false;
    const id = setTimeout(() => {
      apiGetCustomLevelSuggestions(value)
        .then(res => { if (!cancelled) setSuggestions(res.data ?? []); })
        .catch(() => { if (!cancelled) setSuggestions([]); });
    }, 300);
    return () => { cancelled = true; clearTimeout(id); };
  }, [value]);

  return (
    <div className="relative">
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 120)}
        placeholder="e.g. Hifz Course, O-Level, Matric, IB…"
        className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white placeholder:text-[#B5B3AC] outline-none"
      />
      {focused && suggestions.length > 0 && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-bone rounded-lg overflow-hidden">
          {suggestions.map(s => (
            <button key={s} type="button" onMouseDown={() => onChange(s)}
              className="w-full text-left px-3 py-2 text-[12px] text-charcoal bg-transparent border-none cursor-pointer hover:bg-cream">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
