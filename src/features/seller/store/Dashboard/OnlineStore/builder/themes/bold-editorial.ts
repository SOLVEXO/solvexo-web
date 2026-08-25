import { img, type ThemeModule } from './types';

export const boldEditorial: ThemeModule = {
  definition: {
    id: 'bold-editorial',
    name: 'Bold Editorial',
    description: 'Magazine-inspired commerce — oversized serif headlines and a bordered product grid.',
    category: 'fashion',
    characteristics: ['Oversized Type', 'Split Hero', 'Bordered Cards'],
    colors: {
      primaryColor: '#8A6D3B', accentColor: '#5F4A28', bgColor: '#FBFAF7', textColor: '#242220', font: 'Fraunces',
      buttonStyle: 'outline', buttonRadius: 'small', buttonWidth: 'auto', buttonSize: 'lg',
      imageRadius: 'large',
      typeScale: 'spacious', containerWidth: 'wide', sectionSpacing: 'spacious',
      productCardStyle: 'outlined', productCardRadius: 'small',
      testimonialCardStyle: 'elevated', testimonialCardRadius: 'large',
      heroStyle: 'split', heroAlignment: 'left',
      productImageRatio: 'portrait', productImageHover: 'none', productGridDensity: 'relaxed',
      testimonialStyle: 'cards', faqStyle: 'accordion',
    },
    headerStyle: 'standard', footerStyle: 'columns',
  },
  demoContent: {
    storeName: 'THE FIELD JOURNAL',
    heroHeadline: 'Issue No. 12 — The Edit.',
    heroSubheading: 'Stories in fabric. A seasonal capsule, curated.',
    heroCta: 'Read the Edit',
    heroImage: img(130, 1600, 900),
    products: [
      { name: 'Editorial Trench Coat', price: 298, image: img(140) },
      { name: 'Statement Sunglasses', price: 89, image: img(150) },
      { name: 'Structured Tote', price: 210, image: img(160) },
    ],
    testimonial: { quote: 'Feels less like shopping and more like reading a magazine.', authorName: 'Jonas W.', authorRole: 'Verified Buyer', rating: 5 },
    extras: {
      story: {
        heading: 'Behind Issue No. 12',
        body: 'Shot over three days on location, styled entirely with pieces from this capsule.',
        imageUrl: img(530),
        ctaText: 'See the Story',
      },
      faqs: [
        { question: 'How do I care for these fabrics?', answer: 'Most pieces are dry-clean only — full care instructions ship with every order.' },
        { question: 'Can I return an item from a capsule?', answer: 'Yes, within 14 days, unworn and with tags attached.' },
      ],
    },
  },
  // No exclusive section fits this theme — composed entirely from shared
  // types instead: an editor's-note rich-text essay, a feature spread, then
  // an FAQ. A genuinely different sequence/mix from every other theme.
  templates: {
    home: [
      {
        type: 'rich_text',
        settings: { heading: 'From the Editor' },
        blocks: [
          { type: 'paragraph', settings: { text: 'This season’s edit is about restraint — fewer pieces, worn longer, chosen with intention.' } },
          { type: 'quote', settings: { text: 'Style is a sentence, and every piece is a word.', author: 'THE FIELD JOURNAL' } },
        ],
      },
      {
        type: 'image_with_text',
        settings: {},
        blocks: [
          { type: 'image_text_pair', settings: { imageUrl: img(530), heading: 'Behind Issue No. 12', body: 'Shot over three days on location, styled entirely with pieces from this capsule.', ctaText: 'See the Story', imagePosition: 'left' } },
        ],
      },
      {
        type: 'faq',
        settings: { heading: 'Ordering & Care' },
        blocks: [
          { type: 'faq_item', settings: { question: 'How do I care for these fabrics?', answer: 'Most pieces are dry-clean only — full care instructions ship with every order.' } },
          { type: 'faq_item', settings: { question: 'Can I return an item from a capsule?', answer: 'Yes, within 14 days, unworn and with tags attached.' } },
        ],
      },
    ],
    collection: [
      {
        type: 'trust_badges',
        settings: {},
        blocks: [
          { type: 'trust_badge_item', settings: { icon: 'truck', text: 'Complimentary shipping' } },
          { type: 'trust_badge_item', settings: { icon: 'refresh', text: '14-day returns' } },
          { type: 'trust_badge_item', settings: { icon: 'headset', text: 'Styling support' } },
        ],
      },
    ],
    product: [
      {
        type: 'faq',
        settings: { heading: 'Ordering & Care' },
        blocks: [
          { type: 'faq_item', settings: { question: 'How do I care for these fabrics?', answer: 'Most pieces are dry-clean only — full care instructions ship with every order.' } },
          { type: 'faq_item', settings: { question: 'Can I return an item from a capsule?', answer: 'Yes, within 14 days, unworn and with tags attached.' } },
        ],
      },
    ],
  },
};
