import { useState } from 'react';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import type { ProductVariant } from '@/api/services/product';

const label = (v: ProductVariant) => v.options.map(o => o.value).join(' / ') || 'Default';

/**
 * Second step after picking a product that has several variants (Shopify: "Select variants"):
 * tick the ones to add. Used by draft orders and purchase orders.
 */
export function VariantPickModal({ productName, variants, currencySymbol, onAdd, onClose }: {
  productName: string;
  variants: ProductVariant[];
  currencySymbol: string;
  onAdd: (picked: ProductVariant[]) => void;
  onClose: () => void;
}) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const all = ids.size === variants.length;
  const toggle = (id: string) => setIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  return (
    <Modal title={`Select variants — ${productName}`} onClose={onClose} width={560} mobileSheet
      footer={<div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button disabled={ids.size === 0} onClick={() => onAdd(variants.filter(v => ids.has(v._id)))}>{ids.size > 0 ? `Add ${ids.size} variant${ids.size === 1 ? '' : 's'}` : 'Add'}</Button>
      </div>}
    >
      <label className="flex items-center gap-2 pb-2 mb-1 border-b border-bone text-[12.5px] text-charcoal font-medium cursor-pointer">
        <input type="checkbox" checked={all} onChange={() => setIds(all ? new Set() : new Set(variants.map(v => v._id)))} />
        Select all ({variants.length})
      </label>
      <ul className="m-0 p-0 list-none max-h-[360px] overflow-y-auto divide-y divide-bone">
        {variants.map(v => (
          <li key={v._id}>
            <label className="flex items-center gap-3 py-2.5 cursor-pointer">
              <input type="checkbox" checked={ids.has(v._id)} onChange={() => toggle(v._id)} aria-label={label(v)} />
              {v.images?.[0] && <img src={v.images[0]} alt="" className="w-9 h-9 rounded-md object-cover border border-bone shrink-0" />}
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-charcoal truncate">{label(v)}</span>
                <span className="block text-[11px] text-slate truncate">SKU: {v.sku || '—'}</span>
              </span>
              <span className="text-right shrink-0">
                <span className="block text-[13px] text-charcoal">{currencySymbol}{v.price.toLocaleString()}</span>
                <span className="block text-[11px] text-slate">{v.unlimitedStock ? 'Unlimited' : `${v.stock} in stock`}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
