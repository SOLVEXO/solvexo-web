import { useState, type ReactNode } from 'react';
import { ImagePlus, Plus, Trash2 } from 'lucide-react';
import { colorForValue, isColorOptionName } from '@/features/storefront-themes/core/product/variantOptions';
import { Toggle } from '@/components/comman/ui/Toggle';
import {
  buildCombinations, mergeExistingRows, blankVariantRow, MAX_OPTION_TYPES, MAX_VARIANT_COMBINATIONS,
  setSwatchColor, type OptionSwatch, type OptionType, type VariantRow,
} from './variantMatrix';
import { groupValue, photoOptionName, rowName } from './variantPhotos';
import { VariantPhotosScreen } from './VariantPhotosScreen';
import { ColorField } from '@/components/comman/ui';

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
                    <ColorField compact value={chosen || colorForValue(v) || '#cccccc'} onChange={e => onSwatchesChange(setSwatchColor(swatches, type.name, v, e.target.value))} aria-label={`Swatch colour for ${v}`} />
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

/** Little photo stack on a variant: up to 4 thumbnails + "+N", or a dashed "Add photos" placeholder. One tap opens the Photos screen. */
function PhotoStrip({ urls, label, onOpen, big = false, hasVideo = false }: { urls: string[]; label: string; onOpen: () => void; big?: boolean; hasVideo?: boolean }) {
  const size = big ? 'size-12' : 'size-10';
  return (
    <button type="button" onClick={onOpen} aria-label={`${urls.length ? `${urls.length} photos for` : 'Add photos for'} ${label}. Open photos`}
      className="flex cursor-pointer items-center gap-2 rounded-lg border border-bone bg-white py-1 pl-1 pr-3 hover:border-brand-orange">
      {urls.length === 0 ? (
        <span className={`${size} flex items-center justify-center rounded-md border border-dashed border-slate/50 text-slate`}><ImagePlus size={16} /></span>
      ) : (
        <span className="flex">
          {urls.slice(0, 4).map((u, i) => (
            <img key={u + i} src={u} alt="" loading="lazy" className={`${size} -ml-3 rounded-md border-2 border-white object-cover first:ml-0`} style={{ zIndex: 5 - i }} />
          ))}
        </span>
      )}
      <span className="text-left text-[12px] font-semibold leading-tight text-charcoal">
        {urls.length === 0 ? 'Add photos' : `${urls.length} ${urls.length === 1 ? 'photo' : 'photos'}`}{hasVideo ? ' + video' : ''}
        <span className="block text-[11px] font-normal text-brand-orange">{urls.length === 0 ? 'Photos or video' : 'Change'}</span>
      </span>
    </button>
  );
}

