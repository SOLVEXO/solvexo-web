import { siteText } from '@/i18n/site/siteText';

/** Text of the manuals page (/manuals). Manual titles and part names live in data/manuals.ts. */
export const MANUALS_TEXT = siteText<{
  kicker: string;
  title: string;
  subtitle: string;
  /** Arabic only: the PDFs are written in English. */
  englishNote: string | null;
  forAudience: (audience: string) => string;
  languages: string;
  parts: (n: number) => string;
  downloadComplete: string;
  orOnePart: string;
  helpPre: string;
  helpPost: string;
}>({
  en: {
    kicker: 'User manuals',
    title: 'Step-by-step guides for Solvexo',
    subtitle: 'Download a complete manual or just the chapter you need. Every chapter has real screenshots, and is written in English with an Urdu summary.',
    englishNote: null,
    forAudience: (audience: string) => `For: ${audience}`,
    languages: 'English and Urdu',
    parts: (n: number) => `${n} parts`,
    downloadComplete: 'Download the complete manual',
    orOnePart: 'Or download one part',
    helpPre: "Can't find what you need? Email us at ",
    helpPost: '.',
  },
  ar: {
    kicker: 'أدلة الاستخدام',
    title: 'أدلة Solvexo خطوة بخطوة',
    subtitle: 'حمّل الدليل كاملًا أو الفصل الذي تحتاجه فقط. كل فصل مزوّد بلقطات شاشة حقيقية.',
    englishNote: 'ملاحظة: الأدلة متوفرة حاليًا باللغة الإنجليزية فقط.',
    forAudience: (audience: string) => `موجّه إلى: ${audience}`,
    languages: 'باللغة الإنجليزية',
    parts: (n: number) => (n >= 3 && n <= 10 ? `${n} أجزاء` : `${n} جزءًا`),
    downloadComplete: 'حمّل الدليل الكامل',
    orOnePart: 'أو حمّل جزءًا واحدًا',
    helpPre: 'لم تجد ما تبحث عنه؟ راسلنا على ',
    helpPost: '.',
  },
});
