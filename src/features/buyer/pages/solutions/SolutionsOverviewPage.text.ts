import { siteText } from '@/i18n/site/siteText';

export const SOLUTIONS_OVERVIEW_TEXT = siteText({
  en: {
    pageTitle: 'Solutions',
    kicker: 'Built for the way you sell',
    title: 'Solvexo, tailored to your industry.',
    subtitle: 'The same real platform underneath — store, POS, inventory and analytics — applied to how your specific business actually sells.',
    imageAlt: (name: string, photo: string) => `${name}: ${photo}`,
    explore: 'Explore',
    ctaTitle: 'Not sure which fits? Start free and find out.',
    startSelling: 'Start Selling Free',
  },
  ar: {
    pageTitle: 'الحلول',
    kicker: 'مصمم لطريقة بيعك',
    title: 'Solvexo، مصمم لقطاع عملك.',
    subtitle: 'نفس المنصة الحقيقية — المتجر ونقطة البيع والمخزون والتحليلات — مطبّقة على الطريقة التي يبيع بها نشاطك فعلًا.',
    // The stock-photo descriptions are English-only, so the Arabic alt text names the industry alone.
    imageAlt: (name: string) => name,
    explore: 'استكشف',
    ctaTitle: 'لست متأكدًا أيها يناسبك؟ ابدأ مجانًا واكتشف.',
    startSelling: 'ابدأ البيع مجانًا',
  },
});
