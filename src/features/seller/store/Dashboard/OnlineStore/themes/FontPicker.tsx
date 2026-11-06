import { Check, ChevronDown, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FONT_CATALOG, ensureFontPreview, ensureGoogleFont, findCatalogFont, type FontGroup } from '@/utils/googleFonts';

const GROUPS: ('All' | FontGroup)[] = ['All', 'Sans', 'Serif', 'Display', 'Handwriting', 'Mono', 'Urdu & Arabic'];
/** Fonts already on every page: previews are free for these. */
const BUILT_IN_PREVIEW = new Set(['Inter', 'Poppins', 'Roboto', 'Montserrat', 'DM Sans', 'Nunito', 'Space Grotesk', 'Playfair Display', 'Fraunces', 'Lora']);
const PAGE = 40;

function previewFamily(name: string): string {
  return `'${name}', sans-serif`;
}

/** Shopify-style font picker: search, group chips, every font shown in its own face. `defaultLabel` adds a "Theme default" row (value ''). */
export function FontPicker({ value, onChange, defaultLabel, inputClass }: {
  value: string;
  onChange: (next: string) => void;
  defaultLabel?: string;
  inputClass: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<'All' | FontGroup>('All');
  const [shown, setShown] = useState(PAGE);
  const box = useRef<HTMLDivElement>(null);

  // The chosen font must show in the editor preview right away, not only after publishing.
  useEffect(() => { ensureGoogleFont(value); }, [value]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return FONT_CATALOG.filter(f => (group === 'All' || f.group === group) && (!term || f.name.toLowerCase().includes(term) || f.group.toLowerCase().includes(term)));
  }, [q, group]);
  const visible = results.slice(0, shown);

  // Load a tiny preview (just the letters of the name) only for rows on screen.
  useEffect(() => {
    if (!open) return;
    visible.forEach(f => { if (!BUILT_IN_PREVIEW.has(f.name)) ensureFontPreview(f.name); });
  }, [open, visible]);

  const current = findCatalogFont(value);
  const label = current ? current.name : value && !defaultLabel ? value : (defaultLabel ?? 'Choose a font');

  const pick = (next: string) => { onChange(next); setOpen(false); };

  return (
    <div ref={box} className="relative">
      <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(o => !o)}
        className={`${inputClass} flex items-center justify-between gap-2 text-left cursor-pointer`}
        style={current ? { fontFamily: previewFamily(current.name) } : undefined}>
        <span className="truncate">{label}</span>
        <ChevronDown size={15} className="shrink-0 text-slate" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 rounded-xl border border-bone bg-white p-2 shadow-lg">
          <div className="relative mb-2">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate" />
            <input autoFocus value={q} onChange={e => { setQ(e.target.value); setShown(PAGE); }} placeholder="Search fonts (e.g. serif, Urdu, Poppins)"
              aria-label="Search fonts" className={`${inputClass} pl-8`} />
          </div>
          <div className="mb-2 flex flex-wrap gap-1">
            {GROUPS.map(g => (
              <button key={g} type="button" onClick={() => { setGroup(g); setShown(PAGE); }}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${group === g ? 'border-charcoal bg-charcoal text-white' : 'border-bone bg-white text-charcoal'}`}>{g}</button>
            ))}
          </div>
          <ul role="listbox" className="m-0 max-h-72 list-none overflow-y-auto p-0">
            {defaultLabel && !q && group === 'All' && (
              <li role="option" aria-selected={value === ''}>
                <button type="button" onClick={() => pick('')} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] text-charcoal hover:bg-cream cursor-pointer">
                  <span>{defaultLabel}</span>{value === '' && <Check size={14} />}
                </button>
              </li>
            )}
            {visible.map(f => (
              <li key={f.name} role="option" aria-selected={value === f.name}>
                <button type="button" onClick={() => pick(f.name)} className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[16px] text-charcoal hover:bg-cream cursor-pointer"
                  style={{ fontFamily: previewFamily(f.name) }}>
                  <span className="truncate">{f.name}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-sans text-[10px] uppercase tracking-wide text-slate">{f.group}</span>
                    {value === f.name && <Check size={14} />}
                  </span>
                </button>
              </li>
            ))}
            {results.length === 0 && <li className="px-2.5 py-3 text-[12.5px] text-slate">No font found. Try another name.</li>}
            {results.length > shown && (
              <li><button type="button" onClick={() => setShown(n => n + PAGE)} className="w-full rounded-lg px-2.5 py-2 text-center text-[12.5px] font-semibold text-charcoal hover:bg-cream cursor-pointer">Show more fonts</button></li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
