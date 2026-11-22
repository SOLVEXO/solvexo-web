// Questions sellers type into Google, answered with claims the site already makes (pricing page, /start, product pages).
// One list feeds the "For sellers" block on /faq, the questions on /online-store-pakistan, the pre-built HTML of both
// pages and their FAQPage structured data. English only: these are searches from Pakistan. No React imports (the build
// config reads this file through src/seo).

export interface SellerFaq {
  q: string;
  a: string;
}

export const SELLER_FAQ: SellerFaq[] = [
  {
    q: 'How do I make an online store in Pakistan?',
    a: 'Sign up on Solvexo with Google (no card needed), add your products with photos and prices, set your delivery charges by city, then share your store link on WhatsApp, Facebook and Instagram. Your store gets its own web link, and buyers can pay cash on delivery or by card.',
  },
  {
    q: 'Is Solvexo free?',
    a: 'Every new store starts with a 7-day free trial, and no card is needed to start. After the trial you choose a plan: Basic, Grow, Advanced or Enterprise. The pricing page shows the current price of each plan.',
  },
  {
    q: 'Does Solvexo take commission on cash on delivery?',
    a: 'No. Solvexo takes no commission and no fee on cash on delivery, bank transfer or in-person sales. A small third-party transaction fee, lower on bigger plans, applies only if you take payments through a payment gateway such as Safepay. The pricing page lists it for each plan.',
  },
  {
    q: 'Can my customers pay cash on delivery?',
    a: 'Yes. Cash on delivery and card payments are both available at checkout.',
  },
  {
    q: 'Do I need a website or a developer?',
    a: 'No. Solvexo gives you a ready-made store that you set up yourself, even from your phone. You edit pages, sections, header and footer with a live desktop and mobile preview.',
  },
  {
    q: 'Can I use Solvexo for my shop counter too?',
    a: 'Yes. Solvexo POS lets you sell at the counter with staff PIN login, a live cart and receipts. Every shop sale takes stock from the same count as your online store, so the two never get out of sync.',
  },
  {
    q: 'Is there help in Urdu?',
    a: 'Yes. You can message the Solvexo team in Urdu or English, and the user manuals have an Urdu summary for every chapter.',
  },
];

/** schema.org FAQPage for a list of questions (used in the pre-built HTML). */
export function faqPageJsonLd(items: SellerFaq[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}
