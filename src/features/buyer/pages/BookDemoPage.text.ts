import { siteText } from '@/i18n/site/siteText';

/** Values sent to the API (and read by Sales Ops): always these English values, whatever the page language. */
export const DEMO_BUSINESS_TYPES = ['Clothing & fashion', 'Beauty & cosmetics', 'Grocery & food', 'Electronics', 'Home & furniture', 'Books & education', 'Handmade & crafts', 'Services', 'Other'] as const;
export const DEMO_TIMES = ['Morning (9am–12pm)', 'Afternoon (12pm–4pm)', 'Evening (4pm–8pm)', 'Any time'] as const;

export const BOOK_DEMO_TEXT = siteText({
  en: {
    pageTitle: 'Book a demo',
    title: 'Book a free demo',
    subtitle: 'See how Solvexo can run your online store, payments and delivery. A real person will call you, no pressure to buy.',
    // Same order as the icons in BookDemoPage.tsx.
    points: [
      { title: '30-minute call', text: 'On WhatsApp, phone or Zoom, in English or Urdu.' },
      { title: 'Your store, live', text: 'We set up a sample of your store with your own products.' },
      { title: 'Plan and pricing', text: 'Payments, delivery and the right plan for your size.' },
    ],
    // Visible labels of DEMO_BUSINESS_TYPES / DEMO_TIMES, same order.
    businessTypeLabels: ['Clothing & fashion', 'Beauty & cosmetics', 'Grocery & food', 'Electronics', 'Home & furniture', 'Books & education', 'Handmade & crafts', 'Services', 'Other'],
    timeLabels: ['Morning (9am–12pm)', 'Afternoon (12pm–4pm)', 'Evening (4pm–8pm)', 'Any time'],
    missingNamePhone: 'Please add your name and a phone or WhatsApp number.',
    badPhone: 'Please check the phone number. Include the full number, e.g. 0300 1234567.',
    badEmail: 'Please check the email address.',
    sendFailed: 'Could not send your request. Please try again.',
    // null: show the server's own confirmation (English).
    sentMessage: null as string | null,
    requestReceived: 'Request received',
    seePlans: 'See plans and pricing',
    nameLabel: 'Your name *',
    phoneLabel: 'Phone / WhatsApp *',
    phonePlaceholder: '0300 1234567',
    emailLabel: 'Email',
    businessNameLabel: 'Business name',
    cityLabel: 'City',
    cityPlaceholder: 'Lahore, Karachi…',
    businessTypeLabel: 'What do you sell?',
    chooseOne: 'Choose one',
    timeLabel: 'Best time to call',
    messageLabel: 'Anything we should know? (optional)',
    messagePlaceholder: 'Where do you sell today? Instagram, a shop, Daraz…',
    sending: 'Sending…',
    submit: 'Book my demo',
    replyNote: 'We reply within one working day. Prefer to start now?',
    startFree: 'Start free',
  },
  ar: {
    pageTitle: 'احجز عرضاً توضيحياً',
    title: 'احجز عرضاً توضيحياً مجانياً',
    subtitle: 'تعرّف كيف تدير Solvexo متجرك الإلكتروني ومدفوعاتك والتوصيل. سيتصل بك شخص حقيقي، دون أي ضغط للشراء.',
    points: [
      { title: 'مكالمة مدتها 30 دقيقة', text: 'عبر واتساب أو الهاتف أو Zoom، بالإنجليزية أو الأردية.' },
      { title: 'متجرك جاهز أمامك', text: 'نُعدّ نموذجاً من متجرك بمنتجاتك أنت.' },
      { title: 'الباقة والأسعار', text: 'المدفوعات والتوصيل والباقة المناسبة لحجم نشاطك.' },
    ],
    businessTypeLabels: ['الملابس والأزياء', 'التجميل ومستحضرات العناية', 'البقالة والأغذية', 'الإلكترونيات', 'المنزل والأثاث', 'الكتب والتعليم', 'المنتجات اليدوية والحِرف', 'الخدمات', 'أخرى'],
    timeLabels: ['صباحاً (9 ص – 12 م)', 'بعد الظهر (12 م – 4 م)', 'مساءً (4 م – 8 م)', 'أي وقت'],
    missingNamePhone: 'يُرجى إدخال اسمك ورقم هاتف أو واتساب.',
    // The number sits in a left-to-right isolate so its digit groups keep their order.
    badPhone: 'يُرجى التحقق من رقم الهاتف وإدخاله كاملاً، مثل \u2066050 123 4567\u2069.',
    badEmail: 'يُرجى التحقق من البريد الإلكتروني.',
    sendFailed: 'تعذّر إرسال طلبك. يُرجى المحاولة مرة أخرى.',
    sentMessage: 'شكراً لك! سنتصل بك أو نراسلك على واتساب خلال يوم عمل واحد.',
    requestReceived: 'تم استلام طلبك',
    seePlans: 'اطّلع على الباقات والأسعار',
    nameLabel: 'الاسم *',
    phoneLabel: 'الهاتف / واتساب *',
    phonePlaceholder: '+971 50 123 4567',
    emailLabel: 'البريد الإلكتروني',
    businessNameLabel: 'اسم النشاط التجاري',
    cityLabel: 'المدينة',
    cityPlaceholder: 'دبي، الرياض…',
    businessTypeLabel: 'ماذا تبيع؟',
    chooseOne: 'اختر واحداً',
    timeLabel: 'أفضل وقت للاتصال',
    messageLabel: 'هل هناك ما يجب أن نعرفه؟ (اختياري)',
    messagePlaceholder: 'أين تبيع حالياً؟ إنستغرام، محل، منصة أخرى…',
    sending: 'جارٍ الإرسال…',
    submit: 'احجز العرض',
    replyNote: 'نرد خلال يوم عمل واحد. تفضّل البدء الآن؟',
    startFree: 'ابدأ مجاناً',
  },
});
