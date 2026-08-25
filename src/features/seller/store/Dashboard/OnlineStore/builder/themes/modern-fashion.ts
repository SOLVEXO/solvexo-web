import { img, type ThemeModule } from './types';

export const modernFashion: ThemeModule = {
  definition: {
    id: 'modern-fashion',
    name: 'Modern Fashion',
    description: 'Premium fashion — dramatic split hero, editorial type, and a full-width CTA.',
    category: 'fashion',
    characteristics: ['Split Hero', 'Editorial Type', 'Full-Width CTA'],
    colors: {
      primaryColor: '#1F1B2E', accentColor: '#C9A15A', bgColor: '#FFFFFF', textColor: '#1A1720', font: 'Montserrat',
      buttonStyle: 'solid', buttonRadius: 'small', buttonWidth: 'full', buttonSize: 'lg',
      imageRadius: 'small',
      typeScale: 'comfortable', containerWidth: 'wide', sectionSpacing: 'comfortable',
      productCardStyle: 'elevated', productCardRadius: 'small',
      testimonialCardStyle: 'flat', testimonialCardRadius: 'none',
      heroStyle: 'split', heroAlignment: 'left',
      productImageRatio: 'portrait', productImageHover: 'zoom', productGridDensity: 'relaxed',
      testimonialStyle: 'cards', faqStyle: 'accordion',
    },
    headerStyle: 'centered', footerStyle: 'minimal',
  },
  demoContent: {
    storeName: 'NOIR MAISON',
    heroHeadline: 'The Fall/Winter Edit.',
    heroSubheading: 'Tailored silhouettes for a modern wardrobe.',
    heroCta: 'Shop Now',
    heroImage: img(50, 1600, 900),
    products: [
      { name: 'Tailored Wool Coat', price: 340, image: img(60) },
      { name: 'Silk Slip Dress', price: 210, image: img(70) },
      { name: 'Structured Leather Bag', price: 265, image: img(80) },
    ],
    testimonial: { quote: 'The quality and fit are unmatched. Worth every dollar.', authorName: 'Amara K.', authorRole: 'Verified Buyer', rating: 5 },
    extras: {
      lookbook: [
        { imageUrl: img(510), caption: 'Look 01 — The Tailored Coat' },
        { imageUrl: img(511), caption: 'Look 02 — Silk & Structure' },
        { imageUrl: img(512), caption: 'Look 03 — Evening Edit' },
      ],
      faqs: [
        { question: 'How does NOIR MAISON sizing run?', answer: 'True to size — check our size guide for exact measurements before ordering.' },
        { question: 'Do you ship internationally?', answer: 'Yes, we ship to over 30 countries with tracked delivery.' },
      ],
    },
  },
  // Editorial Lookbook (secondary use of luxury-noir's exclusive section —
  // fits Modern Fashion's own editorial identity just as well) followed by
  // a sizing/shipping FAQ.
  templates: {
    home: [
      {
        type: 'editorial_lookbook',
        settings: { heading: 'The Fall/Winter Lookbook' },
        blocks: [
          { type: 'lookbook_item', settings: { imageUrl: img(510), caption: 'Look 01 — The Tailored Coat' } },
          { type: 'lookbook_item', settings: { imageUrl: img(511), caption: 'Look 02 — Silk & Structure' } },
          { type: 'lookbook_item', settings: { imageUrl: img(512), caption: 'Look 03 — Evening Edit' } },
        ],
      },
      {
        type: 'faq',
        settings: { heading: 'Sizing & Shipping' },
        blocks: [
          { type: 'faq_item', settings: { question: 'How does NOIR MAISON sizing run?', answer: 'True to size — check our size guide for exact measurements before ordering.' } },
          { type: 'faq_item', settings: { question: 'Do you ship internationally?', answer: 'Yes, we ship to over 30 countries with tracked delivery.' } },
        ],
      },
    ],
    collection: [
      {
        type: 'trust_badges',
        settings: {},
        blocks: [
          { type: 'trust_badge_item', settings: { icon: 'truck', text: 'Complimentary tracked shipping' } },
          { type: 'trust_badge_item', settings: { icon: 'refresh', text: '30-day exchanges' } },
          { type: 'trust_badge_item', settings: { icon: 'lock', text: 'Secure checkout' } },
        ],
      },
    ],
    product: [
      {
        type: 'faq',
        settings: { heading: 'Sizing & Shipping' },
        blocks: [
          { type: 'faq_item', settings: { question: 'How does NOIR MAISON sizing run?', answer: 'True to size — check our size guide for exact measurements before ordering.' } },
          { type: 'faq_item', settings: { question: 'Do you ship internationally?', answer: 'Yes, we ship to over 30 countries with tracked delivery.' } },
        ],
      },
    ],
  },
};
