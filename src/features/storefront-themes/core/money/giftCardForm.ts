import { ts } from '@/utils/tStatic';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface GiftCardErrors { amount?: string; email?: string }

/** Field validation for the gift card purchase form (pure, so it is easy to test). */
export function validateGiftCard(amount: number | null, recipientEmail: string, isGift = true): GiftCardErrors {
  const errors: GiftCardErrors = {};
  if (!amount) errors.amount = ts('pg.choose_an_amount', 'Choose an amount.');
  // Shopify: the recipient only matters when the card is a gift; otherwise the code goes to the buyer's own email.
  if (!isGift) return errors;
  const email = recipientEmail.trim();
  if (!email) errors.email = ts('pg.enter_the_recipient_s_email', "Enter the recipient's email.");
  else if (!EMAIL_RE.test(email)) errors.email = ts('pg.enter_a_valid_email_address', 'Enter a valid email address.');
  return errors;
}
