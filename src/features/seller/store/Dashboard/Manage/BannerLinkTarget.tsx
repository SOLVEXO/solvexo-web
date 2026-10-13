import { useEffect, useState } from 'react';
import { EntityPickerModal } from '@/features/seller/store/Dashboard/OnlineStore/builder/EntityPickerModal';
import { apiGetCategoryById } from '@/api/services/categories';
import { apiGetCollection } from '@/api/services/collections';
import { apiGetMyProductById } from '@/api/services/product';
import type { StoreBannerLinkType } from '@/api/services/storeBanner';

const INPUT = 'w-full px-3 py-2 rounded-lg border border-bone text-[13px] outline-none transition-shadow duration-150 focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange';

/** A banner's link target: a URL box for external links, otherwise a picker for the product / category / collection
 *  (no more pasting raw ids), with the chosen item's name shown. */
export function BannerLinkTarget({ storeId, linkType, value, onChange }: {
  storeId: string; linkType: StoreBannerLinkType; value: string; onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLabel('');
    setBroken(false);
    if (linkType === 'external' || !value) return;
    const load = linkType === 'category'
      ? apiGetCategoryById(value).then(r => r.data.category.name)
      : linkType === 'collection'
        ? apiGetCollection(storeId, value).then(r => r.data.name)
        : apiGetMyProductById(value).then(r => r.data.product.name);
    load.then(name => { if (!cancelled) setLabel(name); }).catch(() => { if (!cancelled) setBroken(true); });
    return () => { cancelled = true; };
  }, [linkType, value, storeId]);

  if (linkType === 'external') {
    return (
      <div>
        <label htmlFor="store-banner-link-target" className="block text-[12px] font-medium text-charcoal mb-1.5">Link URL</label>
        <input id="store-banner-link-target" value={value} onChange={e => onChange(e.target.value)} placeholder="https://…" className={INPUT} />
      </div>
    );
  }
  const noun = linkType === 'category' ? 'category' : linkType === 'collection' ? 'collection' : 'product';
  return (
    <div>
      <span className="block text-[12px] font-medium text-charcoal mb-1.5">Link target</span>
      <button type="button" onClick={() => setOpen(true)}
        className={`w-full px-3 py-2 text-[13px] border rounded-lg text-left bg-white cursor-pointer hover:bg-cream transition-colors truncate ${broken ? 'border-error text-error' : 'border-bone text-charcoal'}`}>
        {broken ? `⚠ This ${noun} no longer exists — choose again` : value ? (label || 'Selected') : `Choose a ${noun}…`}
      </button>
      {open && (
        <EntityPickerModal
          open={open}
          onClose={() => setOpen(false)}
          mode={linkType === 'category' ? 'categories' : linkType === 'collection' ? 'collections' : 'products'}
          storeId={storeId}
          multiple={false}
          initialSelectedIds={value ? [value] : []}
          onConfirm={ids => { onChange(ids[0] ?? ''); setOpen(false); }}
        />
      )}
    </div>
  );
}
