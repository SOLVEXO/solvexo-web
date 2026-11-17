import { useEffect, useMemo, useState } from 'react';
import { ts } from '@/utils/tStatic';
import { apiPublicRecommendations, type RecommendationCard } from '@/api/services/merchandising';
import { useCartContext } from '@/contexts/CartContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { displayMoneySum } from '../money';

export interface FbtTokens { ink: string; inkMuted: string; border: string; radius: number | string; accent: string; accentInk: string; fontBody?: string }
export interface FbtMain { productId: string; variantId: string; type: 'physical' | 'digital'; name: string; image: string | null; price: number; currency: string; canBuy: boolean }

/** "Frequently bought together": this product + the seller's complementary / related picks, tick what you want and add all at once.
 *  Draws nothing when the product has no picks. */
export function FrequentlyBought({ storeId, main, settings, tokens: t, preview = false }: { storeId: string; main: FbtMain; settings: Record<string, unknown>; tokens: FbtTokens; /** Editor preview: looks the same, but nothing is added to a cart. */ preview?: boolean }) {
  const { addToCart, adding } = useCartContext();
  const money = useCurrencyPreference();
  const [items, setItems] = useState<RecommendationCard[]>([]);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const max = typeof settings.maxItems === 'number' && settings.maxItems >= 1 && settings.maxItems <= 3 ? settings.maxItems : 2;
  const heading = typeof settings.heading === 'string' && settings.heading.trim() ? settings.heading.trim() : ts('product.fbtHeading', 'Frequently bought together');
  const buttonLabel = typeof settings.buttonLabel === 'string' && settings.buttonLabel.trim() ? settings.buttonLabel.trim() : ts('product.fbtAdd', 'Add selected to cart');

  useEffect(() => {
    let off = false;
    apiPublicRecommendations(storeId, main.productId, [], max)
      .then(r => { if (off) return; const list = (r.data?.items ?? []).filter(i => i.variantId && i.id !== main.productId).slice(0, max); setItems(list); setPicked(Object.fromEntries(list.map(i => [i.id, true]))); })
      .catch(() => { if (!off) setItems([]); });
    return () => { off = true; };
  }, [storeId, main.productId, max]);

  const chosen = useMemo(() => items.filter(i => picked[i.id]), [items, picked]);
  if (items.length === 0 || !main.canBuy) return null;

  const total = displayMoneySum(money, [{ amount: main.price, from: main.currency }, ...chosen.map(i => ({ amount: i.price, from: main.currency }))]);
  const addAll = async () => {
    if (preview) return;
    setBusy(true);
    try {
      await addToCart(main.productId, main.variantId, main.type, 1);
      for (const i of chosen) await addToCart(i.id, i.variantId, i.type, 1);
    } finally { setBusy(false); }
  };
  const rows = [{ id: main.productId, name: main.name, image: main.image, price: main.price, fixed: true }, ...items.map(i => ({ id: i.id, name: i.name, image: i.image, price: i.price, fixed: false }))];
  return (
    <section data-fbt aria-label={heading} style={{ fontFamily: t.fontBody, color: t.ink }}>
      <h2 className="m-0 mb-3 text-lg font-semibold">{heading}</h2>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {rows.map(r => (
          <li key={r.id} className="flex items-center gap-3" style={{ border: `1px solid ${t.border}`, borderRadius: t.radius, padding: '10px 12px' }}>
            <input type="checkbox" aria-label={r.name} checked={r.fixed || !!picked[r.id]} disabled={r.fixed} onChange={e => setPicked({ ...picked, [r.id]: e.target.checked })} style={{ accentColor: t.accent }} />
            {r.image && <img src={r.image} alt="" loading="lazy" className="size-12 shrink-0 object-cover" style={{ borderRadius: 8 }} />}
            <span className="min-w-0 flex-1 truncate text-sm">{r.name}{r.fixed ? ` (${ts('product.fbtThis', 'this item')})` : ''}</span>
            <span className="text-sm font-medium">{displayMoneySum(money, [{ amount: r.price, from: main.currency }])}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm" style={{ color: t.inkMuted }}>{ts('product.fbtTotal', 'Total')}: <strong style={{ color: t.ink }}>{total}</strong></span>
        <button type="button" disabled={busy || adding !== null} onClick={() => void addAll()} className="cursor-pointer border-0 px-5 py-2.5 text-sm font-medium" style={{ background: t.accent, color: t.accentInk, borderRadius: t.radius, opacity: busy ? 0.6 : 1 }}>{buttonLabel}</button>
      </div>
    </section>
  );
}
