import { Field, Input, Toggle, DateField, ColorField } from '@/components/comman/ui';
import type { ProductSellingOptions } from '@/api/services/product';
import { badgeAccent } from '@/features/storefront-themes/cardBadgeTheme';

/** Form-state shape (strings so inputs stay editable); `sellingOptionsPayload` turns it into the API fields. */
export interface SellingOptionsForm {
  vendor: string; cardBadgeText: string; cardBadgeColor: string; orderMin: string; orderMax: string; orderStep: string; preorder: boolean; preorderOn: string;
}

export const initSellingOptions: SellingOptionsForm = { vendor: '', cardBadgeText: '', cardBadgeColor: '', orderMin: '', orderMax: '', orderStep: '', preorder: false, preorderOn: '' };

/** Colour names older products saved before any colour could be chosen; they are shown (and saved again) as the colour itself. */
const LEGACY_BADGE_COLORS: Record<string, string> = { dark: '#111827', green: '#15803D', red: '#DC2626', blue: '#2563EB', amber: '#F59E0B' };
const toHex = (c: string | undefined) => (c && LEGACY_BADGE_COLORS[c]) || (c && /^#[0-9a-fA-F]{6}$/.test(c) ? c.toUpperCase() : '');

export function sellingOptionsFromProduct(p: { vendor?: string; cardBadgeText?: string; cardBadgeColor?: string; orderMinQuantity?: number; orderMaxQuantity?: number | null; orderQuantityStep?: number; preorder?: { enabled: boolean; availableOn: string | null } }): SellingOptionsForm {
  return {
    vendor: p.vendor ?? '',
    cardBadgeText: p.cardBadgeText ?? '',
    cardBadgeColor: toHex(p.cardBadgeColor),
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
    cardBadgeColor: f.cardBadgeText.trim() ? toHex(f.cardBadgeColor) : '',
    orderMinQuantity: n(f.orderMin) ?? 1,
    orderMaxQuantity: n(f.orderMax),
    orderQuantityStep: n(f.orderStep) ?? 1,
    preorder: { enabled: f.preorder, availableOn: f.preorder && f.preorderOn ? f.preorderOn : null },
  };
}

/** Quick picks; "Theme colour" (empty) follows the store's Theme settings → Product cards → Product badge colour, and the colour wheel allows any other colour. */
const BADGE_SWATCHES = [
  { hex: '#111827', label: 'Black' }, { hex: '#6B7280', label: 'Grey' }, { hex: '#15803D', label: 'Green' }, { hex: '#0D9488', label: 'Teal' },
  { hex: '#2563EB', label: 'Blue' }, { hex: '#7C3AED', label: 'Purple' }, { hex: '#DB2777', label: 'Pink' }, { hex: '#DC2626', label: 'Red' },
  { hex: '#EA580C', label: 'Orange' }, { hex: '#F59E0B', label: 'Amber' },
];
const FALLBACK = { bg: '#4B5563', ink: '#FFFFFF' };

/** Shopify "Vendor" + a card badge + the order quantity rules (min / max / multiples) + pre-order, for physical products. */
export function SellingOptionsField({ value, onChange }: { value: SellingOptionsForm; onChange: (next: SellingOptionsForm) => void }) {
  const set = <K extends keyof SellingOptionsForm>(k: K, v: SellingOptionsForm[K]) => onChange({ ...value, [k]: v });
  const text = value.cardBadgeText.trim();
  const picked = toHex(value.cardBadgeColor);
  const preview = badgeAccent(picked || null, FALLBACK);
  return (
    <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-bone"><p className="text-[13px] font-bold text-charcoal">Selling options</p></div>
      <div className="px-5 py-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Vendor / brand" hint="Shown above the product name; usable as a filter.">
            <Input value={value.vendor} maxLength={100} onChange={e => set('vendor', e.target.value)} aria-label="Vendor" />
          </Field>
          <Field label="Card badge (optional)" hint="A small label on the photo, e.g. New or Grade-3.">
            <Input value={value.cardBadgeText} maxLength={30} placeholder="e.g. New" onChange={e => set('cardBadgeText', e.target.value)} aria-label="Card badge text" />
          </Field>
        </div>
        {text && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Badge colour">
            <span className="text-[12px] font-medium text-charcoal mr-1">Badge colour</span>
            <button type="button" title="Theme colour (set in Theme settings)" aria-label="Badge colour: theme colour" aria-pressed={!picked}
              onClick={() => set('cardBadgeColor', '')}
              className="h-7 cursor-pointer rounded-full border-2 border-white bg-white px-2.5 text-[11px] font-medium text-charcoal shadow ring-1 ring-bone aria-pressed:ring-2 aria-pressed:ring-charcoal">Theme</button>
            {BADGE_SWATCHES.map(c => (
              <button key={c.hex} type="button" title={c.label} aria-label={`Badge colour: ${c.label}`} aria-pressed={picked === c.hex}
                onClick={() => set('cardBadgeColor', c.hex)}
                className="size-7 cursor-pointer rounded-full border-2 border-white shadow ring-1 ring-bone aria-pressed:ring-2 aria-pressed:ring-charcoal"
                style={{ background: c.hex }} />
            ))}
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-bone bg-white py-0.5 ps-1 pe-2.5 text-[11px] font-medium text-charcoal" title="Pick any colour">
              <ColorField compact aria-label="Badge colour: custom" value={picked || '#4B5563'} onChange={e => set('cardBadgeColor', e.target.value.toUpperCase())} />
              {picked && !BADGE_SWATCHES.some(c => c.hex === picked) ? picked : 'Custom'}
            </label>
            <span className="ms-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium" style={{ background: preview.bg, color: preview.ink }}>{text}</span>
          </div>
        )}
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
          <Field label="Expected ship date (optional)"><DateField value={value.preorderOn} onChange={e => set('preorderOn', e.target.value)} aria-label="Pre-order ship date" /></Field>
        )}
      </div>
    </div>
  );
}
