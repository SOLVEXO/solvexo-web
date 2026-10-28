import { useCallback, useRef, useState } from 'react';
import { ts } from '@/utils/tStatic';
import { Link } from 'react-router-dom';
import { apiListPublicStorePages } from '@/api/services/storePages';
import { apiSubscribeMeToStore } from '@/api/services/newsletter';
import type { CartItem } from '@/api/services/cart';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { trackPixelEvent } from '@/utils/trackingPixels';
import { fashionTheme as t } from '../../theme.config';
import { Card, Notice, Page, PageTitle } from '../../ui/primitives';
import { useStoreCredit } from '../../../useStoreCredit';
import { useGuestContact } from '../../../useGuestContact';
import { useLoad } from '../../../core/pageHooks';
import { AddressStep } from './AddressStep';
import { markBuyNowCheckout } from '../../../core/checkout/buyNowMarker';
import type { PlacedLike } from '../../../core/checkout/checkoutApi';
import { cartSignature, moneyText, placedTotal, reconcileSummary } from '../../../core/checkout/checkoutMath';
import { ContactStep } from './ContactStep';
import { DiscountPanel } from './DiscountPanel';
import { OrderNoteField } from './OrderNoteField';
import { OrderSummary, type SummaryLine } from './OrderSummary';
import { PaymentStep } from './PaymentStep';
import { ShippingStep } from './ShippingStep';
import type { ShipOption } from '../../../core/checkout/shippingOptions';
import { useAddressBook } from '../../../core/checkout/useAddressBook';
import { useCheckoutCreation } from '../../../core/checkout/useCheckoutCreation';
import { useCheckoutDiscounts } from '../../../core/checkout/useCheckoutDiscounts';
import { useCheckoutPayment } from '../../../core/checkout/useCheckoutPayment';
import { useShippingChoice } from '../../../core/checkout/useShippingChoice';

interface Props {
  storeId: string;
  storeName: string;
  baseCurrency: string;
  /** The cart lines being checked out (all of them, or just the "buy it now" line). */
  items: CartItem[];
  buyNow: { productId: string; variantId: string } | null;
  guest: boolean;
  loggedIn: boolean;
  onPlaced: (orders: PlacedLike[], guestEmail: string | null) => void;
}

const lineImage = (i: CartItem) => i.image?.[0] ?? i.images?.[0] ?? null;

