import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { fashionTheme as t } from '../../theme.config';
import { moneyText } from '../../../core/checkout/checkoutMath';

export interface SummaryLine { key: string; name: string; quantity: number; amount: number; image?: string | null }

interface Props {
  currency: string;
  lines: SummaryLine[];
  itemCount: number;
  storeName: string;
  subtotal: number;
  /** null = hide the row (digital orders); text shown instead of an amount while it is not known yet. */
  shippingText: string | null;
  tax: number;
  includedTax: number;
  coupon: number;
  giftCard: number;
  storeCredit: number;
  adjustment: number;
  total: number;
  /** Before the checkout exists the figures are a cart estimate. */
  estimate: boolean;
  children?: ReactNode;
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'good' }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt style={{ color: t.colors.inkMuted }}>{label}</dt>
      <dd className="m-0 font-medium" style={{ color: tone === 'good' ? t.colors.success : t.colors.ink }}>{value}</dd>
    </div>
  );
}

/** Sticky on desktop, collapsible on mobile. Every amount is already in `currency`. */
export function OrderSummary({ currency, lines, itemCount, storeName, subtotal, shippingText, tax, includedTax, coupon, giftCard, storeCredit, adjustment, total, estimate, children }: Props) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const m = (n: number) => moneyText(n, currency);
  return (
    <aside aria-label="Order summary" className="lg:sticky lg:top-24" style={{ background: t.colors.bgAlt, borderRadius: 24 }}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls={bodyId}
        className="flex w-full cursor-pointer items-center justify-between gap-3 border-0 bg-transparent px-5 py-4 text-left lg:hidden" style={{ color: t.colors.ink, borderRadius: 24 }}>
        <span className="flex items-center gap-2 text-sm font-medium">Order summary <ChevronDown size={16} aria-hidden style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }} /></span>
        <span className="text-base font-semibold">{m(total)}</span>
      </button>
      <div id={bodyId} className={`${open ? 'block' : 'hidden'} p-5 pt-1 md:p-6 lg:block lg:pt-6`}>
        <h2 className="m-0 mb-5 hidden text-lg font-semibold lg:block">Order summary</h2>
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {lines.map(l => (
            <li key={l.key} className="flex items-center gap-3">
              <span className="relative block size-14 shrink-0">
                <span className="block size-full overflow-hidden" style={{ background: t.colors.bg, borderRadius: 12, border: `1px solid ${t.colors.border}` }}>
                  {l.image && <img src={l.image} alt="" className="size-full object-cover" />}
                </span>
                <span aria-hidden className="absolute -right-2 -top-2 grid min-w-5 place-items-center rounded-full px-1 text-[11px] font-semibold" style={{ background: t.colors.ink, color: t.colors.bg, height: 20 }}>{l.quantity}</span>
              </span>
              <span className="min-w-0 flex-1 text-sm"><span className="line-clamp-2 font-medium">{l.name}</span><span className="sr-only"> quantity {l.quantity}</span></span>
              <span className="shrink-0 text-sm font-medium">{m(l.amount)}</span>
            </li>
          ))}
        </ul>

        {children && <div className="my-5 border-0 border-t pt-5" style={{ borderTopWidth: 1, borderStyle: 'solid', borderColor: t.colors.border }}>{children}</div>}

        <dl className="m-0 mt-5 flex flex-col gap-2.5 text-sm">
          <Row label={`Subtotal (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`} value={m(subtotal)} />
          {coupon > 0 && <Row label="Discount code" value={`-${m(coupon)}`} tone="good" />}
          {giftCard > 0 && <Row label="Gift card" value={`-${m(giftCard)}`} tone="good" />}
          {storeCredit > 0 && <Row label="Store credit" value={`-${m(storeCredit)}`} tone="good" />}
          {adjustment !== 0 && <Row label={adjustment < 0 ? 'Discounts' : 'Adjustments'} value={adjustment < 0 ? `-${m(-adjustment)}` : m(adjustment)} tone={adjustment < 0 ? 'good' : undefined} />}
          {shippingText !== null && <Row label="Shipping" value={shippingText} />}
          {tax > 0 && <Row label="Tax" value={m(tax)} />}
        </dl>

        <div className="mt-5 flex items-baseline justify-between gap-4 border-0 border-t pt-5" style={{ borderTopWidth: 1, borderStyle: 'solid', borderColor: t.colors.border }}>
          <span className="text-base font-semibold">{estimate ? 'Estimated total' : 'Total'}</span>
          <span className="flex items-baseline gap-2"><span className="text-xs" style={{ color: t.colors.inkMuted }}>{currency}</span><span className="text-2xl font-semibold" aria-live="polite">{m(total)}</span></span>
        </div>
        {includedTax > 0 && <p className="m-0 mt-2 text-right text-xs" style={{ color: t.colors.inkMuted }}>Including {m(includedTax)} in taxes</p>}
        <p className="m-0 mt-4 text-xs" style={{ color: t.colors.inkMuted }}>{itemCount} {itemCount === 1 ? 'item' : 'items'} from {storeName}</p>
      </div>
    </aside>
  );
}
