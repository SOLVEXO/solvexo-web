import { useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { apiApplyCoupon, apiApplyGiftCard, apiRemoveCoupon, apiRemoveGiftCard, type Checkout } from '@/api/services/checkout';
import { moneyText } from './checkoutMath';
import { ts } from '@/utils/tStatic';

interface Args {
  checkout: Checkout | null;
  setCheckout: Dispatch<SetStateAction<Checkout | null>>;
  /** Store credit is the outermost discount layer: re-settle it after any coupon / gift card change. */
  resyncCredit: () => Promise<void>;
}

interface Msg { text: string; tone: 'ok' | 'error' }

/** Coupon + gift card apply / remove. Amounts in the responses are already in the checkout currency. */
export function useCheckoutDiscounts({ checkout, setCheckout, resyncCredit }: Args) {
  const [couponInput, setCouponInput] = useState('');
  const [giftInput, setGiftInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<Msg | null>(null);
  const [giftMsg, setGiftMsg] = useState<Msg | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);

  const run = async (fn: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try { await fn(); } finally { lock.current = false; setBusy(false); }
  };

  const applyCoupon = () => run(async () => {
    const code = couponInput.trim();
    if (!checkout || !code) return;
    setCouponMsg(null);
    try {
      const res = await apiApplyCoupon({ checkoutId: checkout._id, code });
      setCheckout(c => c && { ...c, couponCode: res.data.couponCode, couponDiscountUSD: res.data.couponDiscountUSD, totalAmount: res.data.totalAmount });
      await resyncCredit();
      setCouponMsg({ text: ts('pg.applied_you_saved_amount', 'Applied - you saved {{amount}}.', { amount: moneyText(res.data.couponDiscountUSD, checkout.currency) }), tone: 'ok' });
      setCouponInput('');
    } catch (err) {
      setCouponMsg({ text: err instanceof Error ? err.message : ts('pg.invalid_coupon_code', 'Invalid coupon code.'), tone: 'error' });
    }
  });

  const removeCoupon = () => run(async () => {
    if (!checkout) return;
    try {
      const res = await apiRemoveCoupon(checkout._id);
      // The server resets the discount stack on removal, so both layers are cleared locally too.
      setCheckout(c => c && { ...c, couponCode: null, couponDiscountUSD: 0, giftCardCode: null, giftCardDiscountUSD: 0, totalAmount: res.data.totalAmount });
      await resyncCredit();
      setCouponMsg(null);
      setGiftMsg(checkout.giftCardCode ? { text: ts('pg.your_gift_card_was_removed_with_the', 'Your gift card was removed with the coupon - apply it again if you still want to use it.'), tone: 'ok' } : null);
    } catch (err) {
      setCouponMsg({ text: err instanceof Error ? err.message : ts('pg.could_not_remove_the_coupon', 'Could not remove the coupon.'), tone: 'error' });
    }
  });

  const applyGiftCard = () => run(async () => {
    const code = giftInput.trim();
    if (!checkout || !code) return;
    setGiftMsg(null);
    try {
      const res = await apiApplyGiftCard({ checkoutId: checkout._id, code });
      setCheckout(c => c && { ...c, giftCardCode: res.data.giftCardCode, giftCardDiscountUSD: res.data.giftCardDiscountUSD, totalAmount: res.data.totalAmount });
      await resyncCredit();
      setGiftMsg({ text: ts('pg.applied_amount_used', 'Applied - {{amount}} used.', { amount: moneyText(res.data.giftCardDiscountUSD, checkout.currency) }), tone: 'ok' });
      setGiftInput('');
    } catch (err) {
      setGiftMsg({ text: err instanceof Error ? err.message : ts('checkout.err.giftCard', 'Invalid gift card code.'), tone: 'error' });
    }
  });

  const removeGiftCard = () => run(async () => {
    if (!checkout) return;
    try {
      const res = await apiRemoveGiftCard(checkout._id);
      setCheckout(c => c && { ...c, giftCardCode: null, giftCardDiscountUSD: 0, couponCode: null, couponDiscountUSD: 0, totalAmount: res.data.totalAmount });
      await resyncCredit();
      setGiftMsg(null);
      setCouponMsg(checkout.couponCode ? { text: ts('pg.your_coupon_was_removed_with_the_gift', 'Your coupon was removed with the gift card - apply it again if you still want to use it.'), tone: 'ok' } : null);
    } catch (err) {
      setGiftMsg({ text: err instanceof Error ? err.message : ts('pg.could_not_remove_the_gift_card', 'Could not remove the gift card.'), tone: 'error' });
    }
  });

  return { couponInput, setCouponInput, giftInput, setGiftInput, couponMsg, giftMsg, busy, applyCoupon, removeCoupon, applyGiftCard, removeGiftCard };
}
