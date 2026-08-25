import { img, type ThemeModule } from './types';

export const luxuryNoir: ThemeModule = {
  definition: {
    id: 'luxury-noir',
    name: 'Luxury Noir',
    description: 'Fine jewelry & premium goods — a deep dark palette with cinematic imagery.',
    category: 'luxury',
    characteristics: ['Dark Palette', 'Cinematic Hero', 'Serif Type'],
    colors: {
      primaryColor: '#C9A461', accentColor: '#8B7333', bgColor: '#0E0D0C', textColor: '#F3F1EA', font: 'Playfair Display',
      buttonStyle: 'outline', buttonRadius: 'none', buttonWidth: 'auto', buttonSize: 'md',
      imageRadius: 'none',
      typeScale: 'spacious', containerWidth: 'wide', sectionSpacing: 'spacious',
      productCardStyle: 'flat', productCardRadius: 'none',
      testimonialCardStyle: 'flat', testimonialCardRadius: 'none',
      heroStyle: 'overlay', heroAlignment: 'center',
      productImageRatio: 'portrait', productImageHover: 'zoom', productGridDensity: 'relaxed',
      testimonialStyle: 'minimal', faqStyle: 'list',
    },
    headerStyle: 'centered', footerStyle: 'minimal',
  },
  demoContent: {
    storeName: 'AURELIA',
    heroHeadline: 'Timeless, by design.',
    heroSubheading: 'Fine jewelry crafted for a lifetime.',
    heroCta: 'Discover the Collection',
    heroImage: img(210, 1600, 900),
    products: [
      { name: '18k Gold Hoop Earrings', price: 420, image: img(220) },
      { name: 'Diamond Pendant Necklace', price: 980, image: img(230) },
      { name: 'Sterling Cuff Bracelet', price: 310, image: img(240) },
    ],
    testimonial: { quote: 'Exquisite craftsmanship — it photographs even better in person.', authorName: 'Camille D.', authorRole: 'Verified Buyer', rating: 5 },
    extras: {
      lookbook: [
        { imageUrl: img(550), caption: 'Solitaire, Reimagined' },
        { imageUrl: img(551), caption: 'Cast in 18k Gold' },
        { imageUrl: img(552), caption: 'The Aurelia Signature' },
      ],
    },
  },
  // Editorial Lookbook (exclusive/primary) sets the cinematic tone, followed
  // by a short atelier promise in rich_text — no products grid repetition,
  // no FAQ/trust badges (deliberately spare, matching this theme's minimal
  // testimonial/FAQ style elsewhere).
  templates: {
    home: [
      {
        type: 'editorial_lookbook',
        settings: { heading: 'The Atelier Edit' },
        blocks: [
          { type: 'lookbook_item', settings: { imageUrl: img(550), caption: 'Solitaire, Reimagined' } },
          { type: 'lookbook_item', settings: { imageUrl: img(551), caption: 'Cast in 18k Gold' } },
          { type: 'lookbook_item', settings: { imageUrl: img(552), caption: 'The Aurelia Signature' } },
        ],
      },
      {
        type: 'rich_text',
        settings: { heading: 'Our Promise', alignment: 'center' },
        blocks: [
          { type: 'paragraph', settings: { text: 'Every Aurelia piece is cast, set, and polished by hand in our Milan atelier — a process that hasn’t changed in three generations.' } },
        ],
      },
    ],
    collection: [
      {
        type: 'trust_badges',
        settings: {},
        blocks: [
          { type: 'trust_badge_item', settings: { icon: 'shield', text: 'Certificate of authenticity' } },
          { type: 'trust_badge_item', settings: { icon: 'lock', text: 'Fully insured shipping' } },
          { type: 'trust_badge_item', settings: { icon: 'headset', text: 'Private client service' } },
        ],
      },
    ],
    product: [
      {
        type: 'faq',
        settings: { heading: 'Ownership & Care' },
        blocks: [
          { type: 'faq_item', settings: { question: 'Does this piece come with a certificate?', answer: 'Every Aurelia piece ships with a signed certificate of authenticity and hallmark verification.' } },
          { type: 'faq_item', settings: { question: 'Can this be resized?', answer: 'Yes — complimentary resizing is available within 60 days of purchase.' } },
        ],
      },
    ],
  },
};
