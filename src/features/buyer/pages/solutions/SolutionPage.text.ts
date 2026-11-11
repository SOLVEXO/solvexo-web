import { siteText } from '@/i18n/site/siteText';

export const SOLUTION_PAGE_TEXT = siteText({
  en: {
    fallbackTitle: 'Solutions',
    imageAlt: (name: string, photo: string) => `${name}: ${photo}`,
    builtFor: (name: string) => `Built for ${name}`,
    startSelling: 'Start Selling Free',
    whatYouGet: 'What you get',
    seeEveryProduct: 'See every product',
    builtOn: 'Built on',
    poweredTitle: (name: string) => `What powers ${name.toLowerCase()} on Solvexo`,
    learnMore: 'Learn more',
    ctaTitle: (name: string) => `Start selling in ${name.toLowerCase()} today.`,
  },
  ar: {
    fallbackTitle: 'الحلول',
    // The stock-photo descriptions are English-only, so the Arabic alt text names the industry alone.
    imageAlt: (name: string) => name,
    builtFor: (name: string) => `مصمم لقطاع ${name}`,
    startSelling: 'ابدأ البيع مجانًا',
    whatYouGet: 'ما الذي تحصل عليه',
    seeEveryProduct: 'تصفح كل المنتجات',
    builtOn: 'مبني على',
    poweredTitle: (name: string) => `ما الذي يشغّل قطاع ${name} على Solvexo`,
    learnMore: 'اعرف المزيد',
    ctaTitle: (name: string) => `ابدأ البيع في قطاع ${name} اليوم.`,
  },
});
