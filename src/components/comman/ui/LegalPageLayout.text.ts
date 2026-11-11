import { siteText } from '@/i18n/site/siteText';

export const LEGAL_LAYOUT_TEXT = siteText({
  en: {
    lastUpdated: (d: string) => `Last updated ${d}`,
    minRead: (n: number) => `${n} min read`,
    print: 'Print',
    copied: 'Copied',
    copyLink: 'Copy Link',
    tocLabel: 'Table of contents',
    onThisPage: 'On this page',
    stillQuestions: 'Still have questions?',
    supportHelp: 'Our support team can help clarify anything in this document.',
    contactSupport: 'Contact Support',
  },
  ar: {
    lastUpdated: (d: string) => `آخر تحديث: ${d}`,
    minRead: (n: number) => `قراءة ${n} د`,
    print: 'طباعة',
    copied: 'تم النسخ',
    copyLink: 'نسخ الرابط',
    tocLabel: 'المحتويات',
    onThisPage: 'في هذه الصفحة',
    stillQuestions: 'لديك أسئلة أخرى؟',
    supportHelp: 'فريق الدعم لدينا جاهز لتوضيح أي جزء من هذه الصفحة.',
    contactSupport: 'تواصل مع الدعم',
  },
});