const cellInput = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white placeholder:text-[#b5b3ac] outline-none focus:border-brand-orange';

export function VariantTableEditor({
  rows, onRowsChange, currencySymbol, productImages = [], onProductImagesChange, storeId,
}: {
  rows: VariantRow[];
  onRowsChange: (next: VariantRow[]) => void;
  currencySymbol: string;
  /** The product's own photos (first step of the form) the seller can assign to a variant. */
  productImages?: string[];
  /** Lets photos uploaded inside a variant also join the product gallery. */
  onProductImagesChange?: (next: string[]) => void;
  /** Needed to upload straight from a variant (same Files Library as the product gallery). */
  storeId?: string;
}) {
  const [photosFor, setPhotosFor] = useState<string | null>(null);
  const updateRow = (key: string, patch: Partial<VariantRow>) => {
    onRowsChange(rows.map(r => r.key === key ? { ...r, ...patch } : r));
  };
  const optionName = photoOptionName(rows);
  // Groups (all sizes of one colour) get ONE photo header; with one variant per colour every row carries its own photos.
  const groups: { value: string | null; rows: VariantRow[] }[] = [];
  for (const r of rows) {
    const v = groupValue(r, optionName);
    const g = groups.find(x => x.value === v);
    if (g) g.rows.push(r); else groups.push({ value: v, rows: [r] });
  }
  const grouped = !!optionName && groups.some(g => g.rows.length > 1);
  const overCap = rows.length > MAX_VARIANT_COMBINATIONS;

  if (rows.length === 0) {
    return (
      <p className="text-[12.5px] text-slate leading-[1.5]">
        No variants generated yet — go back to the previous step and add at least one option value first.
      </p>
    );
  }

  if (photosFor) {
    return (
      <VariantPhotosScreen
        rows={rows} onRowsChange={onRowsChange} rowKey={photosFor} optionName={optionName}
        productImages={productImages} onProductImagesChange={onProductImagesChange} storeId={storeId}
        onBack={() => setPhotosFor(null)}
      />
    );
  }

  const photosOf = (r: VariantRow) => r.images.filter(u => productImages.includes(u));

  const fields = (row: VariantRow, name: string) => (
    <>
      <td className="px-2 py-2"><input type="number" min="0" value={row.price} onChange={e => updateRow(row.key, { price: e.target.value })} className={cellInput} placeholder="0.00" aria-label={`Price for ${name}`} /></td>
      <td className="px-2 py-2"><input type="number" min="0" value={row.compareAtPrice} onChange={e => updateRow(row.key, { compareAtPrice: e.target.value })} className={cellInput} placeholder="0.00" aria-label={`Compare-at price for ${name}`} /></td>
      <td className="px-2 py-2"><input value={row.sku} onChange={e => updateRow(row.key, { sku: e.target.value })} className={cellInput} placeholder="Auto" aria-label={`SKU for ${name}`} /></td>
      <td className="px-2 py-2"><input value={row.barcode} onChange={e => updateRow(row.key, { barcode: e.target.value })} className={cellInput} placeholder="Optional" aria-label={`Barcode for ${name}`} /></td>
      <td className="px-2 py-2"><input type="number" min="0" value={row.stock} disabled={row.unlimitedStock} onChange={e => updateRow(row.key, { stock: e.target.value })} className={`${cellInput} disabled:bg-cream disabled:text-slate`} placeholder="0" aria-label={`Stock for ${name}`} /></td>
      <td className="px-2 py-2 text-center"><Toggle checked={row.unlimitedStock} size="sm" onChange={v => updateRow(row.key, { unlimitedStock: v })} ariaLabel={`Unlimited stock for ${name}`} /></td>
    </>
  );

  return (
    <div className="flex flex-col gap-3">
      {overCap && (
        <p className="text-[12px] text-red-500 font-medium">
          This would create {rows.length} variants — Solvexo supports up to {MAX_VARIANT_COMBINATIONS} per product. Go back and remove some values before saving.
        </p>
      )}
      <div className="rounded-lg border border-bone bg-cream/60 px-3 py-2.5 text-[12.5px] text-charcoal">
        <b>{rows.length} {rows.length === 1 ? 'variant' : 'variants'}.</b>{' '}
        {grouped
          ? <>Photos are set once per {optionName?.toLowerCase()}: tap <b>Add photos</b> on a {optionName?.toLowerCase()} and upload or choose its photos. They apply to every size of it.</>
          : <>Tap <b>Add photos</b> on a variant to upload or choose the photos shoppers see when they pick it.</>}
      </div>

      {/* Phones: one labelled card per variant (a 7-column table can't fit). */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map(row => {
          const name = rowName(row);
          return (
            <div key={row.key} className="rounded-xl border border-bone bg-white p-3">
              <p className="mb-2 break-words text-[14px] font-semibold text-charcoal">{name}</p>
              <div className="mb-3"><PhotoStrip urls={photosOf(row)} label={name} onOpen={() => setPhotosFor(row.key)} hasVideo={!!row.video} /></div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                <label className="flex flex-col gap-1 text-[11px] font-medium text-graphite">Price ({currencySymbol})
                  <input type="number" inputMode="decimal" min="0" value={row.price} onChange={e => updateRow(row.key, { price: e.target.value })} className={cellInput} placeholder="0.00" />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-medium text-graphite">Compare-at
                  <input type="number" inputMode="decimal" min="0" value={row.compareAtPrice} onChange={e => updateRow(row.key, { compareAtPrice: e.target.value })} className={cellInput} placeholder="0.00" />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-medium text-graphite">SKU
                  <input value={row.sku} onChange={e => updateRow(row.key, { sku: e.target.value })} className={cellInput} placeholder="Auto" />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-medium text-graphite">Barcode
                  <input value={row.barcode} onChange={e => updateRow(row.key, { barcode: e.target.value })} className={cellInput} placeholder="Optional" />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-medium text-graphite">Stock
                  <input type="number" inputMode="numeric" min="0" value={row.stock} disabled={row.unlimitedStock} onChange={e => updateRow(row.key, { stock: e.target.value })} className={`${cellInput} disabled:bg-cream disabled:text-slate`} placeholder="0" />
                </label>
                <div className="flex flex-col gap-1 text-[11px] font-medium text-graphite">Unlimited
                  <div className="flex h-[38px] items-center">
                    <Toggle checked={row.unlimitedStock} size="sm" onChange={v => updateRow(row.key, { unlimitedStock: v })} ariaLabel={`Unlimited stock for ${name}`} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tablet/desktop */}
      <div className="hidden overflow-x-auto rounded-xl border border-bone sm:block">
        <table className="w-full border-collapse text-[13px]" style={{ minWidth: grouped ? 900 : 1040 }}>
          <thead>
            <tr className="bg-cream text-left">
              <th className="px-4 py-2.5 font-semibold text-graphite" style={{ minWidth: 150 }}>Variant</th>
              {!grouped && <th className="px-2 py-2.5 font-semibold text-graphite" style={{ minWidth: 170 }}>Photos</th>}
              <th className="whitespace-nowrap px-2 py-2.5 font-semibold text-graphite" style={{ minWidth: 120 }}>Price ({currencySymbol})</th>
              <th className="whitespace-nowrap px-2 py-2.5 font-semibold text-graphite" style={{ minWidth: 120 }}>Compare-at</th>
              <th className="px-2 py-2.5 font-semibold text-graphite" style={{ minWidth: 130 }}>SKU</th>
              <th className="px-2 py-2.5 font-semibold text-graphite" style={{ minWidth: 120 }}>Barcode</th>
              <th className="px-2 py-2.5 font-semibold text-graphite" style={{ minWidth: 100 }}>Stock</th>
              <th className="whitespace-nowrap px-2 py-2.5 text-center font-semibold text-graphite" style={{ minWidth: 90 }}>Unlimited</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(g => (
              <GroupRows key={g.value ?? 'all'} header={grouped ? (
                <tr className="border-t border-bone bg-cream/70">
                  <td colSpan={7} className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[13.5px] font-semibold text-charcoal">{g.value}</span>
                      <span className="text-[11.5px] text-slate">{g.rows.length} {g.rows.length === 1 ? 'variant' : 'variants'}</span>
                      <PhotoStrip urls={photosOf(g.rows[0])} label={String(g.value)} onOpen={() => setPhotosFor(g.rows[0].key)} big hasVideo={!!g.rows[0].video} />
                    </div>
                  </td>
                </tr>
              ) : null}>
                {g.rows.map(row => {
                  const name = rowName(row);
                  return (
                    <tr key={row.key} className="border-t border-bone">
                      <td className={`px-4 py-2 font-medium text-charcoal break-words ${grouped ? 'pl-8' : ''}`}>{name}</td>
                      {!grouped && <td className="px-2 py-2"><PhotoStrip urls={photosOf(row)} label={name} onOpen={() => setPhotosFor(row.key)} hasVideo={!!row.video} /></td>}
                      {fields(row, name)}
                    </tr>
                  );
                })}
              </GroupRows>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Renders an optional group header row followed by the group's variant rows (a fragment, so the table markup stays valid). */
function GroupRows({ header, children }: { header: ReactNode; children: ReactNode }) {
  return <>{header}{children}</>;
}
