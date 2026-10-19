import type { FormEvent } from 'react';
import { ts } from '@/utils/tStatic';
import type { Checkout } from '@/api/services/checkout';
import { fashionTheme as t } from '../../theme.config';
import { Field, PillButton, TextInput } from '../../ui/primitives';
import type { useStoreCredit } from '../../../useStoreCredit';
import { TextLinkButton } from './CheckoutParts';
import { moneyText } from '../../../core/checkout/checkoutMath';
import type { useCheckoutDiscounts } from '../../../core/checkout/useCheckoutDiscounts';

type Discounts = ReturnType<typeof useCheckoutDiscounts>;
type Credit = ReturnType<typeof useStoreCredit>;

interface CodeFormProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onApply: () => void;
  busy: boolean;
  msg: { text: string; tone: 'ok' | 'error' } | null;
  appliedCode: string | null | undefined;
  onRemove: () => void;
}

function CodeForm({ label, value, onChange, onApply, busy, msg, appliedCode, onRemove }: CodeFormProps) {
  const submit = (e: FormEvent) => { e.preventDefault(); onApply(); };
  return (
    <div className="flex flex-col gap-2">
      {appliedCode ? (
        <div className="flex items-center justify-between gap-3 rounded-full px-4 py-2.5 text-sm" style={{ background: t.colors.bg, border: `1px solid ${t.colors.border}` }}>
          <span className="min-w-0 truncate">{label}: <strong>{appliedCode}</strong></span>
          <TextLinkButton danger onClick={onRemove} disabled={busy}>{ts('checkout.remove', 'Remove')}</TextLinkButton>
        </div>
      ) : (
        <form onSubmit={submit} className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <Field label={label}>{p => <TextInput {...p} autoComplete="off" value={value} onChange={e => onChange(e.target.value)} style={{ minHeight: 44, padding: '10px 16px' }} />}</Field>
          </div>
          <PillButton type="submit" variant="outline" disabled={busy || !value.trim()} style={{ height: 44, padding: '0 20px' }}>{ts('checkout.apply', 'Apply')}</PillButton>
        </form>
      )}
      {msg && <p role={msg.tone === 'error' ? 'alert' : 'status'} className="m-0 text-[13px]" style={{ color: msg.tone === 'error' ? t.colors.danger : t.colors.inkMuted }}>{msg.text}</p>}
    </div>
  );
}

interface Props { checkout: Checkout; discounts: Discounts; credit: Credit; currency: string; storeCreditShown: number }

/** Coupon, gift card and (when the buyer has a balance) store credit - applied against the live checkout. */
export function DiscountPanel({ checkout, discounts: d, credit, currency, storeCreditShown }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <CodeForm label={ts('checkout.discountCode', 'Discount code')} value={d.couponInput} onChange={d.setCouponInput} onApply={d.applyCoupon} busy={d.busy} msg={d.couponMsg} appliedCode={checkout.couponCode} onRemove={d.removeCoupon} />
      <CodeForm label={ts('checkout.giftCard', 'Gift card')} value={d.giftInput} onChange={d.setGiftInput} onApply={d.applyGiftCard} busy={d.busy} msg={d.giftMsg} appliedCode={checkout.giftCardCode} onRemove={d.removeGiftCard} />
      {credit.available && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>
              {checkout.storeCreditApplied
                ? <>{ts('checkout.storeCredit', 'Store credit')} <strong>-{moneyText(storeCreditShown, currency)}</strong> {ts('checkout.applied', 'applied')}</>
                : <>Store credit available: <strong>{moneyText(credit.balance, credit.balanceCurrency)}</strong></>}
            </span>
            {checkout.storeCreditApplied
              ? <TextLinkButton danger onClick={credit.remove} disabled={credit.busy}>{ts('checkout.remove', 'Remove')}</TextLinkButton>
              : <PillButton variant="outline" onClick={credit.apply} loading={credit.busy} style={{ height: 40, padding: '0 18px' }}>{ts('checkout.apply', 'Apply')}</PillButton>}
          </div>
          {credit.msg && !(checkout.storeCreditApplied && credit.msg.startsWith('Applied')) && <p role="status" className="m-0 text-[13px]" style={{ color: t.colors.inkMuted }}>{credit.msg}</p>}
        </div>
      )}
    </div>
  );
}
