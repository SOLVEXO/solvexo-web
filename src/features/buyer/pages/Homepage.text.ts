import { siteText } from '@/i18n/site/siteText';

/**
 * Every visible string of the home page (the hero has its own HomeHeroLight.text.ts). Plain data (no React).
 * Product and solution names/taglines come from the shared data through localizeProduct / localizeSolution;
 * testimonials come from the API and are shown as written.
 */
export const HOMEPAGE_TEXT = siteText({
  en: {
    // Testimonials
    owner: (store: string) => `Owner, ${store}`,
    verifiedSeller: 'Verified Seller',
    showTestimonial: (name: string) => `Show testimonial from ${name}`,
    trustedKicker: 'Trusted by creators worldwide',
    trustedTitle: 'Real stories from real sellers',

    // How it works — same order as HOW_IT_WORKS' icons in Homepage.tsx.
    howTitle: 'How Solvexo works',
    howSteps: [
      { step: 'Create',  desc: 'Build your storefront from a curated theme, or set up POS to sell in person.' },
      { step: 'Connect', desc: 'Add products, connect a payment method, and your inventory syncs across every channel.' },
      { step: 'Sell',    desc: 'Take orders online and in person — from the same catalog, the same stock.' },
      { step: 'Grow',    desc: 'Use real analytics and AI tools to see what\'s working and do more of it.' },
    ],

    posSteps: ['Search', 'Cart', 'Payment', 'Receipt'],

    // Short labels on the connected-system diagram, by product slug.
    shortProductLabel: {
      'store-builder': 'Store',
      pos: 'POS',
      'ai-commerce': 'AI',
      analytics: 'Analytics',
      inventory: 'Inventory',
      'orders-customers': 'Orders',
    } as Record<string, string>,

    // AI flow visual
    aiStages: [
      { label: 'Your data', sub: '412 orders this month' },
      { label: 'AI analysis', sub: 'Demand trending up 24%' },
      { label: 'Recommendation', sub: 'Raise price by 8%' },
    ],

    // Stats strip
    statSellers: 'Active Sellers',
    statGmv: 'GMV Processed',
    statBuyers: 'Registered Buyers',
    statRating: 'Average Rating',

    // Connected system
    systemKicker: 'Create · Sell · Manage · Understand · Grow',
    systemTitle1: 'Everything you need',
    systemTitle2: 'to build, sell and grow.',
    systemLead: 'Store Builder, Point of Sale, Inventory, Orders & Customers, AI Commerce, Analytics and Loyalty & Rewards — seven real tools reading from the same data, in one commerce platform.',

    // Store Builder
    storeKicker: 'Store Builder',
    storeTitle: 'Build a store that feels like your brand.',
    storeLead: 'A real drag-and-drop storefront editor — themes, sections, header and footer — with a live preview, not a template you\'re stuck with.',
    storeFeatures: ['Curated theme library', 'Section-by-section page editing', 'Live desktop & mobile preview', 'Your own store subdomain'],
    storeCta: 'Explore Store Builder',
    storeHint: 'Pick a theme, edit sections, publish',

    // POS
    posKicker: 'Point of Sale',
    posTitle: 'Sell in-store. Sell online. One connected system.',
    posLead: 'A real point-of-sale terminal that shares the exact same inventory and order records as your online store — no separate system to reconcile.',
    posFeatures: ['PIN-based employee login', 'Real-time inventory sync', 'Works standalone, with no storefront needed', 'Register session tracking'],
    posCta: 'Explore POS',

    // AI Commerce
    aiKicker: 'AI Commerce',
    aiTitle: 'AI that helps you sell smarter.',
    aiLead: 'Real AI tools built into your workspace — for the writing and analysis work that normally eats the most time. A productivity tool, not a sales guarantee.',
    aiFeatures: ['AI-assisted product descriptions', 'Metered through an AI credits wallet', 'Built into the seller dashboard'],
    aiCta: 'Explore AI Commerce',

    // Dashboard + explorer
    dashboardTitle: 'Everything your business needs, in one dashboard.',
    dashboardSubtitle: 'Revenue, orders, customers and top products — computed from your real data, not a simulated preview.',
    explorerKicker: 'Keep exploring',
    explorerTitle: 'Step inside the workspace',
    explorerSubtitle: 'The same dashboard a seller actually uses — revenue, stock, orders and AI, all live in one place.',

    // Industries
    industriesKicker: 'Built for the way you sell',
    industriesTitle: 'Whatever you sell, we\'ve got you covered.',
    solutionAlt: (name: string, photo: string) => `${name}: ${photo}`,

    // Final CTA
    ctaKicker: 'Create · Sell · Manage · Grow',
    ctaTitle1: 'Ready to build,',
    ctaTitle2: 'sell and grow?',
    ctaLead: 'One connected commerce platform — no separate tools to stitch together, no approval queue to wait on.',
    startSellingFree: 'Start Selling Free',
    explorePlatform: 'Explore the Platform',
    preferWalkthrough: 'Prefer a walkthrough?',
    bookFreeDemo: 'Book a free demo',
  },
  ar: {
    owner: (store: string) => `مالك ${store}`,
    verifiedSeller: 'تاجر موثّق',
    showTestimonial: (name: string) => `عرض رأي ${name}`,
    trustedKicker: 'موثوق من صنّاع المحتوى حول العالم',
    trustedTitle: 'تجارب حقيقية من تجّار حقيقيين',

    howTitle: 'كيف يعمل Solvexo',
    howSteps: [
      { step: 'أنشئ', desc: 'أنشئ متجرك الإلكتروني من مجموعة قوالب مختارة، أو جهّز نقطة البيع للبيع في المتجر.' },
      { step: 'اربط', desc: 'أضف منتجاتك واربط وسيلة دفع، ويتزامن مخزونك عبر كل قنوات البيع.' },
      { step: 'بِع', desc: 'استقبل الطلبات عبر الإنترنت وفي المتجر — من الكتالوج نفسه والمخزون نفسه.' },
      { step: 'انمُ', desc: 'استخدم تحليلات حقيقية وأدوات الذكاء الاصطناعي لتعرف ما ينجح وتزيد منه.' },
    ],

    posSteps: ['البحث', 'السلة', 'الدفع', 'الإيصال'],

    shortProductLabel: {
      'store-builder': 'المتجر',
      pos: 'POS',
      'ai-commerce': 'AI',
      analytics: 'التحليلات',
      inventory: 'المخزون',
      'orders-customers': 'الطلبات',
    } as Record<string, string>,

    aiStages: [
      { label: 'بياناتك', sub: '412 طلبًا هذا الشهر' },
      { label: 'تحليل بالذكاء الاصطناعي', sub: 'الطلب في ارتفاع بنسبة 24%' },
      { label: 'توصية', sub: 'ارفع السعر بنسبة 8%' },
    ],

    statSellers: 'التجّار النشطون',
    statGmv: 'إجمالي قيمة المبيعات',
    statBuyers: 'المشترون المسجّلون',
    statRating: 'متوسط التقييم',

    systemKicker: 'أنشئ · بِع · أدِر · افهم · انمُ',
    systemTitle1: 'كل ما تحتاجه',
    systemTitle2: 'لتبني وتبيع وتنمو.',
    systemLead: 'منشئ المتاجر ونقطة البيع والمخزون والطلبات والعملاء والتجارة بالذكاء الاصطناعي والتحليلات والولاء والمكافآت — سبع أدوات حقيقية تعمل على البيانات نفسها، في منصة تجارة واحدة.',

    storeKicker: 'منشئ المتاجر',
    storeTitle: 'أنشئ متجرًا يعكس علامتك التجارية.',
    storeLead: 'محرّر حقيقي للمتجر بالسحب والإفلات — القوالب والأقسام والرأس والتذييل — مع معاينة مباشرة، وليس قالبًا جامدًا لا يمكنك تغييره.',
    storeFeatures: ['مكتبة قوالب مختارة', 'تعديل الصفحة قسمًا قسمًا', 'معاينة مباشرة على الكمبيوتر والجوال', 'نطاق فرعي خاص بمتجرك'],
    storeCta: 'استكشف منشئ المتاجر',
    storeHint: 'اختر قالبًا، عدّل الأقسام، ثم انشر',

    posKicker: 'نقطة البيع',
    posTitle: 'بِع في المتجر. بِع عبر الإنترنت. نظام واحد متكامل.',
    posLead: 'جهاز نقطة بيع حقيقي يشارك المخزون وسجلات الطلبات نفسها مع متجرك الإلكتروني — دون نظام منفصل تحتاج إلى مطابقته.',
    posFeatures: ['دخول الموظفين برمز PIN', 'مزامنة فورية للمخزون', 'يعمل مستقلًا دون الحاجة إلى متجر إلكتروني', 'تتبّع جلسات الصندوق'],
    posCta: 'استكشف نقطة البيع',

    aiKicker: 'التجارة بالذكاء الاصطناعي',
    aiTitle: 'ذكاء اصطناعي يساعدك على البيع بذكاء أكبر.',
    aiLead: 'أدوات ذكاء اصطناعي حقيقية مدمجة في مساحة عملك — لأعمال الكتابة والتحليل التي تستهلك عادةً معظم الوقت. أداة لزيادة الإنتاجية، وليست ضمانًا للمبيعات.',
    aiFeatures: ['أوصاف منتجات بمساعدة الذكاء الاصطناعي', 'استهلاك محسوب من محفظة رصيد الذكاء الاصطناعي', 'مدمج في لوحة تحكم التاجر'],
    aiCta: 'استكشف التجارة بالذكاء الاصطناعي',

    dashboardTitle: 'كل ما تحتاجه أعمالك، في لوحة تحكم واحدة.',
    dashboardSubtitle: 'الإيرادات والطلبات والعملاء وأفضل المنتجات — محسوبة من بياناتك الحقيقية، وليست معاينة محاكاة.',
    explorerKicker: 'تابع الاستكشاف',
    explorerTitle: 'ادخل إلى مساحة العمل',
    explorerSubtitle: 'لوحة التحكم نفسها التي يستخدمها التاجر فعلًا — الإيرادات والمخزون والطلبات والذكاء الاصطناعي، كلها مباشرة في مكان واحد.',

    industriesKicker: 'مصمَّم لطريقة بيعك',
    industriesTitle: 'مهما كان ما تبيعه، لدينا ما يناسبك.',
    // The stock photo descriptions are English-only, so the Arabic alt text is the solution's name.
    solutionAlt: (name: string) => name,

    ctaKicker: 'أنشئ · بِع · أدِر · انمُ',
    ctaTitle1: 'مستعد لتبني،',
    ctaTitle2: 'وتبيع وتنمو؟',
    ctaLead: 'منصة تجارة واحدة متكاملة — لا أدوات منفصلة تحتاج إلى ربطها، ولا انتظار لموافقة.',
    startSellingFree: 'ابدأ البيع مجانًا',
    explorePlatform: 'استكشف المنصة',
    preferWalkthrough: 'تفضّل جولة مع فريقنا؟',
    bookFreeDemo: 'احجز عرضًا توضيحيًا مجانيًا',
  },
});
