import { useState } from 'react';
import { ts } from '@/utils/tStatic';
import { Link } from 'react-router-dom';
import { CheckCircle2, Gift } from 'lucide-react';
import { apiCreateGiftCardPurchaseIntent, type GiftCardPublicSettings } from '@/api/services/giftCards';
import { MaisonCardForm } from '../checkout/MaisonCardForm';
import { isStripeReady } from '../../../core/checkout/stripeLoader';
import { fashionTheme as t } from '../../theme.config';
import { Card, EmptyState, Field, Notice, PillButton, TextArea, TextInput } from '../../ui/primitives';
import { nativeMoneyShort } from '../../../core/money/nativeMoney';
import { validateGiftCard, type GiftCardErrors } from '../../../core/money/giftCardForm';

const dayIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayIso = () => dayIso(new Date());
const yearAheadIso = () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return dayIso(d); };

/** Gift card purchase: choose amount + recipient -> card payment -> confirmation. Amounts stay in the store currency
 *  the card is charged in. */
export function GiftCardPurchase({ settings, storeId, storeName }: { settings: GiftCardPublicSettings; storeId: string; storeName: string }) {
  const [amount, setAmount] = useState<number | null>(null);
  const [isGift, setIsGift] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [sendOn, setSendOn] = useState('');
  const [errors, setErrors] = useState<GiftCardErrors>({});
  const [secret, setSecret] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [apiError, setApiError] = useState('');
  const [done, setDone] = useState(false);

  const start = async () => {
    const found = validateGiftCard(amount, email, isGift);
    setErrors(found);
    if (found.amount || found.email || !amount) return;
    setApiError(''); setCreating(true);
    try {
      const res = await apiCreateGiftCardPurchaseIntent(storeId, isGift
        ? { amount, recipientEmail: email.trim(), recipientName: name.trim() || undefined, message: message.trim() || undefined, sendOn: sendOn || undefined }
        : { amount });
      setSecret(res.data.clientSecret);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : ts('pg.we_could_not_start_your_purchase', 'We could not start your purchase.'));
    } finally { setCreating(false); }
  };

  if (done) {
    return (
      <EmptyState icon={<CheckCircle2 size={26} style={{ color: t.colors.success }} />} title={ts('gift.paymentReceived', 'Payment received')} text={isGift
          ? (sendOn && sendOn > todayIso()
            ? ts('gift.willBeEmailed', 'The gift card code will be emailed to {{email}} on {{date}}.', { email: email.trim(), date: sendOn })
            : ts('pg.the_gift_card_code_is_being_emailed_to', 'The gift card code is being emailed to {{email}}.', { email: email.trim() }))
          : ts('gift.emailedToYou', 'The gift card code is being emailed to you. Check your inbox (and spam folder) in a few minutes.')}
        action={<Link to="/search" className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx }}>{ts('pg.keep_shopping', 'Keep shopping')}</Link>} />
    );
  }

  const preview = (
    <Card tone="soft" className="lg:sticky lg:top-24">
      <div className="flex aspect-[1.6] flex-col justify-between p-5" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: 18 }}>
        <div className="flex items-center justify-between"><span className="text-sm font-semibold">{storeName}</span><Gift size={20} aria-hidden /></div>
        <div>
          <p className="m-0 text-xs" style={{ opacity: 0.7 }}>{ts('checkout.giftCard', 'Gift card')}</p>
          <p className="m-0 text-[clamp(28px,5vw,40px)] font-medium leading-none" aria-live="polite">{amount ? nativeMoneyShort(amount, settings.currency) : '-'}</p>
        </div>
      </div>
      <p className="m-0 mt-4 text-[13px] leading-relaxed" style={{ color: t.colors.inkMuted }}>{ts('pg.already_have_a_gift_card_enter_its_code_', 'Already have a gift card? Enter its code in the gift card box at checkout.')}</p>
    </Card>
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
      <Card>
        {secret ? (
          <div className="flex flex-col gap-5">
            <p className="m-0 text-lg font-semibold">{ts('pg.pay_amount', 'Pay {{amount}}', { amount: amount ? nativeMoneyShort(amount, settings.currency) : '' })}</p>
            {isStripeReady()
              ? <MaisonCardForm clientSecret={secret} amountText={amount ? nativeMoneyShort(amount, settings.currency) : ''} returnUrl={window.location.href} onConfirmed={() => setDone(true)} />
              : <Notice tone="error">{ts('pg.card_payments_are_not_configured_yet', 'Card payments are not configured yet.')}</Notice>}
            <div><PillButton variant="ghost" onClick={() => setSecret(null)}>{ts('pg.change_details', 'Change details')}</PillButton></div>
          </div>
        ) : (
          <form className="flex flex-col gap-6" noValidate onSubmit={e => { e.preventDefault(); void start(); }}>
            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-2 p-0 text-sm font-medium">{ts('gift.chooseAmount', 'Choose an amount')} <span aria-hidden style={{ color: t.colors.danger }}>*</span></legend>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {settings.denominations.map(d => {
                  const on = amount === d;
                  return (
                    <label key={d} className="relative grid min-h-12 cursor-pointer place-items-center text-[15px] font-semibold focus-within:ring-2 focus-within:ring-offset-2" style={{ borderRadius: 14, border: `1px solid ${on ? t.colors.accent : t.colors.border}`, background: on ? t.colors.accent : t.colors.bg, color: on ? t.colors.accentInk : t.colors.ink }}>
                      <input type="radio" name="gift-amount" value={d} checked={on} onChange={() => { setAmount(d); setErrors(e => ({ ...e, amount: undefined })); }} className="sr-only" />
                      {nativeMoneyShort(d, settings.currency)}
                    </label>
                  );
                })}
              </div>
              {errors.amount && <p role="alert" className="m-0 mt-2 text-[13px]" style={{ color: t.colors.danger }}>{errors.amount}</p>}
            </fieldset>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input type="checkbox" className="mt-1" checked={isGift} onChange={e => { setIsGift(e.target.checked); setErrors(er => ({ ...er, email: undefined })); }} />
              <span>
                <span className="font-medium">{ts('gift.sendAsGift', 'Send as a gift')}</span>
                <span className="block text-[13px]" style={{ color: t.colors.inkMuted }}>
                  {isGift
                    ? ts('gift.giftHint', 'We email the code to your recipient and send you a confirmation.')
                    : ts('gift.selfHint', 'The code will be emailed to you.')}
                </span>
              </span>
            </label>
            {isGift && (
              <>
                <Field label={ts('gift.recipientEmail', 'Recipient email')} required error={errors.email}>
                  {p => <TextInput {...p} type="email" autoComplete="off" value={email} onChange={e => setEmail(e.target.value)} invalid={!!errors.email} />}
                </Field>
                <Field label={ts('checkout.recipientName', 'Recipient name')} hint={ts('pg.optional', 'Optional')}>
                  {p => <TextInput {...p} value={name} onChange={e => setName(e.target.value)} />}
                </Field>
                <Field label={ts('gift.message', 'Message')} hint={ts('pg.optional', 'Optional')}>
                  {p => <TextArea {...p} value={message} onChange={e => setMessage(e.target.value)} rows={3} />}
                </Field>
                <Field label={ts('gift.sendOn', 'Send on')} hint={ts('gift.sendOnHint', 'Optional. Leave empty to send it right after payment.')}>
                  {p => <TextInput {...p} type="date" value={sendOn} min={todayIso()} max={yearAheadIso()} onChange={e => setSendOn(e.target.value)} />}
                </Field>
              </>
            )}
            {apiError && <Notice tone="error">{apiError}</Notice>}
            <div><PillButton type="submit" loading={creating}>{ts('pg.continue_to_payment', 'Continue to payment')}</PillButton></div>
          </form>
        )}
      </Card>
      {preview}
    </div>
  );
}
