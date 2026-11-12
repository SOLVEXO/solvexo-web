import { siteText } from '@/i18n/site/siteText';

/**
 * Every visible string of the public footer. Plain data (no React).
 * `columns` follows FOOTER_COLUMNS in Footer.tsx: same columns, same links, same order (the paths stay in Footer.tsx).
 * Pages without a site language provider (blog, manuals…) get the English text: the context defaults to English.
 */
export const FOOTER_TEXT = siteText({
  en: {
    columns: [
      { heading: 'Products', links: ['Store Builder', 'Point of Sale', 'Inventory', 'Orders & Customers', 'AI Commerce', 'Analytics', 'Loyalty & Rewards'] },
      { heading: 'Solutions', links: ['Retail', 'Fashion', 'Restaurants & Food', 'Beauty & Cosmetics', 'Creators & Digital Sellers', 'Small Business'] },
      { heading: 'Learn & Support', links: ['Blog', 'User manuals', 'FAQ', 'Contact Us'] },
      { heading: 'Company', links: ['About Solvexo', 'Security', 'For Sellers', 'Pricing'] },
      { heading: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'] },
    ],
    subscribeError: 'Something went wrong. Please try again.',
    subscribed: "You're subscribed — welcome aboard!",
    emailPlaceholder: 'Your email address',
    emailAria: 'Email address',
    subscribing: 'Subscribing…',
    subscribe: 'Subscribe',
    newsletterTitle: 'Grow your business with Solvexo',
    newsletterDesc: 'Product updates, new features, selling tips and merchant-only offers — straight to your inbox.',
    tagline: 'The commerce OS for sellers, creators and educators — your own storefront, POS and inventory in one platform.',
    socialAria: (network: string) => `Solvexo on ${network}`,
    copyright: (year: number) => `© ${year} Solvexo. All rights reserved.`,
    country: 'Country',
    countryAuto: 'Auto',
    backToTop: 'Back to top',
  },
  ar: {
    columns: [
      { heading: 'المنتجات', links: ['منشئ المتاجر', 'نقطة البيع', 'المخزون', 'الطلبات والعملاء', 'التجارة بالذكاء الاصطناعي', 'التحليلات', 'الولاء والمكافآت'] },
      { heading: 'الحلول', links: ['التجزئة', 'الأزياء', 'المطاعم والأغذية', 'التجميل ومستحضرات العناية', 'صنّاع المحتوى وبائعو المنتجات الرقمية', 'الأعمال الصغيرة'] },
      { heading: 'التعلّم والدعم', links: ['المدونة', 'أدلة المستخدم', 'الأسئلة الشائعة', 'تواصل معنا'] },
      { heading: 'الشركة', links: ['عن Solvexo', 'الأمان', 'للتجّار', 'الأسعار'] },
      // The legal pages themselves stay in English (they need a reviewed translation); only the link names are Arabic.
      { heading: 'قانوني', links: ['سياسة الخصوصية', 'شروط الخدمة', 'سياسة ملفات تعريف الارتباط'] },
    ],
    subscribeError: 'حدث خطأ. يُرجى المحاولة مرة أخرى.',
    subscribed: 'تم اشتراكك — أهلًا بك!',
    emailPlaceholder: 'بريدك الإلكتروني',
    emailAria: 'البريد الإلكتروني',
    subscribing: 'جارٍ الاشتراك…',
    subscribe: 'اشترك',
    newsletterTitle: 'نمِّ أعمالك مع Solvexo',
    newsletterDesc: 'تحديثات المنتج والميزات الجديدة ونصائح البيع وعروض خاصة بالتجّار — مباشرة إلى بريدك.',
    tagline: 'نظام التجارة للتجّار وصنّاع المحتوى والمعلّمين — متجرك الخاص ونقطة البيع والمخزون في منصة واحدة.',
    socialAria: (network: string) => `Solvexo على ${network}`,
    copyright: (year: number) => `جميع الحقوق محفوظة لـ Solvexo © ${year}`,
    country: 'الدولة',
    countryAuto: 'تلقائي',
    backToTop: 'العودة إلى الأعلى',
  },
});
