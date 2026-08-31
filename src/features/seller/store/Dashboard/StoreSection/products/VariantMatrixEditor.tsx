import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  buildCombinations, mergeExistingRows, blankVariantRow, MAX_OPTION_TYPES, MAX_VARIANT_COMBINATIONS,
  type OptionType, type VariantRow,
} from './variantMatrix';

const inp = 'w-full px-2.5 py-[7px] text-[12.5px] border border-bone rounded-md text-charcoal bg-white placeholder:text-[#b5b3ac] outline-none focus:border-brand-orange';

/**
 * The real variant matrix — this is what actually exposes the backend's
 * existing Size×Color-style variant support (`ProductVariantsService`,
 * `addPhysicalProduct`), which the seller-facing form never reached before.
 * Zero option types renders nothing — a seller who doesn't need variants
 * never sees this at all; the parent form falls back to its plain single
 * Price/Stock fields in that case (see `StoreAddProduct.tsx`).
 */
export function VariantMatrixEditor({
  optionTypes, onOptionTypesChange, rows, onRowsChange, currencySymbol,
}: {
  optionTypes: OptionType[];
  onOptionTypesChange: (next: OptionType[]) => void;
  rows: VariantRow[];
  onRowsChange: (next: VariantRow[]) => void;
  currencySymbol: string;
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

  const updateRow = (key: string, patch: Partial<VariantRow>) => {
    onRowsChange(rows.map(r => r.key === key ? { ...r, ...patch } : r));
  };

  const overCap = rows.length > MAX_VARIANT_COMBINATIONS;

  return (
    <div className="flex flex-col gap-4">
      {/* Option types */}
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
          Add up to {MAX_OPTION_TYPES} options (like Size or Color), each with its own values — every combination becomes its own variant with its own price, SKU, and stock.
        </p>
      </div>

      {/* Generated matrix */}
      {rows.length > 0 && (
        <div className="flex flex-col gap-2">
          {overCap && (
            <p className="text-[12px] text-red-500 font-medium">
              This would create {rows.length} variants — Solvexo supports up to {MAX_VARIANT_COMBINATIONS} per product. Remove some values before saving.
            </p>
          )}
          <div className="overflow-x-auto border border-bone rounded-lg">
            <table className="w-full text-[12.5px] border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-cream text-left">
                  <th className="px-3 py-2 font-semibold text-graphite">Variant</th>
                  <th className="px-3 py-2 font-semibold text-graphite">Price ({currencySymbol})</th>
                  <th className="px-3 py-2 font-semibold text-graphite">Compare-at</th>
                  <th className="px-3 py-2 font-semibold text-graphite">SKU</th>
                  <th className="px-3 py-2 font-semibold text-graphite">Barcode</th>
                  <th className="px-3 py-2 font-semibold text-graphite">Stock</th>
                  <th className="px-3 py-2 font-semibold text-graphite">Unlimited</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.key} className="border-t border-bone">
                    <td className="px-3 py-2 font-medium text-charcoal whitespace-nowrap">{row.options.map(o => o.value).join(' / ')}</td>
                    <td className="px-3 py-1.5"><input type="number" min="0" value={row.price} onChange={e => updateRow(row.key, { price: e.target.value })} className={inp} placeholder="0.00" /></td>
                    <td className="px-3 py-1.5"><input type="number" min="0" value={row.compareAtPrice} onChange={e => updateRow(row.key, { compareAtPrice: e.target.value })} className={inp} placeholder="0.00" /></td>
                    <td className="px-3 py-1.5"><input value={row.sku} onChange={e => updateRow(row.key, { sku: e.target.value })} className={inp} placeholder="Auto" /></td>
                    <td className="px-3 py-1.5"><input value={row.barcode} onChange={e => updateRow(row.key, { barcode: e.target.value })} className={inp} placeholder="Optional" /></td>
                    <td className="px-3 py-1.5"><input type="number" min="0" value={row.stock} disabled={row.unlimitedStock} onChange={e => updateRow(row.key, { stock: e.target.value })} className={inp} placeholder="0" /></td>
                    <td className="px-3 py-1.5 text-center">
                      <input type="checkbox" checked={row.unlimitedStock} onChange={e => updateRow(row.key, { unlimitedStock: e.target.checked })} className="cursor-pointer" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
