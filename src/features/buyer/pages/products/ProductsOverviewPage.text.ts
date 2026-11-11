import { siteText } from '@/i18n/site/siteText';

export const PRODUCTS_OVERVIEW_TEXT = siteText({
  en: {
    pageTitle: 'Products',
    kicker: 'One platform',
    title: 'Every product you need to run a business.',
    subtitle: 'Store, POS, AI tools and analytics — under one login, sharing the same real data.',
    explore: (name: string) => `Explore ${name}`,
    ctaTitle: 'Start with the free plan, add what you need.',
    startSelling: 'Start Selling Free',
  },
  ar: {
    pageTitle: 'المنتجات',
    kicker: 'منصة واحدة',
    title: 'كل المنتجات التي تحتاجها لإدارة عملك.',
    subtitle: 'المتجر ونقطة البيع وأدوات الذكاء الاصطناعي والتحليلات — بتسجيل دخول واحد وبنفس البيانات الحقيقية.',
    explore: (name: string) => `استكشف ${name}`,
    ctaTitle: 'ابدأ بالباقة المجانية، وأضف ما تحتاجه.',
    startSelling: 'ابدأ البيع مجانًا',
  },
});
