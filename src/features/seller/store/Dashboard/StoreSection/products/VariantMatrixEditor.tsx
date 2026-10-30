import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Toggle } from '@/components/comman/ui/Toggle';
import {
  buildCombinations, mergeExistingRows, blankVariantRow, MAX_OPTION_TYPES, MAX_VARIANT_COMBINATIONS,
  type OptionType, type VariantRow,
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
  optionTypes, onOptionTypesChange, rows, onRowsChange,
}: {
  optionTypes: OptionType[];
  onOptionTypesChange: (next: OptionType[]) => void;
  rows: VariantRow[];
  onRowsChange: (next: VariantRow[]) => void;
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
            {type.values.map((v, vi) => (
              <span key={v} className="bg-white border border-bone rounded-[6px] px-2 py-[3px] text-[12px] text-charcoal flex items-center gap-1">
                {v}
                <button type="button" onClick={() => removeValue(i, vi)} aria-label={`Remove ${v}`}
                  className="bg-transparent border-none cursor-pointer p-0 text-slate/60 text-[13px] leading-none hover:text-red-500">×</button>
              </span>
            ))}
          </div>
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

/** Pick which of the product's own photos a shopper sees when they choose this variant (Shopify: "assign image"). */
function VariantImagePicker({ images, value, onChange, label }: { images: string[]; value: string; onChange: (url: string) => void; label: string }) {
  if (images.length === 0) {
    return <span className="text-[11px] text-slate">Add product images first</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1" role="radiogroup" aria-label={`Image for ${label}`}>
      <button type="button" role="radio" aria-checked={!value} onClick={() => onChange('')}
        className={`h-8 px-2 text-[11px] rounded-md border cursor-pointer bg-white ${!value ? 'border-brand-orange text-brand-orange font-semibold' : 'border-bone text-slate'}`}>None</button>
      {images.map((src, i) => (
        <button key={src + i} type="button" role="radio" aria-checked={value === src} aria-label={`Use image ${i + 1} for ${label}`} onClick={() => onChange(src)}
          className={`size-8 p-0 overflow-hidden rounded-md border-2 cursor-pointer bg-white ${value === src ? 'border-brand-orange' : 'border-transparent'}`}>
          <img src={src} alt="" loading="lazy" className="size-full object-cover" />
        </button>
      ))}
    </div>
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
      {/* Phones: one labelled card per variant (a 7-column table can't fit). */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map(row => {
          const name = row.options.map(o => o.value).join(' / ');
          return (
            <div key={row.key} className="border border-bone rounded-lg p-3 bg-white">
              <p className="text-[13px] font-semibold text-charcoal mb-2 break-words">{name}</p>
              <div className="mb-2 flex flex-col gap-1 text-[11px] font-medium text-graphite">Image
                <VariantImagePicker images={productImages} value={row.image} onChange={image => updateRow(row.key, { image })} label={name} />
                <input value={row.video} onChange={e => updateRow(row.key, { video: e.target.value })} className={inp} placeholder="Video link (YouTube / Vimeo / uploaded)" aria-label="Video link for this variant" />
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
        <table className="w-full text-[12.5px] border-collapse" style={{ minWidth: 960 }}>
          <thead>
            <tr className="bg-cream text-left">
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
                <td className="px-3 py-2 font-medium text-charcoal break-words">{row.options.map(o => o.value).join(' / ')}</td>
                <td className="px-2 py-1.5"><div className="flex flex-col gap-1.5"><VariantImagePicker images={productImages} value={row.image} onChange={image => updateRow(row.key, { image })} label={row.options.map(o => o.value).join(' / ')} /><input value={row.video} onChange={e => updateRow(row.key, { video: e.target.value })} className={inp} placeholder="Video link (YouTube / Vimeo / uploaded)" aria-label="Video link for this variant" /></div></td>
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
