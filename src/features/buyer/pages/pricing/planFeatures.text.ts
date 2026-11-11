import { siteText } from '@/i18n/site/siteText';
import { arCount, type ArabicNoun } from './arabicCount';

const plural = (n: number, one: string, many: string) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

const AR_PRODUCTS: ArabicNoun = { one: 'منتج واحد', two: 'منتجين', few: 'منتجات', many: 'منتجًا', hundred: 'منتج' };
const AR_STAFF: ArabicNoun = { one: 'حساب واحد للموظفين', two: 'حسابان للموظفين', few: 'حسابات للموظفين', many: 'حسابًا للموظفين', hundred: 'حساب للموظفين' };
const AR_EXTRA_STAFF: ArabicNoun = { one: 'حساب إضافي لموظف', two: 'حسابان إضافيان للموظفين', few: 'حسابات إضافية للموظفين', many: 'حسابًا إضافيًا للموظفين', hundred: 'حساب إضافي للموظفين' };
const AR_LOCATIONS: ArabicNoun = { one: 'موقع واحد (متجر أو مستودع)', two: 'موقعان (متاجر أو مستودعات)', few: 'مواقع (متاجر أو مستودعات)', many: 'موقعًا (متاجر أو مستودعات)', hundred: 'موقع (متاجر أو مستودعات)' };
const AR_SALES: ArabicNoun = { one: 'عرض تخفيضات واحد في كل مرة', two: 'عرضان في الوقت نفسه', few: 'عروض في الوقت نفسه', many: 'عرضًا في الوقت نفسه', hundred: 'عرض في الوقت نفسه' };
const AR_BANNERS: ArabicNoun = { one: 'لافتة واحدة في الصفحة الرئيسية', two: 'لافتتان في الصفحة الرئيسية', few: 'لافتات في الصفحة الرئيسية', many: 'لافتة في الصفحة الرئيسية', hundred: 'لافتة في الصفحة الرئيسية' };
const AR_CURRENCIES: ArabicNoun = { one: 'عملة واحدة', two: 'عملتين', few: 'عملات', many: 'عملة', hundred: 'عملة' };

