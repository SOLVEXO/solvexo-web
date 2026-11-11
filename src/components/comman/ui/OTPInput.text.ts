import { siteText } from '@/i18n/site/siteText';

export const OTP_INPUT_TEXT = siteText({
  en: {
    group: (n: number) => `${n}-digit verification code`,
    digit: (i: number, n: number) => `Digit ${i} of ${n}`,
    entered: 'Code entered',
  },
  ar: {
    group: (n: number) => `رمز تحقق من ${n} أرقام`,
    digit: (i: number, n: number) => `الرقم ${i} من ${n}`,
    entered: 'تم إدخال الرمز',
  },
});
