import { localePath } from '@/i18n';
import { ts } from '@/utils/tStatic';
import { Banknote, CreditCard, Landmark, Loader2, PackageCheck } from 'lucide-react';
import { fashionTheme as t } from '../../theme.config';
import { Field, Notice, PillButton, SkeletonBlock, TextInput } from '../../ui/primitives';
import { Hint, RadioRow, StepCard, TextLinkButton } from './CheckoutParts';
import { MaisonCardForm } from './MaisonCardForm';
import { moneyText } from '../../../core/checkout/checkoutMath';
import type { PayOption } from '../../../core/checkout/payOptions';
import type { useCheckoutPayment } from '../../../core/checkout/useCheckoutPayment';
import type { useStoreCredit } from '../../../useStoreCredit';

type Pay = ReturnType<typeof useCheckoutPayment>;
type Credit = ReturnType<typeof useStoreCredit>;

export interface PaymentStepProps {
  step: number;
  storeName: string;
  currency: string;
  total: number;
  checkoutId: string | null;
  /** What to tell the buyer while the checkout is not ready yet (null = it is, or it is being created). */
  waitingFor: string | null;
  creating: boolean;
  createError: string | null;
  /** Make a brand-new checkout (retry / the old one expired). */
  restart: () => void;
  creditCoversAll: boolean;
  credit: Credit;
  creditPlacing: boolean;
  onPlaceWithCredit: () => void;
  pay: Pay;
  emailOffers: boolean;
  setEmailOffers: (v: boolean) => void;
}

function methodIcon(o: PayOption) {
  if (o.kind === 'stripe') return <CreditCard size={16} aria-hidden />;
  if (o.kind === 'cod') return <Banknote size={16} aria-hidden />;
  if (o.kind === 'manual') return <Landmark size={16} aria-hidden />;
  return <CreditCard size={16} aria-hidden />;
}

function ErrorWithRestart({ message, stale, restart }: { message: string; stale: boolean; restart: () => void }) {
  return (
    <Notice tone="error" action={stale ? <TextLinkButton onClick={restart}>{ts('checkout.startOver', 'Start over')}</TextLinkButton> : undefined}>
      {message}{stale ? ` ${ts('checkout.staleNotice', 'Your checkout is no longer valid - start over to continue.')}` : ''}
    </Notice>
  );
}

function Consent({ value, onChange, storeName }: { value: boolean; onChange: (v: boolean) => void; storeName: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="size-4" style={{ accentColor: t.colors.accent }} />
      {ts('pg.email_me_with_news_and_offers_from_store', 'Email me with news and offers from {{store}}', { store: storeName })}
    </label>
  );
}

function MethodPanel({ p, pay, currency, total, checkoutId }: { p: PayOption; pay: Pay; currency: string; total: number; checkoutId: string | null }) {
  if (p.kind === 'stripe') {
    if (pay.poll.polling) {
      return (
        <div role="status" aria-live="polite" className="grid place-items-center gap-3 py-8 text-center">
          <Loader2 size={24} className="animate-spin" aria-hidden />
          <p className="m-0 text-sm font-medium">{ts('checkout.confirmingPay', 'Confirming your payment...')}</p>
          <Hint>{ts('checkout.keepOpen', 'Please keep this page open.')}</Hint>
        </div>
      );
    }
    if (pay.poll.status === 'failed') {
      return <Notice tone="error" action={<TextLinkButton onClick={pay.retryCard}>{ts('checkout.tryAgain', 'Try again')}</TextLinkButton>}>{ts('checkout.payNotConfirmed', 'Payment could not be confirmed. You have not been charged for an order - please try again.')}</Notice>;
    }
    if (pay.poll.timedOut) {
      return (
        <div className="flex flex-col gap-3">
          <Notice>{ts('checkout.payReceived', 'Your payment was received and is still being confirmed. This can take a minute - you will get an email once your order is placed.')}</Notice>
          <div><TextLinkButton onClick={pay.poll.start}>{ts('checkout.checkAgain', 'Check again')}</TextLinkButton></div>
        </div>
      );
    }
    if (pay.card.error) return <Notice tone="error" action={<TextLinkButton onClick={pay.retryCard}>{ts('cart.retry', 'Retry')}</TextLinkButton>}>{pay.card.error}</Notice>;
    if (pay.card.loading || !pay.card.secret) return <SkeletonBlock h={120} />;
    return (
      <MaisonCardForm
        clientSecret={pay.card.secret}
        amountText={moneyText(pay.card.amount ?? total, currency)}
        returnUrl={`${window.location.origin}${localePath(`/checkout/${checkoutId}/return`)}`}
        onConfirmed={pay.onCardConfirmed}
      />
    );
  }

  if (p.kind === 'cod') {
    return (
      <PillButton full loading={pay.busy} onClick={pay.placeCod}>
        {!pay.busy && <PackageCheck size={16} aria-hidden />}{pay.busy ? ts('checkout.placingOrder', 'Placing order…') : ts('checkout.placeOrderLower', 'Place order')}
      </PillButton>
    );
  }

  const manual = p.kind === 'manual';
  const easypaisa = p.provider === 'easypaisa';
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 whitespace-pre-line text-sm leading-relaxed" style={{ color: t.colors.inkMuted }}>
        {manual
          ? (p.instructions || ts('checkout.manualInstructions', 'Place your order, then pay the store directly as described by them. Your order is confirmed once they receive your payment.'))
          : easypaisa
            ? ts('checkout.easypaisaNotice', 'You will get a payment request in your Easypaisa app. Approve it there to place your order.')
            : ts('checkout.redirectNotice', 'You will be taken to {{name}} to complete your payment securely, then brought back here.', { name: p.label })}
      </p>
      {manual && total > 0 && (
        // The seller's text may name another currency ("pay in PKR"): always show what this order totals in the checkout currency.
        <p className="m-0 text-sm font-medium">{ts('checkout.total', 'Total')}: <bdi>{moneyText(total, currency)}</bdi></p>
      )}
      {easypaisa && (
        <Field label={ts('checkout.easypaisaAria', 'Easypaisa account number')} hint={ts('checkout.easypaisaFieldHint', 'Leave empty to use your delivery phone number.')}>
          {f => <TextInput {...f} type="tel" inputMode="tel" autoComplete="tel" placeholder={ts('checkout.walletPlaceholder', '03XXXXXXXXX')} value={pay.walletAccount} onChange={e => pay.setWalletAccount(e.target.value)} />}
        </Field>
      )}
      <PillButton full loading={pay.busy} onClick={() => (manual && p.methodId ? pay.placeManual(p.methodId) : pay.payWithGateway(p.provider ?? ''))}>
        {manual ? (pay.busy ? ts('checkout.placingOrder', 'Placing order…') : ts('checkout.placeOrderLower', 'Place order')) : easypaisa ? ts('checkout.payEasypaisa', 'Pay with Easypaisa') : pay.redirecting ? ts('checkout.redirecting', 'Redirecting...') : ts('checkout.continueTo', 'Continue to {{name}}', { name: p.label })}
      </PillButton>
    </div>
  );
}

