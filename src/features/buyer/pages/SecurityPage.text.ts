import { siteText } from '@/i18n/site/siteText';
import type { LegalSection, RelatedLegalPage } from '@/components/comman/ui/LegalPageLayout';

// Real architecture-level claims only — every statement below describes a
// practice that actually exists in the Solvexo codebase today (auth, rate
// limiting, payments, RBAC, per-store data isolation). No certifications,
// audits, or third-party claims are made here since none have been
// independently verified — this describes engineering practice, not a
// compliance attestation. The Arabic text says the same, nothing more.
export const SECURITY_TEXT = siteText<{
  pageTitle: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
  relatedPages: RelatedLegalPage[];
}>({
  en: {
    pageTitle: 'Security',
    title: 'Security',
    subtitle: 'How Solvexo protects your account, your data, and your payments.',
    lastUpdated: 'August 2026',
    sections: [
      {
        id: 'account-security',
        title: 'Account Security',
        body: [
          'Passwords are never stored in plain text — every password is hashed before it touches our database, and the original is never recoverable, even by us.',
          'New accounts are verified by a one-time code sent to your email before the account can be used, and every sign-in attempt is rate-limited to make automated password-guessing impractical.',
          'Signing in issues a session-backed access token — signing out (or a password reset) immediately revokes that session, rather than waiting for the token to naturally expire.',
        ],
      },
      {
        id: 'payments',
        title: 'Payments',
        body: [
          'Card details are handled directly by Stripe, our payment processor — Solvexo\'s own servers never receive or store your full card number.',
          'Every payment event Stripe sends us is cryptographically verified before we act on it, so a forged or replayed webhook can\'t be used to fake a payment.',
        ],
        callout: { type: 'security', text: 'Card details are handled directly by Stripe — Solvexo\'s own servers never receive or store your full card number.' },
      },
      {
        id: 'access-control',
        title: 'Access Control',
        body: [
          'Every request is checked against what that specific account is actually allowed to do — a buyer, a seller, and an admin each see and can act on a strictly different set of data.',
          'A seller\'s store data — orders, customers, inventory, analytics — is scoped to that seller\'s own account; one seller cannot read or modify another seller\'s store through the platform.',
        ],
      },
      {
        id: 'data-in-transit',
        title: 'Data in Transit',
        body: [
          'All traffic between your browser and Solvexo is encrypted (HTTPS) — nothing is sent in plain text over the network.',
        ],
      },
      {
        id: 'ongoing-practice',
        title: 'Ongoing Practice',
        body: [
          'Security is treated as an ongoing engineering responsibility, not a one-time checklist — access-control and authentication logic are reviewed and hardened as the platform grows, and issues found internally are fixed directly rather than left open.',
          'We don\'t publish a public bug-bounty program today. If you believe you\'ve found a security issue, reach out through the Contact Us page and describe it — we take reports seriously.',
        ],
      },
    ],
    relatedPages: [
      { title: 'Privacy Policy', description: 'How Solvexo collects, uses, and protects your information.', path: '/privacy-policy' },
      { title: 'Contact Us', description: 'Reach our team, including to report a security concern.', path: '/contact-us' },
    ],
  },
  ar: {
    pageTitle: 'الأمان',
    title: 'الأمان',
    subtitle: 'كيف تحمي Solvexo حسابك وبياناتك ومدفوعاتك.',
    lastUpdated: 'أغسطس 2026',
    sections: [
      {
        id: 'account-security',
        title: 'أمان الحساب',
        body: [
          'لا تُخزَّن كلمات المرور أبداً كنص عادي، إذ تُشفَّر كل كلمة مرور بدالة تجزئة (hash) قبل أن تصل إلى قاعدة بياناتنا، ولا يمكن استعادة الأصل أبداً، حتى من قِبلنا.',
          'يتم التحقق من الحسابات الجديدة برمز يُستخدم لمرة واحدة يُرسل إلى بريدك الإلكتروني قبل إمكانية استخدام الحساب، وكل محاولة تسجيل دخول تخضع لحدّ في عدد المحاولات لجعل التخمين الآلي لكلمات المرور غير عملي.',
          'عند تسجيل الدخول يصدر رمز وصول مرتبط بالجلسة، وعند تسجيل الخروج (أو إعادة تعيين كلمة المرور) تُلغى تلك الجلسة فوراً، بدلاً من انتظار انتهاء صلاحية الرمز.',
        ],
      },
      {
        id: 'payments',
        title: 'المدفوعات',
        body: [
          'تتولى Stripe، مزوّد خدمة الدفع لدينا، معالجة بيانات البطاقات مباشرة، ولا تستلم خوادم Solvexo رقم بطاقتك الكامل ولا تخزّنه أبداً.',
          'يتم التحقق تشفيرياً من كل إشعار دفع ترسله Stripe قبل أن نتخذ أي إجراء بناءً عليه، فلا يمكن استخدام إشعار (webhook) مزوّر أو مُعاد إرساله لتزييف عملية دفع.',
        ],
        callout: { type: 'security', text: 'تتولى Stripe معالجة بيانات البطاقات مباشرة، ولا تستلم خوادم Solvexo رقم بطاقتك الكامل ولا تخزّنه أبداً.' },
      },
      {
        id: 'access-control',
        title: 'التحكم في الوصول',
        body: [
          'يُفحص كل طلب وفق ما يُسمح لذلك الحساب تحديداً بفعله، فلكلٍّ من المشتري والبائع والمسؤول مجموعة مختلفة تماماً من البيانات التي يمكنه رؤيتها والتعامل معها.',
          'بيانات متجر البائع، من طلبات وعملاء ومخزون وتحليلات، مقصورة على حساب ذلك البائع، ولا يمكن لبائع قراءة متجر بائع آخر أو تعديله عبر المنصة.',
        ],
      },
      {
        id: 'data-in-transit',
        title: 'البيانات أثناء النقل',
        body: [
          'كل الاتصالات بين متصفحك وSolvexo مشفّرة (HTTPS)، ولا يُرسل أي شيء كنص عادي عبر الشبكة.',
        ],
      },
      {
        id: 'ongoing-practice',
        title: 'ممارسة مستمرة',
        body: [
          'نتعامل مع الأمان كمسؤولية هندسية مستمرة، لا كقائمة مهام تُنجز مرة واحدة؛ إذ تُراجَع آليات التحكم في الوصول والمصادقة وتُعزَّز مع نمو المنصة، وتُصلَح المشكلات المكتشفة داخلياً مباشرة بدلاً من تركها مفتوحة.',
          'لا ننشر حالياً برنامجاً عاماً لمكافآت اكتشاف الثغرات. إذا كنت تعتقد أنك وجدت مشكلة أمنية، تواصل معنا عبر صفحة "تواصل معنا" وصِفها لنا، فنحن نأخذ البلاغات بجدية.',
        ],
      },
    ],
    relatedPages: [
      { title: 'سياسة الخصوصية', description: 'كيف تجمع Solvexo معلوماتك وتستخدمها وتحميها (باللغة الإنجليزية).', path: '/privacy-policy' },
      { title: 'تواصل معنا', description: 'تواصل مع فريقنا، بما في ذلك للإبلاغ عن مخاوف أمنية.', path: '/contact-us' },
    ],
  },
});
