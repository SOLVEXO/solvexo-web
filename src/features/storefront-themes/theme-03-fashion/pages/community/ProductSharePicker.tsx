import { useRef, useState } from 'react';
import { ts } from '@/utils/tStatic';
import { ImageOff, Search, X } from 'lucide-react';
import { apiGetPublicStoreProducts } from '@/api/services/store';

import { useDialogFocus } from '../../../core/hooks/useDialogFocus';
import { useMoney } from '../../../core/hooks/useMoney';
import { fashionTheme as t } from '../../theme.config';
import { EmptyState, ErrorState, SkeletonBlock, TextInput } from '../../ui/primitives';
import { useLoad } from '../../../core/pageHooks';

/** Modal that lets the buyer pick one of the store's products to send as a product card in the chat. */
export function ProductSharePicker({ storeId, onClose, onPick }: { storeId: string; onClose: () => void; onPick: (productId: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const { money } = useMoney();
  useDialogFocus(ref, onClose);
  const { data, loading, error, retry } = useLoad(
    () => apiGetPublicStoreProducts(storeId, { limit: 24, search: debounced || undefined }).then(r => r.data.products ?? []),
    [storeId, debounced],
  );

  const timer = useRef<number | undefined>(undefined);
  const onQuery = (v: string) => {
    setQuery(v);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDebounced(v.trim()), 300);
  };

  return (
    <div role="presentation" className="fixed inset-0 z-50 grid place-items-center px-4" style={{ background: 'rgba(0,0,0,.45)' }} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={ts('pg.share_a_product', 'Share a product')} tabIndex={-1} className="flex max-h-[82vh] w-full max-w-[460px] flex-col overflow-hidden outline-none" style={{ background: t.colors.bg, borderRadius: 24, color: t.colors.ink, fontFamily: t.fonts.body }}>
        <div className="flex items-center justify-between gap-3 p-4 pb-2">
          <h2 className="m-0 text-lg font-semibold">{ts('pg.share_a_product', 'Share a product')}</h2>
          <button type="button" onClick={onClose} aria-label={ts('common.close', 'Close')} className="grid size-9 place-items-center rounded-full border-0" style={{ background: t.colors.bgAlt, color: t.colors.ink, cursor: 'pointer' }}><X size={16} aria-hidden /></button>
        </div>
        <div className="relative px-4 pb-3">
          <label htmlFor="share-search" className="sr-only">{ts('pg.search_products', 'Search products')}</label>
          <Search size={16} aria-hidden className="pointer-events-none absolute left-8 top-1/2 -translate-y-[70%]" style={{ color: t.colors.inkMuted }} />
          <TextInput id="share-search" type="search" value={query} onChange={e => onQuery(e.target.value)} placeholder={ts('pg.search_products', 'Search products')} style={{ paddingLeft: 42, minHeight: 44 }} />
        </div>
        <div className="min-h-[160px] flex-1 overflow-y-auto px-2 pb-3" aria-live="polite">
          {loading ? <div className="px-2"><SkeletonBlock h={56} rows={4} /></div>
            : error ? <ErrorState message={ts('pg.we_couldn_t_load_products', 'We couldn\'t load products.')} onRetry={retry} />
            : !data || data.length === 0 ? <div className="px-2"><EmptyState title={ts('browse.noProducts', 'No products found')} text={ts('pg.try_a_different_word', 'Try a different word.')} /></div>
            : (
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {data.map(p => (
                  <li key={p._id}>
                    <button type="button" onClick={() => onPick(p._id)} className="flex w-full items-center gap-3 border-0 bg-transparent p-2 text-left" style={{ borderRadius: 14, color: t.colors.ink, cursor: 'pointer' }}>
                      <span className="grid shrink-0 place-items-center overflow-hidden" style={{ width: 52, height: 52, borderRadius: 10, background: t.colors.bgAlt }}>
                        {p.images?.[0] ? <img src={p.images[0]} alt="" loading="lazy" className="size-full object-cover" /> : <ImageOff size={16} aria-hidden style={{ color: t.colors.inkMuted }} />}
                      </span>
                      <span className="min-w-0"><span className="block truncate text-sm font-medium">{p.name}</span>{p.defaultVariantPrice != null && <span className="block text-[13px]" style={{ color: t.colors.inkMuted }}>{money(p.defaultVariantPrice)}</span>}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
        </div>
      </div>
    </div>
  );
}

