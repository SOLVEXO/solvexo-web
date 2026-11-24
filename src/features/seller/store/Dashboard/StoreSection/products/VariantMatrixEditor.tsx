import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2 } from 'lucide-react';
import { colorForValue, isColorOptionName } from '@/features/storefront-themes/core/product/variantOptions';
import { Toggle } from '@/components/comman/ui/Toggle';
import {
  buildCombinations, mergeExistingRows, blankVariantRow, MAX_OPTION_TYPES, MAX_VARIANT_COMBINATIONS,
  setSwatchColor, type OptionSwatch, type OptionType, type VariantRow,
} from './variantMatrix';

const inp = 'w-full px-2.5 py-[7px] text-[12.5px] border border-bone rounded-md text-charcoal bg-white placeholder:text-[#b5b3ac] outline-none focus:border-brand-orange';

/**
 * The real variant matrix — this is what actually exposes the backend's
 * existing Size×Color-style variant support (`ProductVariantsService`,
 * `addPhysicalProduct`), which the seller-facing form never reached before.
 *
 * Split into two components — `VariantOptionsEditor` (build the option
 * types/values, e.g. Size: S/M/L) and `VariantTableEditor` (set
 * price/SKU/stock per generated combination) — so the product form's
 * "Manage Variants" modal can present them as two wizard steps instead of
 * one long scroll (confirmed confusing when it was a single view). Both
 * still share the same `optionTypes`/`rows` state and the same
 * regenerate-without-losing-existing-row-data logic from `variantMatrix.ts`.
 */
