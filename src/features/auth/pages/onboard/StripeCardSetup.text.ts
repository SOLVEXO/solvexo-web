import { siteText } from '@/i18n/site/siteText';

/** Our own labels around Stripe's card fields. Stripe's fields and Stripe's own error messages are shown as Stripe renders them. */
export const STRIPE_CARD_SETUP_TEXT = siteText({
  en: {
    cardNumber: 'Card number',
    expiry: 'MM / YY',
    cvc: 'CVV',
    address: 'Address',
    postalCode: 'Postal code',
    country: 'Country/region',
    city: 'City',
    loadFailed: 'The card form could not be loaded.',
    loadFailedPrefix: (msg: string) => `Card form failed to load: ${msg}`,
    paymentFailed: 'Payment failed. Please check your details and try again.',
    setupFailed: 'Card setup failed. Please check your details and try again.',
    paymentIncomplete: 'Payment did not complete. Please try again.',
    setupIncomplete: 'Card setup did not complete. Please try again.',
    submit: 'Save Card & Continue',
    footnote: 'Your card is encrypted and secured by Stripe — you won\'t be charged today',
  },
  ar: {
    cardNumber: 'رقم البطاقة',
    expiry: 'MM / YY',
    cvc: 'CVV',
    address: 'العنوان',
    postalCode: 'الرمز البريدي',
    country: 'الدولة/المنطقة',
    city: 'المدينة',
    loadFailed: 'تعذّر تحميل نموذج البطاقة.',
    loadFailedPrefix: (msg: string) => `تعذّر تحميل نموذج البطاقة: ${msg}`,
    paymentFailed: 'فشل الدفع. يُرجى التحقق من بياناتك والمحاولة مرة أخرى.',
    setupFailed: 'تعذّر حفظ البطاقة. يُرجى التحقق من بياناتك والمحاولة مرة أخرى.',
    paymentIncomplete: 'لم تكتمل عملية الدفع. يُرجى المحاولة مرة أخرى.',
    setupIncomplete: 'لم يكتمل حفظ البطاقة. يُرجى المحاولة مرة أخرى.',
    submit: 'حفظ البطاقة والمتابعة',
    footnote: 'بطاقتك مشفّرة ومحمية بواسطة Stripe — لن يتم الخصم اليوم',
  },
});
