import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Section } from '@/api/services/storefrontTypes';
import { apiGetPublicStoreProducts, type PublicStoreProduct } from '@/api/services/store';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { columnCount } from '@/features/storefront/browse/gridLayout';
import { ts, tt } from '@/utils/tStatic';
import { displayMoneySum } from './core/money';
import type { CollectionTileData, TileColors } from './collectionTiles';

/** Collection List "click a card to show its products" mode (Shopify-style collection picker + add all). */
export function useCollectionPick(section: Section, tiles: CollectionTileData[] | null) {
  const enabled = section.settings.clickAction === 'show_products';
  const [params, setParams] = useSearchParams();
  const wanted = params.get('set');
  const valid = (tiles ?? []).filter(t => t.collectionId);
  const selected = enabled ? valid.find(t => t.collectionId === wanted) ?? null : null;
  const select = useCallback((collectionId: string) => {
    const next = new URLSearchParams(params);
    if (wanted === collectionId) next.delete('set'); else next.set('set', collectionId);
    setParams(next, { replace: true, preventScrollReset: true });
  }, [params, wanted, setParams]);
  return { enabled, selected, select };
}

interface PanelProps {
  section: Section;
  tile: CollectionTileData;
  colors: TileColors;
  fonts: { display: string; body: string };
  buttonRadius: string | number;
  ProductCard: ComponentType<{ product: PublicStoreProduct; currency: string }>;
  /** Called after "Add all" put something in the cart (a theme can open its cart drawer). */
  onAdded?: () => void;
}

/** The products of the chosen collection + their total + one "Add all" button. */
export function CollectionSetPanel({ section, tile, colors, fonts, buttonRadius, ProductCard, onAdded }: PanelProps) {
  const { store } = useStorefront();
  const { addToCart, adding } = useCartContext();
  const { currency, convert, canConvert } = useCurrencyPreference();
  const [state, setState] = useState<{ id: string; products: PublicStoreProduct[] | null; failed: boolean }>({ id: '', products: null, failed: false });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const id = tile.collectionId as string;

  useEffect(() => {
    let off = false;
    apiGetPublicStoreProducts(store.storeId, { collectionId: id, limit: 50 })
      .then(r => { if (!off) setState({ id, products: r.data?.products ?? [], failed: false }); })
      .catch(() => { if (!off) setState({ id, products: [], failed: true }); });
    return () => { off = true; };
  }, [store.storeId, id]);

  useEffect(() => { ref.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' }); }, [id]);

  const loading = state.id !== id || state.products === null;
  const products = loading ? [] : (state.products ?? []);
  const buyable = products.filter(p => !!p.variantId && p.inStock !== false);
  const base = String(store.baseCurrency ?? currency);
  const showSubtotal = section.settings.showSubtotal !== false;
  const subtotal = displayMoneySum(
    { currency, convert, canConvert },
    buyable.map(p => ({ amount: p.defaultVariantPrice ?? 0, from: base, unit: p.defaultVariantPrice ?? 0, qty: 1, ref: { productId: p._id, variantId: p.variantId } })),
  );
  const cols = columnCount(section.settings.productColumns, 4);

  const addAll = async () => {
    if (busy || buyable.length === 0) return;
    setBusy(true);
    setNote('');
    let ok = 0;
    for (const p of buyable) { // one by one: a guest's local cart and a server cart must never race
      if (await addToCart(p._id, p.variantId as string, p.type === 'digital' ? 'digital' : 'physical', 1)) ok++;
    }
    setBusy(false);
    const skipped = products.length - ok;
    if (ok > 0) onAdded?.();
    setNote(skipped > 0
      ? tt('pg.set_added_some', '{{ok}} added to your cart. {{skipped}} could not be added (sold out or unavailable).', { ok, skipped })
      : tt('pg.set_added_all', 'All {{ok}} added to your cart.', { ok }));
  };

  const label = typeof section.settings.addAllLabel === 'string' && section.settings.addAllLabel.trim()
    ? section.settings.addAllLabel.trim()
    : null;
  const btn = { fontFamily: fonts.body, fontSize: 15, fontWeight: 600, padding: '13px 26px', borderRadius: buttonRadius, border: `1px solid ${colors.accent}`, background: colors.accent, color: colors.accentInk ?? '#fff', cursor: busy ? 'wait' : 'pointer', opacity: busy || buyable.length === 0 ? 0.65 : 1 } as const;

  return (
    <div ref={ref} className="mt-10 rounded-3xl border p-5 sm:p-7" style={{ borderColor: colors.border, background: colors.bg }} aria-live="polite">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="m-0 text-2xl font-semibold" style={{ fontFamily: fonts.display, color: colors.ink }}>
            {tile.name}{!loading && <span style={{ color: colors.inkMuted, fontWeight: 400 }}> · {tt('pg.set_count', '{{n}} products', { n: products.length })}</span>}
          </h3>
          {showSubtotal && buyable.length > 0 && (
            <p className="m-0 mt-1 text-sm" style={{ fontFamily: fonts.body, color: colors.inkMuted }}>
              {ts('pg.set_subtotal', 'Individual subtotal')}: <strong style={{ color: colors.ink }}>{subtotal}</strong>
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>{ts('common.loading', 'Loading…')}</p>
      ) : state.failed ? (
        <p role="alert" style={{ fontFamily: fonts.body, color: colors.inkMuted }}>{ts('pg.set_failed', 'We could not load these products. Please try again.')}</p>
      ) : products.length === 0 ? (
        <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>{ts('pg.set_empty', 'No products in this collection yet.')}</p>
      ) : (
        <>
          <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${Math.floor(1100 / cols)}px), 1fr))` }}>
            {products.map(p => <ProductCard key={p._id} product={p} currency={currency} />)}
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <button type="button" onClick={addAll} disabled={busy || !!adding || buyable.length === 0} style={btn}>
              {busy
                ? ts('pg.set_adding', 'Adding…')
                : label ?? tt('pg.set_add_all', 'Add all {{n}} to cart', { n: buyable.length })}
            </button>
            {note && <span role="status" className="text-sm" style={{ fontFamily: fonts.body, color: colors.inkMuted }}>{note}</span>}
          </div>
        </>
      )}
    </div>
  );
}
