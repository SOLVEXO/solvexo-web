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
    unlimitedProductsHint: 'There is no limit on how many products you can list.',
    productsHint: (n: number) => `The most products you can have in your store at one time: ${n.toLocaleString('en-US')}.`,
    unlimitedStaffHint: 'Add as many helpers as you need. Each one gets their own login and only the access you give them.',
    staffLimitHint: (n: number) => `Let up to ${n} helper${n === 1 ? '' : 's'} log in to manage orders and products. Each gets their own login and only the access you choose.`,
    unlimitedLocationsHint: 'Sell from any number of shops and warehouses. Stock stays in step with your online store.',
    locationsHint: (n: number) => `Sell in person with the Solvexo POS app from up to ${n} place${n === 1 ? '' : 's'}. Stock stays in step with your online store.`,
    unlimitedLocations: 'Unlimited locations',
    oneLocation: '1 shop location with the POS till',
    locations: (n: number) => `${n} shop / warehouse locations`,
    unlimitedAi: 'Unlimited AI credits',
    ai: (n: number) => `${n.toLocaleString('en-US')} AI credits a month`,
    aiHint: 'AI writes product descriptions for you',
    aiUnlimitedHint: 'Used for AI SEO suggestions: AI proposes a page title and description for a product, you read it first and click Use this. There is no monthly limit.',
    aiLimitedHint: 'Used for AI SEO suggestions: AI proposes a page title and description for a product, you read it first and click Use this. Each suggestion costs 5 credits. Credits renew every month.',
    abandoned: 'Recover abandoned carts', abandonedHint: 'When a shopper leaves items in the cart without paying, we email them a link back to that cart.',
    loyalty: 'Loyalty points', loyaltyHint: 'Customers earn points on their orders and swap them for rewards, so they come back to buy again.',
    whiteLabel: 'Remove Solvexo branding', whiteLabelHint: 'Hide the Solvexo name and logo, so your customers only see your brand.',
    courierRates: 'Live courier rates at checkout', courierRatesHint: 'Checkout shows the real delivery price from the courier for each order, instead of one fixed price.',
    domain: 'Your own web address', domainHint: 'Use your own address like yourshop.com for your store instead of a Solvexo one. A secure (https) lock is included.',
    email: 'Email marketing', emailHint: 'Email your customers offers and news. Automatic emails too: welcome, forgotten cart, back in stock.',
    seo: 'SEO tools', seoHint: 'Page titles, descriptions, a sitemap and checks that help Google find and rank your products.',
    seoAi: 'AI SEO suggestions', seoAiHint: 'AI proposes a page title and description for a product. You read it first and only click Use this if you like it.',
    redirects: 'Custom redirects', redirectsHint: 'When you change a page address, send the old link to the new one, so visitors never land on an error page.',
    searchConsole: 'Google Search Console connection', searchConsoleHint: 'See which Google searches bring people to your store, right inside your dashboard.',
    unlimitedSalesBanners: 'Unlimited sales & banners',
    unlimitedSales: 'Unlimited sales at once',
    oneSale: '1 sale running at a time',
    sales: (n: number) => `${n} sales running at once`,
    unlimitedBanners: 'unlimited banners',
    banners: (n: number) => plural(n, 'homepage banner', 'homepage banners'),
    unlimitedCurrencies: 'Unlimited currencies',
    currencies: (n: number) => `Accept up to ${n} currencies`,
    unlimitedCurrenciesHint: 'Show prices in any currency, so buyers in other countries see and pay in their own.',
    currenciesHint: (n: number) => `Show prices in up to ${n} currencies, so buyers in other countries see and pay in their own.`,
    unlimitedEmails: 'Unlimited marketing emails',
    emails: (n: number) => `${n.toLocaleString('en-US')} marketing emails a month`,
    emailsHint: 'How many offer and news emails you can send to your customers each month. One email to one customer counts as 1. The count starts again every month.',
    unlimitedCatalogs: 'Unlimited wholesale catalogs',
    catalogs: (n: number) => plural(n, 'wholesale catalog', 'wholesale catalogs'),
    wholesaleHint: (n?: number) => `Set special prices for business buyers who order in bulk. A catalog is one separate price list${n === undefined ? '.' : n < 0 ? '; you can make as many as you like.' : n ? `; this plan allows ${n}.` : '.'}`,
    wholesalePrices: 'B2B wholesale prices', wholesalePricesShort: 'Set special prices for business buyers who order in bulk.',
    digitalMemberships: 'memberships', digitalLicenses: 'license keys', digitalCourses: 'courses',
    digitalMembershipsWhat: 'memberships (customers pay to join and get members-only files and content)',
    digitalLicensesWhat: 'license keys (every buyer of your software gets their own code)',
    digitalCoursesWhat: 'online courses (lessons, quizzes and certificates)',
    sellDigital: (list: string) => `Sell ${list}`,
    sellDigitalHint: (list: string) => `Sell more than physical goods: ${list}.`,
    and: ' & ', comma: ', ',
    webhooks: 'Webhooks & API', webhooksHint: 'Send your store events, like a new order, to other tools, and read your store data from your own software.',
    priority: 'Priority support', priorityHint: 'Your help requests are answered before the ones from the Basic plan. We do not promise an exact reply time.',
    manager: 'Your own account manager', managerHint: 'One person from our team looks after your account and knows your business.',
  },
  ar: {
    unlimitedProducts: 'منتجات غير محدودة',
    products: (n: number) => `بيع ما يصل إلى ${arCount(n, AR_PRODUCTS)}`,
    unlimitedStaff: 'حسابات غير محدودة للموظفين',
    extraStaff: (n: number) => arCount(n, AR_EXTRA_STAFF),
    staff: (n: number) => arCount(n, AR_STAFF),
    staffHint: 'ليساعدك موظف في إدارة الطلبات',
    unlimitedProductsHint: 'لا يوجد حد لعدد المنتجات التي يمكنك عرضها.',
    productsHint: (n: number) => `أكبر عدد من المنتجات يمكنك الاحتفاظ به في متجرك في الوقت نفسه: ${n.toLocaleString('en-US')}.`,
    unlimitedStaffHint: 'أضف عدد المساعدين الذي تحتاجه. لكل واحد منهم حسابه الخاص وصلاحيات تحددها أنت فقط.',
    staffLimitHint: (n: number) => `اسمح لما يصل إلى ${n} من المساعدين بتسجيل الدخول لإدارة الطلبات والمنتجات. لكل منهم حسابه الخاص وصلاحيات تختارها أنت فقط.`,
    unlimitedLocationsHint: 'بِع من أي عدد من المتاجر والمستودعات. يبقى المخزون متزامنًا مع متجرك الإلكتروني.',
    locationsHint: (n: number) => `بِع وجهًا لوجه عبر تطبيق نقطة البيع من Solvexo من ${n} موقع كحد أقصى. يبقى المخزون متزامنًا مع متجرك الإلكتروني.`,
    unlimitedLocations: 'مواقع غير محدودة',
    oneLocation: 'متجر واحد مع نقطة البيع',
    locations: (n: number) => arCount(n, AR_LOCATIONS),
    unlimitedAi: 'رصيد غير محدود للذكاء الاصطناعي',
    ai: (n: number) => `رصيد ذكاء اصطناعي: ${n.toLocaleString('en-US')} شهريًا`,
    aiHint: 'الذكاء الاصطناعي يكتب أوصاف منتجاتك',
    aiUnlimitedHint: 'يُستخدم في اقتراحات SEO بالذكاء الاصطناعي: يقترح الذكاء الاصطناعي عنوان صفحة ووصفًا للمنتج، تقرؤه أولًا ثم تضغط «استخدم هذا». لا يوجد حد شهري.',
    aiLimitedHint: 'يُستخدم في اقتراحات SEO بالذكاء الاصطناعي: يقترح الذكاء الاصطناعي عنوان صفحة ووصفًا للمنتج، تقرؤه أولًا ثم تضغط «استخدم هذا». يكلّف كل اقتراح 5 أرصدة، ويتجدد الرصيد كل شهر.',
    abandoned: 'استرجاع السلال المتروكة', abandonedHint: 'عندما يترك متسوّق منتجات في السلة دون الدفع، نرسل له بريدًا إلكترونيًا برابط يعيده إلى سلته.',
    loyalty: 'نقاط الولاء', loyaltyHint: 'يكسب العملاء نقاطًا على طلباتهم ويستبدلونها بمكافآت، فيعودون للشراء مرة أخرى.',
    whiteLabel: 'إزالة علامة Solvexo', whiteLabelHint: 'أخفِ اسم Solvexo وشعارها ليرى عملاؤك علامتك التجارية وحدها.',
    courierRates: 'أسعار شركات التوصيل المباشرة عند الدفع', courierRatesHint: 'تعرض صفحة الدفع سعر التوصيل الحقيقي من شركة الشحن لكل طلب، بدل سعر ثابت واحد.',
    domain: 'نطاقك الخاص', domainHint: 'استخدم عنوانك الخاص مثل yourshop.com لمتجرك بدل عنوان Solvexo. قفل الأمان (https) مشمول.',
    email: 'التسويق عبر البريد الإلكتروني', emailHint: 'أرسل لعملائك العروض والأخبار بالبريد الإلكتروني، ومعها رسائل تلقائية: الترحيب والسلة المتروكة وتوفر المنتج من جديد.',
    seo: 'أدوات تحسين الظهور في محركات البحث (SEO)', seoHint: 'عناوين الصفحات والأوصاف وخريطة الموقع وفحوصات تساعد Google على إيجاد منتجاتك وترتيبها.',
    seoAi: 'اقتراحات SEO بالذكاء الاصطناعي', seoAiHint: 'يقترح الذكاء الاصطناعي عنوان صفحة ووصفًا للمنتج. تقرؤه أولًا ولا تضغط «استخدم هذا» إلا إذا أعجبك.',
    redirects: 'إعادة توجيه مخصصة', redirectsHint: 'عندما تغيّر عنوان صفحة، وجّه الرابط القديم إلى الجديد حتى لا يصل الزوار إلى صفحة خطأ.',
    searchConsole: 'الربط مع Google Search Console', searchConsoleHint: 'اعرف عمليات بحث Google التي تجلب الناس إلى متجرك، داخل لوحة التحكم مباشرة.',
    unlimitedSalesBanners: 'عروض ولافتات غير محدودة',
    unlimitedSales: 'عروض غير محدودة في الوقت نفسه',
    oneSale: 'عرض تخفيضات واحد في كل مرة',
    sales: (n: number) => arCount(n, AR_SALES),
    unlimitedBanners: 'لافتات غير محدودة',
    banners: (n: number) => arCount(n, AR_BANNERS),
    unlimitedCurrencies: 'عملات غير محدودة',
    currencies: (n: number) => `البيع بما يصل إلى ${arCount(n, AR_CURRENCIES)}`,
    unlimitedCurrenciesHint: 'اعرض الأسعار بأي عملة، ليرى المشترون في بلدان أخرى الأسعار ويدفعوا بعملتهم.',
    currenciesHint: (n: number) => `اعرض الأسعار بما يصل إلى ${n} عملات، ليرى المشترون في بلدان أخرى الأسعار ويدفعوا بعملتهم.`,
    unlimitedEmails: 'رسائل تسويقية غير محدودة',
    emails: (n: number) => `${n.toLocaleString('en-US')} رسالة تسويقية شهريًا`,
    emailsHint: 'عدد رسائل العروض والأخبار التي يمكنك إرسالها إلى عملائك كل شهر. رسالة واحدة لعميل واحد تُحسب 1. يبدأ العدّ من جديد كل شهر.',
    unlimitedCatalogs: 'كتالوجات جملة غير محدودة',
    catalogs: (n: number) => `${n.toLocaleString('en-US')} كتالوج جملة`,
    wholesaleHint: (n?: number) => `حدّد أسعارًا خاصة لمشتري الأعمال الذين يطلبون بكميات كبيرة. الكتالوج قائمة أسعار منفصلة${n === undefined ? '.' : n < 0 ? '؛ ويمكنك إنشاء أي عدد منها.' : n ? `؛ وتتيح هذه الخطة ${n}.` : '.'}`,
    wholesalePrices: 'أسعار الجملة للأعمال (B2B)', wholesalePricesShort: 'حدّد أسعارًا خاصة لمشتري الأعمال الذين يطلبون بكميات كبيرة.',
    digitalMemberships: 'العضويات', digitalLicenses: 'مفاتيح الترخيص', digitalCourses: 'الدورات',
    digitalMembershipsWhat: 'العضويات (يدفع العملاء للانضمام ويحصلون على ملفات ومحتوى للأعضاء فقط)',
    digitalLicensesWhat: 'مفاتيح الترخيص (كل مشترٍ لبرنامجك يحصل على رمزه الخاص)',
    digitalCoursesWhat: 'الدورات عبر الإنترنت (دروس واختبارات وشهادات)',
    sellDigital: (list: string) => `بِع ${list}`,
    sellDigitalHint: (list: string) => `بِع أكثر من السلع المادية: ${list}.`,
    and: ' و', comma: '، ',
    webhooks: 'Webhooks وواجهة API', webhooksHint: 'أرسل أحداث متجرك، مثل الطلب الجديد، إلى أدوات أخرى، واقرأ بيانات متجرك من برنامجك الخاص.',
    priority: 'دعم ذو أولوية', priorityHint: 'تُجاب طلبات المساعدة منك قبل طلبات الخطة الأساسية. لا نعد بوقت رد محدد.',
    manager: 'مدير حساب خاص بك', managerHint: 'شخص من فريقنا يتابع حسابك ويعرف نشاطك التجاري.',
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
