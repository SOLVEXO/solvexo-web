import { siteText } from '@/i18n/site/siteText';

// Page chrome only: the questions, answers and category names come from the FAQ API and show as stored.
export const FAQ_TEXT = siteText({
  en: {
    pageTitle: 'FAQ',
    title: 'Frequently asked questions',
    subtitle: 'Find answers about your account, orders, payments and more.',
    searchPlaceholder: 'Search for a question…',
    all: 'All',
    tryAgain: 'Try again',
    loadFailed: 'Failed to load FAQs.',
    noResults: (query: string) => `No FAQs found${query ? ` for "${query}"` : ''}.`,
    stillNeedHelp: 'Still need help?',
    stillNeedHelpBody: "Can't find what you're looking for? Our support team is here for you.",
    contactUs: 'Contact Us',
  },
  ar: {
    pageTitle: 'الأسئلة الشائعة',
    title: 'الأسئلة الشائعة',
    subtitle: 'اعثر على إجابات حول حسابك وطلباتك ومدفوعاتك والمزيد.',
    searchPlaceholder: 'ابحث عن سؤال…',
    all: 'الكل',
    tryAgain: 'حاول مرة أخرى',
    loadFailed: 'تعذّر تحميل الأسئلة الشائعة.',
    noResults: (query: string) => (query ? `لا توجد أسئلة مطابقة لـ "${query}".` : 'لا توجد أسئلة شائعة.'),
    stillNeedHelp: 'هل ما زلت بحاجة إلى مساعدة؟',
    stillNeedHelpBody: 'لم تجد ما تبحث عنه؟ فريق الدعم لدينا جاهز لمساعدتك.',
    contactUs: 'تواصل معنا',
  },
});