export function PaymentStep(props: PaymentStepProps) {
  const { step, storeName, currency, total, checkoutId, waitingFor, creating, createError, restart, creditCoversAll, credit, creditPlacing, onPlaceWithCredit, pay, emailOffers, setEmailOffers } = props;

  let body;
  if (createError) {
    body = (
      <div className="flex flex-col gap-3">
        <Notice tone="error" action={<TextLinkButton onClick={restart}>{ts('checkout.tryAgain', 'Try again')}</TextLinkButton>}>{createError}</Notice>
      </div>
    );
  } else if (waitingFor) {
    body = <Hint>{waitingFor}</Hint>;
  } else if (creating || !checkoutId) {
    body = <div role="status" aria-label={ts('checkout.preparingPayment', 'Preparing your payment options')}><SkeletonBlock h={64} rows={2} /></div>;
  } else if (creditCoversAll) {
    body = (
      <div className="flex flex-col gap-4">
        <Hint>{ts('checkout.creditCovers', 'Your store credit covers the full amount - no payment needed.')}</Hint>
        {credit.placeError && <Notice tone="error">{credit.placeError}</Notice>}
        <Consent value={emailOffers} onChange={setEmailOffers} storeName={storeName} />
        <PillButton full loading={creditPlacing || credit.placing} onClick={onPlaceWithCredit}>
          {!(creditPlacing || credit.placing) && <PackageCheck size={16} aria-hidden />}{creditPlacing || credit.placing ? ts('checkout.placingOrder', 'Placing order…') : ts('checkout.placeOrderLower', 'Place order')}
        </PillButton>
      </div>
    );
  } else if (pay.options.length === 0) {
    body = (
      <div className="flex flex-col gap-3">
        {pay.extrasError && <Notice tone="error" action={<TextLinkButton onClick={pay.retryExtras}>{ts('cart.retry', 'Retry')}</TextLinkButton>}>{ts('checkout.extrasError', 'Some payment methods could not be loaded.')}</Notice>}
        {pay.extrasLoading ? <SkeletonBlock h={64} /> : <Hint>{ts('checkout.noPaymentMethods', 'No payment methods are available for this order yet.')}</Hint>}
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col gap-4">
        {pay.extrasError && <Notice tone="error" action={<TextLinkButton onClick={pay.retryExtras}>{ts('cart.retry', 'Retry')}</TextLinkButton>}>{ts('checkout.extrasError', 'Some payment methods could not be loaded.')}</Notice>}
        <div role="radiogroup" aria-label={ts('checkout.paymentMethodAria', 'Payment method')} className="flex flex-col gap-3">
          {pay.options.map(o => (
            <RadioRow key={o.key} name="payment-method" checked={pay.selected?.key === o.key} onChange={() => pay.choose(o.key)} label={o.label}>
              <div className="flex items-center gap-3">
                {o.logo ? <img src={o.logo} alt="" className="h-5 w-auto max-w-[56px] object-contain" /> : methodIcon(o)}
                <div className="min-w-0">
                  <p className="m-0 text-sm font-medium">{o.label}</p>
                  <p className="m-0 text-xs" style={{ color: t.colors.inkMuted }}>{o.hint}</p>
                </div>
              </div>
            </RadioRow>
          ))}
        </div>
        {pay.error && <ErrorWithRestart message={pay.error.message} stale={pay.error.stale} restart={restart} />}
        {pay.selected && (
          <div className="flex flex-col gap-4 pt-1" aria-live="polite">
            <Consent value={emailOffers} onChange={setEmailOffers} storeName={storeName} />
            <MethodPanel p={pay.selected} pay={pay} currency={currency} total={total} checkoutId={checkoutId} />
          </div>
        )}
      </div>
    );
  }

  return <StepCard step={step} title={ts('checkout.paymentTitle', 'Payment')}>{body}</StepCard>;
}
