import { siteText } from '@/i18n/site/siteText';

export const PLATFORM_PRODUCT_TEXT = siteText({
  en: {
    fallbackTitle: 'Products',
    startSelling: 'Start Selling Free',
    exploreOther: 'Explore other products',
    whyTitle: 'Why it works this way',
    included: "What's included",
    useCases: 'Common use cases',
    faqTitle: (name: string) => `Questions about ${name}`,
    ctaTitle: (name: string) => `Ready to use ${name}?`,
    ctaSubtitle: 'Start free — no credit card required.',
  },
  ar: {
    fallbackTitle: 'المنتجات',
    startSelling: 'ابدأ البيع مجانًا',
    exploreOther: 'استكشف المنتجات الأخرى',
    whyTitle: 'لماذا يعمل بهذه الطريقة',
    included: 'ما الذي يتضمنه',
    useCases: 'حالات الاستخدام الشائعة',
    faqTitle: (name: string) => `أسئلة حول ${name}`,
    ctaTitle: (name: string) => `جاهز لاستخدام ${name}؟`,
    ctaSubtitle: 'ابدأ مجانًا، دون الحاجة إلى بطاقة ائتمان.',
  },
});