export function VariantOptionsEditor({
  optionTypes, onOptionTypesChange, rows, onRowsChange, swatches = [], onSwatchesChange,
}: {
  optionTypes: OptionType[];
  onOptionTypesChange: (next: OptionType[]) => void;
  rows: VariantRow[];
  onRowsChange: (next: VariantRow[]) => void;
  /** Colours the seller chose for option values (Shopify: the colour entry of a Color value). */
  swatches?: OptionSwatch[];
  onSwatchesChange?: (next: OptionSwatch[]) => void;
}) {
  const [newTypeName, setNewTypeName] = useState('');
  const [valueDrafts, setValueDrafts] = useState<Record<number, string>>({});

  const regenerate = (nextTypes: OptionType[]) => {
    onOptionTypesChange(nextTypes);
    const combos = buildCombinations(nextTypes);
    onRowsChange(mergeExistingRows(combos, rows, blankVariantRow));
  };

  const addOptionType = () => {
    const name = newTypeName.trim();
    if (!name || optionTypes.length >= MAX_OPTION_TYPES) return;
    if (optionTypes.some(t => t.name.toLowerCase() === name.toLowerCase())) return;
    regenerate([...optionTypes, { name, values: [] }]);
    setNewTypeName('');
  };

  const removeOptionType = (index: number) => {
    regenerate(optionTypes.filter((_, i) => i !== index));
  };

  const addValue = (typeIndex: number) => {
    const raw = (valueDrafts[typeIndex] ?? '').trim();
    if (!raw) return;
    const type = optionTypes[typeIndex];
    if (type.values.some(v => v.toLowerCase() === raw.toLowerCase())) {
      setValueDrafts(d => ({ ...d, [typeIndex]: '' }));
      return;
    }
    const nextTypes = optionTypes.map((t, i) => i === typeIndex ? { ...t, values: [...t.values, raw] } : t);
    regenerate(nextTypes);
    setValueDrafts(d => ({ ...d, [typeIndex]: '' }));
  };

  const removeValue = (typeIndex: number, valueIndex: number) => {
    const nextTypes = optionTypes.map((t, i) => i === typeIndex ? { ...t, values: t.values.filter((_, vi) => vi !== valueIndex) } : t);
    regenerate(nextTypes);
  };

  return (
    <div className="flex flex-col gap-3">
      {optionTypes.map((type, i) => (
        <div key={type.name} className="border border-bone rounded-lg p-3 bg-cream/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12.5px] font-semibold text-charcoal">{type.name}</span>
            <button type="button" onClick={() => removeOptionType(i)} aria-label={`Remove ${type.name}`}
              className="bg-transparent border-none cursor-pointer p-1 text-slate hover:text-red-500 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
          <div className="flex flex-wrap gap-[6px] mb-2">
            {type.values.map((v, vi) => {
              const chosen = swatches.find(s => s.option === type.name && s.value === v)?.color ?? '';
              return (
              <span key={v} className="bg-white border border-bone rounded-[6px] px-2 py-[3px] text-[12px] text-charcoal flex items-center gap-1">
                {onSwatchesChange && isColorOptionName(type.name) && (
                  <>
                    <input type="color" value={chosen || colorForValue(v) || '#cccccc'} onChange={e => onSwatchesChange(setSwatchColor(swatches, type.name, v, e.target.value))}
                      aria-label={`Swatch colour for ${v}`} title={chosen ? 'Swatch colour you chose' : 'Pick the swatch colour'} className="size-4 cursor-pointer border-0 bg-transparent p-0" />
                    {chosen && <button type="button" onClick={() => onSwatchesChange(setSwatchColor(swatches, type.name, v, ''))} aria-label={`Clear swatch colour for ${v}`} className="bg-transparent border-none cursor-pointer p-0 text-[10px] text-slate underline">reset</button>}
                  </>
                )}
                {v}
                <button type="button" onClick={() => removeValue(i, vi)} aria-label={`Remove ${v}`}
                  className="bg-transparent border-none cursor-pointer p-0 text-slate/60 text-[13px] leading-none hover:text-red-500">×</button>
              </span>
              );
            })}
          </div>
          {onSwatchesChange && isColorOptionName(type.name) && type.values.length > 0 && (
            <p className="text-[11px] text-slate mb-2">Click the small square beside a value to choose its swatch colour. This is the colour shoppers see on your store.</p>
          )}
          <div className="flex gap-2">
            <input
              value={valueDrafts[i] ?? ''}
              onChange={e => setValueDrafts(d => ({ ...d, [i]: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addValue(i); } }}
              placeholder={`Add a ${type.name.toLowerCase()} value and press Enter…`}
              className={inp}
            />
            <button type="button" onClick={() => addValue(i)} disabled={!(valueDrafts[i] ?? '').trim()}
              className="shrink-0 px-3 rounded-md border-none text-[12px] font-semibold cursor-pointer disabled:cursor-not-allowed"
              style={{ background: (valueDrafts[i] ?? '').trim() ? '#D97757' : '#E8E6DC', color: (valueDrafts[i] ?? '').trim() ? '#fff' : '#A8A6A0' }}>
              Add
            </button>
          </div>
        </div>
      ))}

      {optionTypes.length < MAX_OPTION_TYPES && (
        <div className="flex gap-2">
          <input
            value={newTypeName}
            onChange={e => setNewTypeName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOptionType(); } }}
            placeholder="e.g. Size, Color, Material"
            className={inp}
          />
          <button type="button" onClick={addOptionType} disabled={!newTypeName.trim()}
            className="shrink-0 flex items-center gap-1 px-3 rounded-md border-none text-[12px] font-semibold cursor-pointer disabled:cursor-not-allowed"
            style={{ background: newTypeName.trim() ? '#D97757' : '#E8E6DC', color: newTypeName.trim() ? '#fff' : '#A8A6A0' }}>
            <Plus size={13} /> Add Option
          </button>
        </div>
      )}
      <p className="text-[11px] text-slate">
        Add up to {MAX_OPTION_TYPES} options (like Size or Color), each with its own values — every combination becomes its own variant with its own price, SKU, and stock on the next step.
      </p>
    </div>
  );
}

/** Link product photos to a variant (Shopify: variant media). A photo can belong to several variants; the shopper sees these first, then the photos no variant claims.
 *  Works on a draft: toggling photos is free, "Done" (or closing) saves the choice. */