/** Plan-card feature lines (see planFeatures.ts). English is the original wording, unchanged. */
export const PLAN_FEATURES_TEXT = siteText({
  en: {
    unlimitedProducts: 'Unlimited products',
    products: (n: number) => `Sell up to ${plural(n, 'product', 'products')}`,
    unlimitedStaff: 'Unlimited staff logins',
    extraStaff: (n: number) => `${plural(n, 'extra staff login', 'extra staff logins')}`,
    staff: (n: number) => plural(n, 'staff login', 'staff logins'),
    staffHint: 'Let a helper manage orders',
    unlimitedLocations: 'Unlimited locations',
    oneLocation: '1 shop location with the POS till',
    locations: (n: number) => `${n} shop / warehouse locations`,
    unlimitedAi: 'Unlimited AI credits',
    ai: (n: number) => `${n.toLocaleString('en-US')} AI credits a month`,
    aiHint: 'AI writes product descriptions for you',
    abandoned: 'Recover abandoned carts', abandonedHint: 'Remind shoppers who leave without paying',
    loyalty: 'Loyalty points', loyaltyHint: 'Bring customers back for more',
    whiteLabel: 'Remove Solvexo branding', whiteLabelHint: 'Your brand only, everywhere',
    courierRates: 'Live courier rates at checkout',
    domain: 'Your own web address', domainHint: 'e.g. yourshop.com',
    email: 'Email marketing', emailHint: 'Send offers and automatic emails',
    seo: 'SEO tools', seoHint: 'Help Google find your store',
    seoAi: 'AI SEO suggestions',
    redirects: 'Custom redirects', redirectsHint: 'Keep old links working',
    searchConsole: 'Google Search Console connection',
    unlimitedSalesBanners: 'Unlimited sales & banners',
    unlimitedSales: 'Unlimited sales at once',
    oneSale: '1 sale running at a time',
    sales: (n: number) => `${n} sales running at once`,
    unlimitedBanners: 'unlimited banners',
    banners: (n: number) => plural(n, 'homepage banner', 'homepage banners'),
    unlimitedCurrencies: 'Unlimited currencies',
    currencies: (n: number) => `Accept up to ${n} currencies`,
    priority: 'Priority support', priorityHint: 'Faster answers from our team',
    manager: 'Your own account manager', managerHint: 'One person who knows your business',
  },
  ar: {
    unlimitedProducts: 'منتجات غير محدودة',
    products: (n: number) => `بيع ما يصل إلى ${arCount(n, AR_PRODUCTS)}`,
    unlimitedStaff: 'حسابات غير محدودة للموظفين',
    extraStaff: (n: number) => arCount(n, AR_EXTRA_STAFF),
    staff: (n: number) => arCount(n, AR_STAFF),
    staffHint: 'ليساعدك موظف في إدارة الطلبات',
    unlimitedLocations: 'مواقع غير محدودة',
    oneLocation: 'متجر واحد مع نقطة البيع',
    locations: (n: number) => arCount(n, AR_LOCATIONS),
    unlimitedAi: 'رصيد غير محدود للذكاء الاصطناعي',
    ai: (n: number) => `رصيد ذكاء اصطناعي: ${n.toLocaleString('en-US')} شهريًا`,
    aiHint: 'الذكاء الاصطناعي يكتب أوصاف منتجاتك',
    abandoned: 'استرجاع السلال المتروكة', abandonedHint: 'تذكير المتسوقين الذين يغادرون دون الدفع',
    loyalty: 'نقاط الولاء', loyaltyHint: 'شجّع عملاءك على العودة',
    whiteLabel: 'إزالة علامة Solvexo', whiteLabelHint: 'علامتك التجارية وحدها في كل مكان',
    courierRates: 'أسعار شركات التوصيل المباشرة عند الدفع',
    domain: 'نطاقك الخاص', domainHint: 'مثل yourshop.com',
    email: 'التسويق عبر البريد الإلكتروني', emailHint: 'أرسل العروض والرسائل التلقائية',
    seo: 'أدوات تحسين الظهور في محركات البحث (SEO)', seoHint: 'ساعد Google في العثور على متجرك',
    seoAi: 'اقتراحات SEO بالذكاء الاصطناعي',
    redirects: 'إعادة توجيه مخصصة', redirectsHint: 'لتبقى الروابط القديمة تعمل',
    searchConsole: 'الربط مع Google Search Console',
    unlimitedSalesBanners: 'عروض ولافتات غير محدودة',
    unlimitedSales: 'عروض غير محدودة في الوقت نفسه',
    oneSale: 'عرض تخفيضات واحد في كل مرة',
    sales: (n: number) => arCount(n, AR_SALES),
    unlimitedBanners: 'لافتات غير محدودة',
    banners: (n: number) => arCount(n, AR_BANNERS),
    unlimitedCurrencies: 'عملات غير محدودة',
    currencies: (n: number) => `البيع بما يصل إلى ${arCount(n, AR_CURRENCIES)}`,
    priority: 'دعم ذو أولوية', priorityHint: 'ردود أسرع من فريقنا',
    manager: 'مدير حساب خاص بك', managerHint: 'شخص واحد يعرف نشاطك التجاري',
  },
});

/**
 * Arabic name of the platform's core plans (by key), and Arabic for the descriptions they have had
 * (the catalog default and the wording live in production). An admin-reworded description has no entry here
 * and stays in the API's English until it is added.
 */
export const PLAN_NAMES_AR: Record<string, { name: string; descriptions: Record<string, string> }> = {
  basic: { name: 'الأساسية', descriptions: {
    'Everything you need to launch your store and make your first sales.': 'كل ما تحتاجه لإطلاق متجرك وتحقيق أولى مبيعاتك.',
    'Perfect for trying Solvexo and selling your first products.': 'مثالية لتجربة Solvexo وبيع منتجاتك الأولى.',
  } },
  grow: { name: 'النمو', descriptions: {
    'For growing sellers who want more reach, more staff and marketing tools.': 'للتجار في مرحلة النمو الذين يريدون وصولًا أوسع وموظفين أكثر وأدوات تسويق.',
    'For growing sellers who need the full commerce toolkit.': 'للتجار في مرحلة النمو الذين يحتاجون إلى كل أدوات التجارة الإلكترونية.',
  } },
  advanced: { name: 'المتقدمة', descriptions: {
    'For scaling businesses that need advanced selling and brand controls.': 'للأعمال المتوسعة التي تحتاج إلى أدوات بيع متقدمة وتحكم كامل بعلامتها التجارية.',
  } },
  enterprise: { name: 'المؤسسات', descriptions: {
    'For large and complex businesses — unlimited everything with a dedicated account manager.': 'للأعمال الكبيرة والمعقدة: كل شيء بلا حدود مع مدير حساب مخصص.',
  } },
};
export const PLAN_BADGES_AR: Record<string, string> = { 'Most Popular': 'الأكثر طلبًا', 'Best Value': 'أفضل قيمة', 'Recommended': 'موصى بها' };
