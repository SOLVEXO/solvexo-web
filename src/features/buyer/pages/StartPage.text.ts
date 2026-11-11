import { siteText } from '@/i18n/site/siteText';
import { AR_DAYS, AR_MONTHS, arCount } from './pricing/arabicCount';

const arDays = (n: number) => arCount(n, AR_DAYS);

/**
 * Text of the ad landing page (/start). The English page carries Urdu lines for Pakistani visitors (`ur`);
 * the Arabic page leaves them out (`ur: null` / `heroUr: null`).
 */
export const START_TEXT = siteText<{
  whatsappText: string;
  steps: { title: string; ur: string | null; body: string }[];
  features: { title: string; body: string }[];
  faq: { q: string; a: string }[];
  startFree: (days: number) => string;
  trialBadge: (days: number) => string;
  heroTitle: string;
  heroUr: string | null;
  heroSub: string;
  plansFromPre: string;
  plansFromPost: string;
  percentOff: (n: number) => string;
  introLine: (months: number, price: string) => string;
  askWhatsapp: string;
  stepsTitle: string;
  featuresTitle: string;
  seePlans: string;
  faqTitle: string;
  startFreeShort: string;
  enterName: string;
  enterPhone: string;
  sendFailed: string;
  thanks: (firstName: string) => string;
  willCall: string;
  helpTitle: string;
  helpSub: string;
  nameLabel: string;
  phoneLabel: string;
  phonePlaceholder: string;
  cityLabel: string;
  cityPlaceholder: string;
  sending: string;
  callMeBack: string;
}>({
  en: {
    whatsappText: 'Assalam o Alaikum, I want to start my online store on Solvexo.',
    steps: [
      { title: 'Create your account', ur: 'اکاؤنٹ بنائیں', body: 'Sign up with Google in one tap. No card needed.' },
      { title: 'Add your products', ur: 'اپنی چیزیں شامل کریں', body: 'Take photos on your phone, add a price, done.' },
      { title: 'Share your store link', ur: 'لنک شیئر کریں', body: 'Post it on WhatsApp, Facebook and Instagram and take orders.' },
    ],
    features: [
      { title: 'Your own online store', body: 'Your shop name, your products, your own web link.' },
      { title: 'Cash on delivery', body: 'Take COD and card payments at checkout.' },
      { title: 'Delivery charges by city', body: 'Set delivery areas and charges once.' },
      { title: 'POS for your shop counter', body: 'Sell in the shop from a phone or tablet.' },
      { title: 'One stock list', body: 'Shop and online sales take stock from the same count.' },
      { title: 'Easy to share', body: 'Send your store link to customers in seconds.' },
    ],
    faq: [
      { q: 'Do I need a website or a developer?', a: 'No. Solvexo gives you a ready-made store you set up from your phone.' },
      { q: 'Can customers pay cash on delivery?', a: 'Yes. Cash on delivery and card payments are both available at checkout.' },
      { q: 'Do I need a card to start?', a: 'No. Every new store starts with a free trial and no card is needed.' },
      { q: 'Is there help in Urdu?', a: 'You can message us in Urdu or English, and every chapter of the user manuals has an Urdu summary.' },
    ],
    startFree: (days: number) => `Start free for ${days} days`,
    trialBadge: (days: number) => `${days}-day free trial · No card needed`,
    heroTitle: 'Take your shop online',
    heroUr: 'اپنی دکان آن لائن لے آئیں',
    heroSub: 'Your own online store with cash on delivery, plus a POS for your shop counter. Orders, stock and bills in one place.',
    plansFromPre: 'Plans from ',
    plansFromPost: ' a month',
    percentOff: (n: number) => `${n}% off`,
    introLine: (months: number, price: string) => `First ${months} months: ${price} a month`,
    askWhatsapp: 'Ask on WhatsApp',
    stepsTitle: 'Live in 3 steps',
    featuresTitle: 'Everything you need to sell',
    seePlans: 'See all plans and prices',
    faqTitle: 'Questions',
    startFreeShort: 'Start free',
    enterName: 'Enter your name.',
    enterPhone: 'Enter your mobile number, for example 0300 1234567.',
    sendFailed: 'Could not send. Please try again, or start free above.',
    thanks: (firstName: string) => `Thank you, ${firstName}.`,
    willCall: 'Our team will call you soon to help set up your store.',
    helpTitle: 'Want help setting up?',
    helpSub: 'Leave your number and our team will call you to set up your store with you.',
    nameLabel: 'Your name',
    phoneLabel: 'Mobile number',
    phonePlaceholder: '0300 1234567',
    cityLabel: 'City (optional)',
    cityPlaceholder: 'Karachi',
    sending: 'Sending…',
    callMeBack: 'Call me back',
  },
  ar: {
    whatsappText: 'مرحبًا، أريد إطلاق متجري الإلكتروني على Solvexo.',
    steps: [
      { title: 'أنشئ حسابك', ur: null, body: 'سجّل بحساب Google بنقرة واحدة، دون الحاجة إلى بطاقة.' },
      { title: 'أضف منتجاتك', ur: null, body: 'صوّر منتجاتك بهاتفك، وأضف السعر، وانتهى الأمر.' },
      { title: 'شارك رابط متجرك', ur: null, body: 'انشره على واتساب وفيسبوك وإنستغرام واستقبل الطلبات.' },
    ],
    features: [
      { title: 'متجرك الإلكتروني الخاص', body: 'باسم متجرك ومنتجاتك ورابطك الخاص.' },
      { title: 'الدفع عند الاستلام', body: 'استقبل الدفع عند الاستلام ومدفوعات البطاقات عند إتمام الطلب.' },
      { title: 'رسوم التوصيل حسب المدينة', body: 'حدّد مناطق التوصيل ورسومه مرة واحدة.' },
      { title: 'نقطة بيع لكاونتر متجرك', body: 'بِع في المتجر من الهاتف أو الجهاز اللوحي.' },
      { title: 'قائمة مخزون واحدة', body: 'مبيعات المتجر والمبيعات الإلكترونية تُخصم من المخزون نفسه.' },
      { title: 'سهل المشاركة', body: 'أرسل رابط متجرك إلى عملائك في ثوانٍ.' },
    ],
    // The Urdu-help question is for Pakistani visitors and has no Arabic equivalent, so the Arabic page leaves it out.
    faq: [
      { q: 'هل أحتاج إلى موقع إلكتروني أو مبرمج؟', a: 'لا. يمنحك Solvexo متجرًا جاهزًا تجهّزه من هاتفك.' },
      { q: 'هل يمكن للعملاء الدفع عند الاستلام؟', a: 'نعم. الدفع عند الاستلام ومدفوعات البطاقات متاحان عند إتمام الطلب.' },
      { q: 'هل أحتاج إلى بطاقة للبدء؟', a: 'لا. يبدأ كل متجر جديد بتجربة مجانية دون الحاجة إلى بطاقة.' },
    ],
    startFree: (days: number) => `ابدأ مجانًا لمدة ${arDays(days)}`,
    trialBadge: (days: number) => `تجربة مجانية لمدة ${arDays(days)} · دون بطاقة`,
    heroTitle: 'انقل متجرك إلى الإنترنت',
    heroUr: null,
    heroSub: 'متجرك الإلكتروني الخاص مع الدفع عند الاستلام، ونقطة بيع لكاونتر متجرك. الطلبات والمخزون والفواتير في مكان واحد.',
    plansFromPre: 'الباقات تبدأ من ',
    plansFromPost: ' شهريًا',
    percentOff: (n: number) => `خصم ${n}%`,
    introLine: (months: number, price: string) => `أول ${arCount(months, AR_MONTHS)}: ${price} شهريًا`,
    askWhatsapp: 'اسألنا على واتساب',
    stepsTitle: 'متجرك جاهز في 3 خطوات',
    featuresTitle: 'كل ما تحتاجه للبيع',
    seePlans: 'اطّلع على كل الباقات والأسعار',
    faqTitle: 'أسئلة شائعة',
    startFreeShort: 'ابدأ مجانًا',
    enterName: 'أدخل اسمك.',
    enterPhone: 'أدخل رقم جوالك، مثل 050 123 4567.',
    sendFailed: 'تعذّر الإرسال. حاول مرة أخرى، أو ابدأ مجانًا من الأعلى.',
    thanks: (firstName: string) => `شكرًا لك يا ${firstName}.`,
    willCall: 'سيتصل بك فريقنا قريبًا لمساعدتك في إعداد متجرك.',
    helpTitle: 'تريد مساعدة في الإعداد؟',
    helpSub: 'اترك رقمك وسيتصل بك فريقنا لإعداد متجرك معك.',
    nameLabel: 'اسمك',
    phoneLabel: 'رقم الجوال',
    phonePlaceholder: '050 123 4567',
    cityLabel: 'المدينة (اختياري)',
    cityPlaceholder: 'دبي',
    sending: 'جارٍ الإرسال…',
    callMeBack: 'اتصلوا بي',
  },
});
