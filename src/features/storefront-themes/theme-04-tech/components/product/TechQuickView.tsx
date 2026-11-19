import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { VendorLink } from '@/features/storefront-themes/core/VendorLink';
import { Minus, Plus } from 'lucide-react';
import { handleOf } from '@/utils/activeStoreText';
import { ts } from '@/utils/tStatic';
import type { ProductVariant } from '@/api/services/marketplace';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { VariantOptionPicker } from '../../../core/product/VariantOptionPicker';
import { buildOptionValues } from '../../../core/product/variantOptions';
import { useProductPickerSettings } from '../../../core/product/pickerSettings';

import { useCartContext } from '@/contexts/CartContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useProductById } from '@/hooks/marketplace/useProductById';
import { useLocalize } from '@/hooks/useLocalize';
import { displayMoney, saleInfo } from '../../../core/money';
import { useCartDrawer } from '../../../cartDrawerContext';
import { clampQty, qtyRuleHint, resolveQtyRules } from '../../../sellingRules';
import { stockState, variantCanBuy, variantMaxQty } from '../../../variantAvailability';
import { techTheme as t } from '../../theme.config';
import { TechDialog } from '../../ui/techDialog';
import { TechButton, TechError, TechStock } from '../../ui/techUi';

/** Product pop-up opened from a product card: pick options and quantity and add to cart without leaving the list. */
export function TechQuickView({ slug, onClose }: { slug: string; onClose: () => void }) {
  const { store } = useStorefront();
  const { addToCart, adding } = useCartContext();
  const { openDrawer, mounted: drawerMounted } = useCartDrawer();
  const { currency, convert, canConvert, fixedPriceFor } = useCurrencyPreference();
  const localize = useLocalize();
  const { detail, loading, error, refetch } = useProductById(slug);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const picker = useProductPickerSettings(store.storeId, detail?.product.templateKey);
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
    body = (
      <div aria-busy="true" className="grid gap-6 sm:grid-cols-2">
        <div className="animate-pulse" style={{ aspectRatio: '1 / 1', background: t.colors.bgAlt }} />
        <div className="flex flex-col gap-3"><div className="h-6 w-3/4 animate-pulse" style={{ background: t.colors.bgAlt }} /><div className="h-6 w-1/3 animate-pulse" style={{ background: t.colors.bgAlt }} /><div className="h-24 animate-pulse" style={{ background: t.colors.bgAlt }} /></div>
      </div>
    );
  } else if (error || !detail || !product || !variant) {
    body = <TechError message={ts('product.loadError', 'We couldn\'t load this product.')} onRetry={refetch} />;
  } else {
    const base = String(variant.currency ?? store.baseCurrency ?? currency);
    const ref = { productId: detail.product._id, variantId: variant._id };
    const show = (n: number, compare = false) => displayMoney({ currency, convert, canConvert }, n, base, { ...ref, compare });
    const state = stockState(variant, isDigital, store.lowStockThreshold);
    const canBuy = variantCanBuy(variant, isDigital);
    const max = variantMaxQty(variant, isDigital);
    const rules = resolveQtyRules(detail.product, Number.isFinite(max) ? max : 999);
    const safeQty = clampQty(qty, rules);
    const sale = saleInfo({ currency, convert, canConvert, fixedPriceFor }, variant.price, variant.compareAtPrice, base, ref);
    const busy = adding === variant._id;
    const add = async () => {
      const ok = await addToCart(detail.product._id, variant._id, isDigital ? 'digital' : 'physical', safeQty);
      if (!ok) return;
      onClose();
      if (drawerMounted) openDrawer();
    };
    const stepBtn = 'grid size-10 cursor-pointer place-items-center border-0 bg-transparent disabled:cursor-not-allowed disabled:opacity-40';
    body = (
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="grid place-items-center overflow-hidden" style={{ aspectRatio: '1 / 1', background: t.colors.bgAlt, borderRadius: t.imageRadiusPx }}>
          {image && <img src={image} alt={product.name} className="size-full object-contain p-4" />}
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <div>
            {detail.product.vendor && <p className="m-0 mb-1 text-sm" style={{ color: t.colors.inkMuted }}><VendorLink name={detail.product.vendor} /></p>}
            <h3 className="m-0 text-xl font-semibold leading-tight" style={{ fontFamily: t.fonts.display }}>{product.name}</h3>
          </div>
          <p className="m-0 flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-semibold" style={{ color: sale.onSale ? t.colors.danger : t.colors.price }}>{show(variant.price)}</span>
            {sale.onSale && <s className="text-base" style={{ color: t.colors.inkMuted }}>{show(sale.compareAmount, true)}</s>}
          </p>
          {optionNames.map(name => (
            <VariantOptionPicker key={name} name={name} current={variant.options?.find(o => o.name === name)?.value}
              values={buildOptionValues(variants, variant, name, isDigital, detail?.product.optionSwatches)} style={picker.pickerStyle} shape={picker.shape} size={picker.size}
              tokens={{ ink: t.colors.ink, inkMuted: t.colors.inkMuted, border: t.colors.border, selected: t.colors.accent, selectedInk: t.colors.accentInk, bg: t.colors.bg, radius: t.fieldRadiusPx, buttonLook: 'outlined', borderWidth: 1.5, legendWeight: 600 }}
              soldOutLabel={ts('product.soldOut', 'Sold out')} onPick={v => { setPicked(p => ({ ...p, [name]: v })); setQty(1); }} />
          ))}
          <TechStock inStock={state !== 'sold_out'} />
          <div className="mt-auto flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center" style={{ border: `1px solid ${t.colors.border}`, borderRadius: t.fieldRadiusPx }}>
                <button type="button" aria-label={ts('product.decreaseQty', 'Decrease quantity')} disabled={safeQty <= rules.min} onClick={() => setQty(safeQty - rules.step)} className={stepBtn} style={{ color: t.colors.ink }}><Minus size={14} aria-hidden /></button>
                <span className="w-8 text-center text-sm" aria-live="polite">{safeQty}</span>
                <button type="button" aria-label={ts('product.increaseQty', 'Increase quantity')} disabled={safeQty + rules.step > rules.max} onClick={() => setQty(safeQty + rules.step)} className={stepBtn} style={{ color: t.colors.ink }}><Plus size={14} aria-hidden /></button>
              </div>
              {qtyRuleHint(rules) && <span className="text-xs" style={{ color: t.colors.inkMuted }}>{qtyRuleHint(rules)}</span>}
              <TechButton className="flex-1" loading={busy} disabled={!canBuy} onClick={add}>{canBuy ? ts('pg.add_to_cart', 'Add to cart') : ts('product.soldOut', 'Sold out')}</TechButton>
            </div>
            <Link to={`/product/${handleOf(detail.product)}`} onClick={onClose} className="text-sm underline" style={{ color: t.colors.accent }}>{ts('pg.view_full_details', 'View full details')}</Link>
          </div>
        </div>
      </div>
    );
  }

  return <TechDialog title={ts('pg.quick_view', 'Quick view')} size={{ compact: 760, standard: 880, large: 1000 }[t.quickViewSize]} onClose={onClose}>{body}</TechDialog>;
}