/** The interactive checkout: contact -> address -> delivery -> payment on the left, live summary on the right. */
export function CheckoutBody({ storeId, storeName, baseCurrency, items, buyNow, guest, loggedIn, onPlaced }: Props) {
  const { convert, convertTo, currency: displayCurrency } = useCurrencyPreference();
  const isDigital = items.length > 0 && items.every(i => i.type === 'digital');

  const guestContact = useGuestContact(guest);
  const book = useAddressBook(!isDigital);
  const [zoneCurrency, setZoneCurrency] = useState(baseCurrency);
  const ship = useShippingChoice({ storeId, enabled: !isDigital, address: book.selected, zoneCurrency });

  const guestReady = !guest || guestContact.valid || guestContact.committedEmail !== '';
  const addressOk = isDigital || ship.pickupSelected || !!book.selected;
  const shippingOk = isDigital || ship.chosen;
  const ready = guestReady && addressOk && shippingOk;
  const choiceKey = JSON.stringify([isDigital ? '' : ship.pickupSelected ? 'pickup' : (book.selected?._id ?? ''), ship.multiGroup ? ship.picksKey : ship.singleId]);

  const guestCommit = guestContact.commit;
  const guestName = book.selected?.recipientName;
  const creation = useCheckoutCreation({
    storeId, ready, isDigital, pickup: !!ship.pickupSelected, addressId: book.selected?._id ?? null,
    multiGroup: ship.multiGroup, selections: ship.selections, rateId: ship.singleId, rateIsLive: ship.single?.kind === 'live',
    choiceKey, buyNow, cartSig: cartSignature(items), guest,
    commitGuest: () => guestCommit(guestName), onCurrency: setZoneCurrency,
  });
  const { checkout, summary, setCheckout } = creation;

  const credit = useStoreCredit({ storeId, checkout, setCheckout, loggedIn: loggedIn && !guest });
  const creditCoversAll = !!checkout?.storeCreditApplied && checkout.totalAmount <= 0;
  const discounts = useCheckoutDiscounts({ checkout, setCheckout, resyncCredit: credit.resync });

  // --- finishing: one-time side effects when an order is placed ---
  const [emailOffers, setEmailOffers] = useState(false);
  const consentSent = useRef(false);
  const recordConsent = useCallback(() => {
    if (!emailOffers || consentSent.current) return;
    consentSent.current = true;
    apiSubscribeMeToStore(storeId).catch(() => { /* never blocks the order */ });
  }, [emailOffers, storeId]);
  const finished = useRef(false);
  const finish = useCallback((orders: PlacedLike[]) => {
    if (finished.current) return;
    finished.current = true;
    recordConsent();
    const tot = placedTotal(orders);
    trackPixelEvent('Purchase', { value: tot.amount, currency: tot.currency, contentIds: orders.map(o => o.orderId) });
    onPlaced(orders, guest ? guestContact.committedEmail : null);
  }, [recordConsent, onPlaced, guest, guestContact.committedEmail]);

  const checkoutId = checkout?._id;
  const onCommit = useCallback(() => {
    recordConsent();
    if (buyNow && checkoutId) markBuyNowCheckout(checkoutId);
  }, [recordConsent, buyNow, checkoutId]);
  const pay = useCheckoutPayment({ checkout, allowed: creation.allowed, creditCoversAll, onOrdersPlaced: finish, onCommit });

  const creditLock = useRef(false);
  const [creditPlacing, setCreditPlacing] = useState(false);
  const placeWithCredit = async () => {
    if (creditLock.current || !creditCoversAll) return;
    creditLock.current = true; setCreditPlacing(true);
    try {
      const orders = await credit.place();
      if (orders) { finish(orders); }
    } finally { creditLock.current = false; setCreditPlacing(false); }
  };

  // --- policy links ---
  const policies = useLoad(
    () => apiListPublicStorePages(storeId).then(r => r.data.filter(p => p.policyType === 'privacy_policy' || p.policyType === 'terms_of_service')).catch(() => []),
    [storeId],
  );
  const privacy = policies.data?.find(p => p.policyType === 'privacy_policy');
  const terms = policies.data?.find(p => p.policyType === 'terms_of_service');

  // --- figures: every amount below is expressed in `currency` (never a native amount with the wrong symbol) ---
  // Before the checkout exists (address not saved yet) the estimate is in the shopper's own currency with the market's
  // prices, exactly like the cart; once the server creates the checkout, its currency and amounts take over.
  const currency = checkout?.currency ?? displayCurrency ?? baseCurrency;
  const estimateOf = (i: CartItem) => {
    const unit = i.unitPrice ?? i.price ?? 0;
    const plain = i.itemTotal == null || Math.abs(i.itemTotal - unit * i.quantity) < 0.005;
    return plain
      ? convert(unit, i.currency, { productId: i.productId, variantId: i.productVariantId }) * i.quantity
      : convertTo(i.itemTotal as number, i.currency, currency);
  };
  const lines: SummaryLine[] = checkout
    ? checkout.items.map(i => ({ key: i.variantId, name: i.name, quantity: i.quantity, amount: convertTo(i.totalPrice, i.currency, currency), image: i.image }))
    : items.map(i => ({ key: i.productVariantId, name: i.name, quantity: i.quantity, amount: estimateOf(i), image: lineImage(i) }));
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = checkout ? checkout.subtotal : items.reduce((s, i) => s + estimateOf(i), 0);
  const coupon = checkout?.couponDiscountUSD ?? 0;
  const giftCard = checkout?.giftCardDiscountUSD ?? 0;
  const storeCredit = checkout?.storeCreditDiscountTotalUSD ?? 0;
  const shippingFee = checkout?.shippingFee ?? 0;
  const total = checkout ? checkout.totalAmount : subtotal;
  const rows = checkout
    ? reconcileSummary({ currency, subtotal, shipping: isDigital ? 0 : shippingFee, tax: checkout.taxAmount ?? 0, coupon, giftCard, storeCredit, total })
    : { tax: 0, adjustment: 0 };
  const shippingText = isDigital ? null : checkout ? (shippingFee === 0 ? ts('checkout.free', 'Free') : moneyText(shippingFee, currency)) : ts('checkout.calculatedNext', 'Calculated next');

  const priceText = (o: ShipOption) => {
    const amount = o.priceCurrency === currency ? o.price : convertTo(o.price, o.priceCurrency, currency);
    return amount === 0 ? ts('checkout.free', 'Free') : moneyText(amount, currency);
  };

  const waitingFor = guest && guestContact.dirty && !creation.creating
    ? ts('checkout.confirmEmail', 'Enter and confirm your email above to continue to payment.')
    : !checkout && !creation.creating && !creation.error && !ready
      ? (!guestReady ? ts('checkout.enterEmail', 'Enter your email above to continue to payment.') : !shippingOk ? ts('checkout.chooseDelivery', 'Choose a delivery option to continue to payment.') : ts('checkout.saveAddressFirst', 'Save your delivery address to continue to payment.'))
      : null;

  let step = 1;
  const contactStep = guest ? step++ : 0;
  const addressStep = isDigital ? 0 : step++;
  const shippingStep = isDigital ? 0 : step++;
  const paymentStep = step;

  return (
    <Page>
      <PageTitle actions={<Link to="/cart" className="text-sm" style={{ color: t.colors.inkMuted }}>{ts('checkout.backToCart', 'Back to cart')}</Link>}>{ts('h.secure_checkout', 'Secure *checkout*')}</PageTitle>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
        <div className="order-2 flex min-w-0 flex-col gap-5 lg:order-1">
          {checkout && checkout.currency !== displayCurrency && (
            <Notice>{ts('pg.this_store_charges_in_currency_so_the', 'This store charges in {{currency}}, so the amounts at checkout are shown in {{currency}}.', { currency: checkout.currency })}</Notice>
          )}
          {guest && (
            <ContactStep
              step={contactStep} email={guestContact.email} saving={guestContact.saving} error={guestContact.error}
              done={guestContact.valid && !guestContact.dirty}
              onChange={v => { guestContact.setEmail(v); guestContact.setError(''); }}
              onBlur={() => { if (guestContact.valid) void guestContact.commit(guestName); }}
            />
          )}
          {!isDigital && <AddressStep step={addressStep} book={book} pickup={!!ship.pickupSelected} />}
          {!isDigital && <ShippingStep step={shippingStep} ship={ship} priceText={priceText} dutiesNotice={!!summary?.internationalDutiesNotice} addressReady={addressOk} />}
          {checkout && <Card><OrderNoteField key={checkout._id} checkoutId={checkout._id} initial={checkout.customerNote} /></Card>}
          <PaymentStep
            step={paymentStep} storeName={storeName} currency={currency} total={total} checkoutId={checkout?._id ?? null}
            waitingFor={waitingFor} creating={creation.creating} createError={creation.error} restart={creation.restart}
            creditCoversAll={creditCoversAll} credit={credit} creditPlacing={creditPlacing} onPlaceWithCredit={placeWithCredit}
            pay={pay} emailOffers={emailOffers} setEmailOffers={setEmailOffers}
          />
          {(privacy || terms) && (
            <p className="m-0 text-center text-xs" style={{ color: t.colors.inkMuted }}>
              {ts('checkout.agreePrefix', 'By placing your order, you agree to our')}{' '}
              {privacy && <Link to={`/${privacy.slug}`} style={{ color: 'inherit' }}>{ts('checkout.privacyPolicy', 'Privacy Policy')}</Link>}
              {privacy && terms && ` ${ts('checkout.and', 'and')} `}
              {terms && <Link to={`/${terms.slug}`} style={{ color: 'inherit' }}>{ts('checkout.terms', 'Terms of Service')}</Link>}.
            </p>
          )}
        </div>
        <div className="order-1 min-w-0 lg:order-2">
          <OrderSummary
            currency={currency} lines={lines} itemCount={itemCount} storeName={storeName} subtotal={subtotal} shippingText={shippingText}
            tax={rows.tax} includedTax={summary?.includedTaxAmount ?? 0} coupon={coupon} giftCard={giftCard} storeCredit={storeCredit}
            adjustment={rows.adjustment} total={total} estimate={!checkout}
          >
            {checkout ? <DiscountPanel checkout={checkout} discounts={discounts} credit={credit} currency={currency} storeCreditShown={storeCredit} /> : null}
          </OrderSummary>
        </div>
      </div>
    </Page>
  );
}