function VariantImagePicker({ images, value, onChange, label, triggerLabel }: { images: string[]; value: string[]; onChange: (urls: string[]) => void; label: string; /** A text button instead of the thumbnail (used by the bulk "Add images" bar). */ triggerLabel?: string }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const btn = useRef<HTMLButtonElement>(null);
  const draftRef = useRef<string[]>([]);
  draftRef.current = draft;
  const valueRef = useRef(value);
  valueRef.current = value;
  const close = useCallback((save: boolean) => {
    if (save) {
      const next = draftRef.current;
      const prev = valueRef.current;
      if (next.length !== prev.length || next.some((u, i) => u !== prev[i])) onChange(next);
    }
    setPos(null);
    btn.current?.focus();
  }, [onChange]);
  useEffect(() => {
    if (!pos) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(false); };
    const hide = () => setPos(null);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', hide);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('resize', hide); };
  }, [pos, close]);

  if (images.length === 0) return <span className="text-[11px] text-slate">Add product images first</span>;
  const open = () => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const width = 300;
    setDraft(value.filter(u => images.includes(u)));
    setPos({ top: Math.max(8, Math.min(r.bottom + 6, window.innerHeight - 340)), left: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)) });
  };
  const flip = (url: string) => setDraft(d => (d.includes(url) ? d.filter(u => u !== url) : [...d, url]));
  const shown = value.filter(u => images.includes(u));
  return (
    <>
      {triggerLabel ? (
        <button ref={btn} type="button" onClick={open} aria-haspopup="dialog" aria-expanded={!!pos}
          className="rounded-md border border-bone bg-white px-3 py-1.5 text-[12px] font-semibold text-charcoal cursor-pointer hover:border-brand-orange">{triggerLabel}</button>
      ) : (
      <button ref={btn} type="button" onClick={open} aria-haspopup="dialog" aria-expanded={!!pos} aria-label={`Images for ${label}: ${shown.length ? `${shown.length} linked, change` : 'choose'}`}
        className="relative size-10 p-0 overflow-visible rounded-md border border-bone bg-white cursor-pointer flex items-center justify-center text-[11px] text-slate hover:border-brand-orange">
        {shown.length ? <img src={shown[0]} alt="" className="size-full rounded-md object-cover" /> : <span>None</span>}
        {shown.length > 1 && <span className="absolute -right-1.5 -top-1.5 rounded-full bg-brand-orange px-1.5 text-[10px] font-semibold leading-4 text-white">{shown.length}</span>}
      </button>
      )}
      {pos && createPortal(
        <div className="fixed inset-0 z-[10050]">
          <button type="button" tabIndex={-1} aria-label="Close" onClick={() => close(true)} className="fixed inset-0 cursor-default border-0 bg-transparent p-0" />
          <div role="dialog" aria-label={`Choose images for ${label}`} style={{ top: pos.top, left: pos.left, width: 300 }}
            className="fixed rounded-lg border border-bone bg-white p-2">
            <div className="mb-2 flex items-center justify-between gap-2 text-[12px]">
              <span className="font-semibold text-charcoal">{draft.length} of {images.length} selected</span>
              <span className="flex gap-3">
                <button type="button" onClick={() => setDraft([...images])} className="bg-transparent border-none cursor-pointer p-0 text-slate underline">All</button>
                <button type="button" onClick={() => setDraft([])} className="bg-transparent border-none cursor-pointer p-0 text-slate underline">None</button>
              </span>
            </div>
            <div className="grid max-h-[260px] grid-cols-5 gap-1.5 overflow-y-auto" role="group" aria-label={`Images for ${label}`}>
              {images.map((src, i) => {
                const on = draft.includes(src);
                return (
                  <button key={src + i} type="button" aria-pressed={on} aria-label={`Image ${i + 1} for ${label}`} onClick={() => flip(src)}
                    className={`relative size-[52px] p-0 overflow-hidden rounded-md border-2 cursor-pointer bg-white ${on ? 'border-brand-orange' : 'border-transparent'}`}>
                    <img src={src} alt="" loading="lazy" className="size-full object-cover" />
                    {on && <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-brand-orange text-[10px] leading-none text-white">✓</span>}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => close(false)} className="rounded-md border border-bone bg-white px-3 py-1.5 text-[12px] text-charcoal cursor-pointer">Cancel</button>
              <button type="button" onClick={() => close(true)} className="rounded-md border-none bg-brand-orange px-3 py-1.5 text-[12px] font-semibold text-white cursor-pointer">Done</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

export function VariantTableEditor({
  rows, onRowsChange, currencySymbol, productImages = [],
}: {
  rows: VariantRow[];
  onRowsChange: (next: VariantRow[]) => void;
  currencySymbol: string;
  /** The product's own photos (first step of the form) the seller can assign to a variant. */
  productImages?: string[];
}) {
  const updateRow = (key: string, patch: Partial<VariantRow>) => {
    onRowsChange(rows.map(r => r.key === key ? { ...r, ...patch } : r));
  };
  // Shopify: tick variants (or a whole Color value), then "Add images" links the chosen photos to every ticked variant.
  const [ticked, setTicked] = useState<string[]>([]);
  const live = ticked.filter(k => rows.some(r => r.key === k));
  const toggle = (key: string) => setTicked(t => (t.includes(key) ? t.filter(k => k !== key) : [...t, key]));
  const allTicked = rows.length > 0 && live.length === rows.length;
  const addImages = (urls: string[]) => onRowsChange(rows.map(r => (live.includes(r.key) ? { ...r, images: [...r.images, ...urls.filter(u => !r.images.includes(u))] } : r)));
  const clearImages = () => onRowsChange(rows.map(r => (live.includes(r.key) ? { ...r, images: [] } : r)));
  // one chip per option value (Color: Black ...): ticks every variant that has it, so all sizes of a colour get the same photos
  const valueChips = Array.from(new Map(rows.flatMap(r => r.options.map(o => [`${o.name}\u0000${o.value}`, o] as const))).values());
  const optionNames = Array.from(new Set(valueChips.map(o => o.name)));
  const tickValue = (name: string, value: string) => {
    const keys = rows.filter(r => r.options.some(o => o.name === name && o.value === value)).map(r => r.key);
    setTicked(keys);
  };
  const bulkBar = productImages.length > 0 && (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-bone bg-cream/60 px-3 py-2">
      <label className="flex items-center gap-2 text-[12px] font-medium text-charcoal cursor-pointer">
        <input type="checkbox" checked={allTicked} onChange={() => setTicked(allTicked ? [] : rows.map(r => r.key))} aria-label="Select all variants" />
        {live.length > 0 ? `${live.length} selected` : 'Select variants'}
      </label>
      {live.length > 0 && (
        <>
          <VariantImagePicker images={productImages} value={[]} onChange={addImages} label={`${live.length} selected variants`} triggerLabel="Link images" />
          <button type="button" onClick={clearImages} className="bg-transparent border-none cursor-pointer text-[12px] text-slate underline">Remove images</button>
        </>
      )}
      {optionNames.length > 0 && rows.length > 1 && (
        <div className="flex w-full flex-wrap items-center gap-1.5 text-[11px] text-slate">
          <span>Select all variants with:</span>
          {valueChips.map(o => (
            <button key={o.name + o.value} type="button" onClick={() => tickValue(o.name, o.value)} title={`Select every variant with ${o.name}: ${o.value}`}
              className="rounded-full border border-bone bg-white px-2 py-0.5 text-[11px] text-charcoal cursor-pointer hover:border-brand-orange">{o.value}</button>
          ))}
        </div>
      )}
    </div>
  );

  const overCap = rows.length > MAX_VARIANT_COMBINATIONS;

  if (rows.length === 0) {
    return (
      <p className="text-[12.5px] text-slate leading-[1.5]">
        No variants generated yet — go back to the previous step and add at least one option value first.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {overCap && (
        <p className="text-[12px] text-red-500 font-medium">
          This would create {rows.length} variants — Solvexo supports up to {MAX_VARIANT_COMBINATIONS} per product. Go back and remove some values before saving.
        </p>
      )}
      {bulkBar}
      {/* Phones: one labelled card per variant (a 7-column table can't fit). */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map(row => {
          const name = row.options.map(o => o.value).join(' / ');
          return (
            <div key={row.key} className="border border-bone rounded-lg p-3 bg-white">
              <label className="mb-2 flex items-start gap-2 text-[13px] font-semibold text-charcoal break-words cursor-pointer"><input type="checkbox" className="mt-1" checked={live.includes(row.key)} onChange={() => toggle(row.key)} aria-label={`Select ${name}`} />{name}</label>
              <div className="mb-2 flex flex-col gap-1 text-[11px] font-medium text-graphite">Image
                <VariantImagePicker images={productImages} value={row.images} onChange={images => updateRow(row.key, { images })} label={name} />
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                <label className="flex flex-col gap-1 text-[11px] font-medium text-graphite">Price ({currencySymbol})
                  <input type="number" inputMode="decimal" min="0" value={row.price} onChange={e => updateRow(row.key, { price: e.target.value })} className={inp} placeholder="0.00" />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-medium text-graphite">Compare-at
                  <input type="number" inputMode="decimal" min="0" value={row.compareAtPrice} onChange={e => updateRow(row.key, { compareAtPrice: e.target.value })} className={inp} placeholder="0.00" />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-medium text-graphite">SKU
                  <input value={row.sku} onChange={e => updateRow(row.key, { sku: e.target.value })} className={inp} placeholder="Auto" />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-medium text-graphite">Barcode
                  <input value={row.barcode} onChange={e => updateRow(row.key, { barcode: e.target.value })} className={inp} placeholder="Optional" />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-medium text-graphite">Stock
                  <input type="number" inputMode="numeric" min="0" value={row.stock} disabled={row.unlimitedStock} onChange={e => updateRow(row.key, { stock: e.target.value })} className={`${inp} disabled:bg-cream disabled:text-slate`} placeholder="0" />
                </label>
                <div className="flex flex-col gap-1 text-[11px] font-medium text-graphite">Unlimited
                  <div className="h-[34px] flex items-center">
                    <Toggle checked={row.unlimitedStock} size="sm" onChange={v => updateRow(row.key, { unlimitedStock: v })} ariaLabel={`Unlimited stock for ${name}`} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tablet/desktop: table with fixed column minimums so Price/Stock never collapse; scrolls sideways only if the modal is narrower than the table. */}
      <div className="hidden sm:block overflow-x-auto border border-bone rounded-lg">
        <table className="w-full text-[12.5px] border-collapse" style={{ minWidth: 990 }}>
          <thead>
            <tr className="bg-cream text-left">
              <th className="w-8 px-2 py-2"><span className="sr-only">Select</span></th>
              <th className="px-3 py-2 font-semibold text-graphite" style={{ minWidth: 170 }}>Variant</th>
              <th className="px-2 py-2 font-semibold text-graphite" style={{ minWidth: 150 }}>Image</th>
              <th className="px-2 py-2 font-semibold text-graphite whitespace-nowrap" style={{ minWidth: 110 }}>Price ({currencySymbol})</th>
              <th className="px-2 py-2 font-semibold text-graphite whitespace-nowrap" style={{ minWidth: 110 }}>Compare-at</th>
              <th className="px-2 py-2 font-semibold text-graphite" style={{ minWidth: 120 }}>SKU</th>
              <th className="px-2 py-2 font-semibold text-graphite" style={{ minWidth: 120 }}>Barcode</th>
              <th className="px-2 py-2 font-semibold text-graphite" style={{ minWidth: 90 }}>Stock</th>
              <th className="px-2 py-2 font-semibold text-graphite whitespace-nowrap text-center" style={{ minWidth: 80 }}>Unlimited</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.key} className="border-t border-bone">
                <td className="w-8 px-2 py-2"><input type="checkbox" checked={live.includes(row.key)} onChange={() => toggle(row.key)} aria-label={`Select ${row.options.map(o => o.value).join(' / ')}`} /></td>
                <td className="px-3 py-2 font-medium text-charcoal break-words">{row.options.map(o => o.value).join(' / ')}</td>
                <td className="px-2 py-1.5"><div className="flex flex-col gap-1.5"><VariantImagePicker images={productImages} value={row.images} onChange={images => updateRow(row.key, { images })} label={row.options.map(o => o.value).join(' / ')} /></div></td>
                <td className="px-2 py-1.5"><input type="number" min="0" value={row.price} onChange={e => updateRow(row.key, { price: e.target.value })} className={inp} placeholder="0.00" aria-label="Price" /></td>
                <td className="px-2 py-1.5"><input type="number" min="0" value={row.compareAtPrice} onChange={e => updateRow(row.key, { compareAtPrice: e.target.value })} className={inp} placeholder="0.00" aria-label="Compare-at price" /></td>
                <td className="px-2 py-1.5"><input value={row.sku} onChange={e => updateRow(row.key, { sku: e.target.value })} className={inp} placeholder="Auto" aria-label="SKU" /></td>
                <td className="px-2 py-1.5"><input value={row.barcode} onChange={e => updateRow(row.key, { barcode: e.target.value })} className={inp} placeholder="Optional" aria-label="Barcode" /></td>
                <td className="px-2 py-1.5"><input type="number" min="0" value={row.stock} disabled={row.unlimitedStock} onChange={e => updateRow(row.key, { stock: e.target.value })} className={`${inp} disabled:bg-cream disabled:text-slate`} placeholder="0" aria-label="Stock" /></td>
                <td className="px-2 py-1.5 text-center">
                  <Toggle
                    checked={row.unlimitedStock} size="sm"
                    onChange={v => updateRow(row.key, { unlimitedStock: v })}
                    ariaLabel={`Unlimited stock for ${row.options.map(o => o.value).join(' / ')}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
