const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface GiftCardErrors { amount?: string; email?: string }

/** Field validation for the gift card purchase form (pure, so it is easy to test). */
export function validateGiftCard(amount: number | null, recipientEmail: string): GiftCardErrors {
  const errors: GiftCardErrors = {};
  if (!amount) errors.amount = 'Choose an amount.';
  const email = recipientEmail.trim();
  if (!email) errors.email = "Enter the recipient's email.";
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
  return errors;
}
