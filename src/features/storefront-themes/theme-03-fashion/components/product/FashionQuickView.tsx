import { useMemo, useState } from 'react';
import { handleOf } from '@/utils/activeStoreText';
import { ts } from '@/utils/tStatic';
import { Link } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import type { ProductVariant } from '@/api/services/marketplace';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useProductById } from '@/hooks/marketplace/useProductById';
import { useLocalize } from '@/hooks/useLocalize';
import { displayMoney, saleInfo } from '../../../core/money';
import { useCartDrawer } from '../../../cartDrawerContext';
import { clampQty, qtyRuleHint, resolveQtyRules } from '../../../sellingRules';
import { optionValueAvailable, stockState, variantCanBuy, variantMaxQty } from '../../../variantAvailability';
import { fashionTheme as t } from '../../theme.config';
import { Dialog } from '../../ui/Dialog';
import { Notice, PillButton } from '../../ui/primitives';

/** Product pop-up opened from a product card: pick options, quantity and add to cart without leaving the grid. */
export function FashionQuickView({ slug, onClose }: { slug: string; onClose: () => void }) {
  const { store } = useStorefront();
  const { addToCart, adding } = useCartContext();
  const { openDrawer, mounted: drawerMounted } = useCartDrawer();
  const { currency, convert, canConvert, fixedPriceFor } = useCurrencyPreference();
  const localize = useLocalize();
  const { detail, loading, error, refetch } = useProductById(slug);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);

  const variants = useMemo(() => detail?.variants ?? [], [detail?.variants]);
  const optionNames = useMemo(() => Array.from(new Set(variants.flatMap(v => (v.options ?? []).map(o => o.name)))), [variants]);
  const variant: ProductVariant | null = useMemo(() => {
    if (!variants.length) return null;
    const exact = variants.find(v => optionNames.every(n => !picked[n] || v.options?.find(o => o.name === n)?.value === picked[n]));
    return exact ?? detail?.defaultVariant ?? variants[0];
  }, [variants, optionNames, picked, detail?.defaultVariant]);

  const product = detail ? localize.product(detail.product) : null;
  const isDigital = detail?.product.type === 'digital' || detail?.product.productType === 'digital';
  const image = variant?.images?.find(Boolean) ?? detail?.product.images?.[0];

  let body;
  if (loading) {
    body = <div aria-busy className="grid gap-6 sm:grid-cols-2"><div className="animate-pulse" style={{ aspectRatio: '4 / 5', background: t.colors.bgAlt, borderRadius: 20 }} /><div className="flex flex-col gap-3"><div className="h-7 w-3/4 animate-pulse" style={{ background: t.colors.bgAlt, borderRadius: 8 }} /><div className="h-5 w-1/3 animate-pulse" style={{ background: t.colors.bgAlt, borderRadius: 8 }} /></div></div>;
  } else if (error || !detail || !product || !variant) {
    body = <div className="flex flex-col gap-4"><Notice tone="error">{ts('product.loadError', 'We couldn\'t load this product.')}</Notice><PillButton variant="outline" onClick={refetch}>{ts('checkout.tryAgain', 'Try again')}</PillButton></div>;
  } else {
    const base = String(variant.currency ?? store.baseCurrency ?? currency);
    const show = (n: number, compare = false) => displayMoney({ currency, convert, canConvert }, n, base, { productId: detail.product._id, variantId: variant._id, compare });
    const state = stockState(variant, isDigital, store.lowStockThreshold);
    const canBuy = variantCanBuy(variant, isDigital);
    const max = variantMaxQty(variant, isDigital);
    const rules = resolveQtyRules(detail.product, Number.isFinite(max) ? max : 999);
    const safeQty = clampQty(qty, rules);
    const sale = saleInfo({ currency, convert, canConvert, fixedPriceFor }, variant.price, variant.compareAtPrice, base, { productId: detail.product._id, variantId: variant._id });
    const onSale = sale.onSale;
    const busy = adding === variant._id;
    const add = async () => {
      const ok = await addToCart(detail.product._id, variant._id, isDigital ? 'digital' : 'physical', safeQty);
      if (!ok) return;
      onClose();
      if (drawerMounted) openDrawer();
    };
    body = (
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="overflow-hidden" style={{ aspectRatio: '4 / 5', background: t.colors.bgAlt, borderRadius: 20 }}>
          {image && <img src={image} alt={product.name} className="size-full object-cover" />}
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <div>
            {detail.product.vendor && <p className="m-0 mb-1 text-sm" style={{ color: t.colors.inkMuted }}>{detail.product.vendor}</p>}
            <h3 className="m-0 text-2xl font-semibold leading-tight tracking-tight">{product.name}</h3>
          </div>
          <p className="m-0 flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-semibold" style={{ color: onSale ? t.colors.danger : t.colors.ink }}>{show(variant.price)}</span>
            {onSale && <span className="text-lg line-through opacity-50">{show(sale.compareAmount, true)}</span>}
          </p>
          {optionNames.map(name => {
            const values = Array.from(new Set(variants.map(v => v.options?.find(o => o.name === name)?.value).filter((v): v is string => !!v)));
            const current = variant.options?.find(o => o.name === name)?.value;
            return (
              <fieldset key={name} className="m-0 border-0 p-0">
                <legend className="mb-2 p-0 text-sm font-medium">{name}: <span style={{ color: t.colors.inkMuted }}>{current}</span></legend>
                <div className="flex flex-wrap gap-2">
                  {values.map(v => {
                    const active = current === v;
                    const available = optionValueAvailable(variants, variant, name, v, isDigital);
                    return (
                      <button key={v} type="button" aria-pressed={active} onClick={() => { setPicked(p => ({ ...p, [name]: v })); setQty(1); }}
                        className="cursor-pointer px-4 py-2 text-sm" style={{ borderRadius: t.buttonRadiusPx, border: `1px solid ${active ? t.colors.selected : t.colors.border}`, background: active ? t.colors.selected : 'transparent', color: active ? t.colors.selectedInk : t.colors.ink, opacity: available ? 1 : 0.45, textDecoration: available ? 'none' : 'line-through' }}>{v}</button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
          <p className="m-0 text-sm" style={{ color: state === 'in_stock' || state === 'backorder' ? t.colors.success : t.colors.danger }}>
            {state === 'sold_out' ? ts('product.soldOut', 'Sold out') : state === 'low' ? ts('pg.low_stock', 'Low stock') : state === 'backorder' ? ts('product.backorder', 'Available on backorder') : ts('browse.inStock', 'In stock')}
          </p>
          <div className="mt-auto flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center" style={{ border: `1px solid ${t.colors.border}`, borderRadius: t.buttonRadiusPx }}>
                <button type="button" aria-label={ts('product.decreaseQty', 'Decrease quantity')} disabled={safeQty <= rules.min} onClick={() => setQty(safeQty - rules.step)} className="grid size-10 cursor-pointer place-items-center border-0 bg-transparent disabled:opacity-40"><Minus size={14} aria-hidden /></button>
                <span className="w-8 text-center text-sm" aria-live="polite">{safeQty}</span>
                <button type="button" aria-label={ts('product.increaseQty', 'Increase quantity')} disabled={safeQty + rules.step > rules.max} onClick={() => setQty(safeQty + rules.step)} className="grid size-10 cursor-pointer place-items-center border-0 bg-transparent disabled:opacity-40"><Plus size={14} aria-hidden /></button>
              </div>
              {qtyRuleHint(rules) && <span className="text-xs" style={{ color: t.colors.inkMuted }}>{qtyRuleHint(rules)}</span>}
              <PillButton className="flex-1" loading={busy} disabled={!canBuy} onClick={add}>{canBuy ? ts('pg.add_to_cart', 'Add to cart') : ts('product.soldOut', 'Sold out')}</PillButton>
            </div>
            <Link to={`/product/${handleOf(detail.product)}`} onClick={onClose} className="text-sm underline" style={{ color: t.colors.ink }}>{ts('pg.view_full_details', 'View full details')}</Link>
          </div>
        </div>
      </div>
    );
  }

  return <Dialog title={ts('pg.quick_view', 'Quick view')} size="lg" onClose={onClose}>{body}</Dialog>;
}
