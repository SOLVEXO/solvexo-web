import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, X } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { handleOf } from '@/utils/activeStoreText';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { displayMoney } from '../../core/money';
import { techTheme as t } from '../theme.config';
import { TechDialog } from '../ui/techDialog';
import { TechButton, TechStars } from '../ui/techUi';
import { COMPARE_MAX, useCompare, type CompareProduct } from './compare';

/** The comparison table: one column per product, one row per field. A row appears only when at least one product has that field (nothing is invented). */
function CompareTable({ items }: { items: CompareProduct[] }) {
  const { store } = useStorefront();
  const { currency, convert, canConvert } = useCurrencyPreference();
  const base = String(store.baseCurrency ?? currency);
  const rows: { label: string; cell: (p: CompareProduct) => ReactNode; has: boolean }[] = [
    { label: ts('tx.compare.price', 'Price'), has: items.some(p => p.defaultVariantPrice != null), cell: (p: CompareProduct) => (p.defaultVariantPrice != null ? <b>{displayMoney({ currency, convert, canConvert }, p.defaultVariantPrice, base, { productId: p._id, variantId: p.variantId })}</b> : '—') },
    { label: ts('tx.compare.rating', 'Rating'), has: items.some(p => (p.averageRating ?? 0) > 0), cell: (p: CompareProduct) => ((p.averageRating ?? 0) > 0 ? <TechStars value={p.averageRating ?? 0} /> : '—') },
    { label: ts('tx.compare.availability', 'Availability'), has: items.some(p => p.inStock != null), cell: (p: CompareProduct) => (p.inStock == null ? '—' : p.inStock ? ts('pg.in_stock', 'In stock') : ts('pg.check_availability', 'Check availability')) },
    { label: ts('tx.compare.brand', 'Brand'), has: items.some(p => !!p.vendor), cell: (p: CompareProduct) => p.vendor || '—' },
    { label: ts('tx.compare.type', 'Type'), has: items.some(p => !!(p.productType ?? p.type)), cell: (p: CompareProduct) => p.productType ?? p.type ?? '—' },
    ...Array.from(new Set(items.flatMap(p => p.options.map(o => o.name)))).map(name => ({
      label: name, has: true, cell: (p: CompareProduct) => p.options.find(o => o.name === name)?.values.join(', ') || '—',
    })),
    { label: ts('tx.compare.tags', 'Tags'), has: items.some(p => (p.tags?.length ?? 0) > 0), cell: (p: CompareProduct) => (p.tags?.length ? p.tags.join(', ') : '—') },
  ].filter(r => r.has);
  return (
    <div className="overflow-x-auto" style={{ border: `1px solid ${t.colors.border}` }}>
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{ts('tx.compare.title', 'Compare products')}</caption>
        <thead>
          <tr>
            <td className="w-[120px] p-3" />
            {items.map(p => (
              <th key={p._id} scope="col" className="p-3 text-start align-top font-medium" style={{ minWidth: 160, borderInlineStart: `1px solid ${t.colors.border}` }}>
                {p.image && <img src={p.image} alt="" loading="lazy" className="mb-2 h-24 w-full object-contain" />}
                <Link to={`/product/${handleOf(p)}`} className="no-underline hover:underline" style={{ color: t.colors.ink }}>{p.name}</Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.label} style={{ borderTop: `1px solid ${t.colors.border}`, background: i % 2 === 1 ? t.colors.bgAlt : 'transparent' }}>
              <th scope="row" className="p-3 text-start text-xs font-semibold uppercase" style={{ color: t.colors.inkMuted }}>{r.label}</th>
              {items.map(p => <td key={p._id} className="p-3" style={{ borderInlineStart: `1px solid ${t.colors.border}` }}>{r.cell(p)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A slim bar pinned to the bottom while products are selected, with a button that opens the comparison. */
export function TechCompareBar() {
  const { store } = useStorefront();
  const { items, remove, clear } = useCompare(store.storeId);
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  return (
    <>
      <div role="region" aria-label={ts('tx.compare.title', 'Compare products')} className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-6">
        <div className="mx-auto flex max-w-[900px] flex-wrap items-center gap-3 p-3" style={{ background: t.colors.dark, color: t.colors.darkInk, borderRadius: t.cardRadiusPx, boxShadow: '0 12px 32px -8px rgba(2,2,3,.5)', fontFamily: t.fonts.body }}>
          <BarChart3 size={18} aria-hidden />
          <ul className="m-0 flex min-w-0 flex-1 list-none gap-2 p-0">
            {items.map(p => (
              <li key={p._id} className="relative">
                <span className="grid size-11 place-items-center overflow-hidden" style={{ background: '#fff', borderRadius: t.fieldRadiusPx }}>{p.image ? <img src={p.image} alt={p.name} className="size-full object-contain" /> : <span className="text-[10px] text-black">{p.name.slice(0, 3)}</span>}</span>
                <button type="button" onClick={() => remove(p._id)} aria-label={ts('tx.compare.remove', 'Remove {{name}} from compare', { name: p.name })} className="absolute -end-1.5 -top-1.5 grid size-5 cursor-pointer place-items-center rounded-full border-0 p-0" style={{ background: t.colors.accent, color: t.colors.accentInk }}><X size={11} aria-hidden /></button>
              </li>
            ))}
          </ul>
          <span className="text-xs opacity-70">{items.length}/{COMPARE_MAX}</span>
          <button type="button" onClick={clear} className="cursor-pointer border-0 bg-transparent p-0 text-xs underline" style={{ color: 'inherit' }}>{ts('tx.compare.clear', 'Clear')}</button>
          <TechButton small disabled={items.length < 2} onClick={() => setOpen(true)}>{ts('tx.compare.open', 'Compare')}</TechButton>
        </div>
      </div>
      {open && <TechDialog title={ts('tx.compare.title', 'Compare products')} size="lg" onClose={() => setOpen(false)}>{items.length < 2 ? <p className="m-0 text-sm">{ts('tx.compare.needTwo', 'Pick at least two products to compare.')}</p> : <CompareTable items={items} />}</TechDialog>}
    </>
  );
}
