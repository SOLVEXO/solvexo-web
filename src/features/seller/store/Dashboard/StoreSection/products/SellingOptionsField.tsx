import { Field, Input, Toggle } from '@/components/comman/ui';
import type { ProductSellingOptions } from '@/api/services/product';

/** Form-state shape (strings so inputs stay editable); `sellingOptionsPayload` turns it into the API fields. */
export interface SellingOptionsForm {
  vendor: string; cardBadgeText: string; cardBadgeColor: string; orderMin: string; orderMax: string; orderStep: string; preorder: boolean; preorderOn: string;
}

export const initSellingOptions: SellingOptionsForm = { vendor: '', cardBadgeText: '', cardBadgeColor: '', orderMin: '', orderMax: '', orderStep: '', preorder: false, preorderOn: '' };

export function sellingOptionsFromProduct(p: { vendor?: string; cardBadgeText?: string; cardBadgeColor?: string; orderMinQuantity?: number; orderMaxQuantity?: number | null; orderQuantityStep?: number; preorder?: { enabled: boolean; availableOn: string | null } }): SellingOptionsForm {
  return {
    vendor: p.vendor ?? '',
    cardBadgeText: p.cardBadgeText ?? '',
    cardBadgeColor: p.cardBadgeColor ?? '',
    orderMin: p.orderMinQuantity && p.orderMinQuantity > 1 ? String(p.orderMinQuantity) : '',
    orderMax: p.orderMaxQuantity ? String(p.orderMaxQuantity) : '',
    orderStep: p.orderQuantityStep && p.orderQuantityStep > 1 ? String(p.orderQuantityStep) : '',
    preorder: !!p.preorder?.enabled,
    preorderOn: p.preorder?.availableOn ? p.preorder.availableOn.slice(0, 10) : '',
  };
}

export function sellingOptionsPayload(f: SellingOptionsForm): ProductSellingOptions {
  const n = (v: string) => (v.trim() === '' ? null : Number(v));
  return {
    vendor: f.vendor.trim(),
    cardBadgeText: f.cardBadgeText.trim(),
    cardBadgeColor: f.cardBadgeText.trim() ? f.cardBadgeColor : '',
    orderMinQuantity: n(f.orderMin) ?? 1,
    orderMaxQuantity: n(f.orderMax),
    orderQuantityStep: n(f.orderStep) ?? 1,
    preorder: { enabled: f.preorder, availableOn: f.preorder && f.preorderOn ? f.preorderOn : null },
  };
}

const BADGE_COLORS = [
  { key: 'accent', label: 'Store accent', swatch: '#6B7280' },
  { key: 'dark', label: 'Dark', swatch: '#111827' },
  { key: 'green', label: 'Green', swatch: '#15803D' },
  { key: 'red', label: 'Red', swatch: '#DC2626' },
  { key: 'blue', label: 'Blue', swatch: '#2563EB' },
  { key: 'amber', label: 'Amber', swatch: '#F59E0B' },
];
const badgePreview = (key: string) => {
  const c = BADGE_COLORS.find(x => x.key === key) ?? BADGE_COLORS[0];
  return { bg: c.swatch, ink: key === 'amber' ? '#111111' : '#FFFFFF' };
};

/** Shopify "Vendor" + the order quantity rules (min / max / multiples) + pre-order, for physical products. */
export function SellingOptionsField({ value, onChange }: { value: SellingOptionsForm; onChange: (next: SellingOptionsForm) => void }) {
  const set = <K extends keyof SellingOptionsForm>(k: K, v: SellingOptionsForm[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-bone"><p className="text-[13px] font-bold text-charcoal">Selling options</p></div>
      <div className="px-5 py-4 space-y-4">
        <Field label="Vendor / brand" hint="Shown above the product name and usable as a storefront filter.">
          <Input value={value.vendor} maxLength={100} onChange={e => set('vendor', e.target.value)} aria-label="Vendor" />
        </Field>
        <Field label="Card badge (optional)" hint="A small label on this product's photo in the store, e.g. New, Bestseller, Grade-3. Leave empty for none.">
          <div className="flex flex-wrap items-center gap-2">
            <Input className="max-w-[220px]" value={value.cardBadgeText} maxLength={30} placeholder="e.g. New" onChange={e => set('cardBadgeText', e.target.value)} aria-label="Card badge text" />
            {value.cardBadgeText.trim() && (
              <>
                {BADGE_COLORS.map(c => (
                  <button key={c.key} type="button" title={c.label} aria-label={`Badge colour: ${c.label}`} aria-pressed={value.cardBadgeColor === c.key || (!value.cardBadgeColor && c.key === 'accent')}
                    onClick={() => set('cardBadgeColor', c.key === 'accent' ? '' : c.key)}
                    className="size-7 cursor-pointer rounded-full border-2 border-white shadow ring-1 ring-bone aria-pressed:ring-2 aria-pressed:ring-charcoal"
                    style={{ background: c.swatch }} />
                ))}
                <span className="rounded-full px-2.5 py-0.5 text-[12px] font-medium" style={{ background: badgePreview(value.cardBadgeColor).bg, color: badgePreview(value.cardBadgeColor).ink }}>{value.cardBadgeText.trim()}</span>
              </>
            )}
          </div>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Minimum order"><Input type="number" min={1} step={1} placeholder="1" value={value.orderMin} onChange={e => set('orderMin', e.target.value)} aria-label="Minimum order quantity" /></Field>
          <Field label="Maximum order"><Input type="number" min={1} step={1} placeholder="No limit" value={value.orderMax} onChange={e => set('orderMax', e.target.value)} aria-label="Maximum order quantity" /></Field>
          <Field label="Sold in multiples of"><Input type="number" min={1} step={1} placeholder="1" value={value.orderStep} onChange={e => set('orderStep', e.target.value)} aria-label="Quantity step" /></Field>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold text-charcoal">Pre-order</p>
            <p className="text-[12px] text-ash">Buyers see a "Pre-order" button instead of "Add to Cart".</p>
          </div>
          <Toggle checked={value.preorder} onChange={v => set('preorder', v)} />
        </div>
        {value.preorder && (
          <Field label="Expected ship date (optional)"><Input type="date" value={value.preorderOn} onChange={e => set('preorderOn', e.target.value)} aria-label="Pre-order ship date" /></Field>
        )}
      </div>
    </div>
  );
}
