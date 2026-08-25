import { img, type ThemeModule } from './types';

export const coastalBreeze: ThemeModule = {
  definition: {
    id: 'coastal-breeze',
    name: 'Coastal Breeze',
    description: 'Resort & beach lifestyle — airy teal and sand tones, a centered overlay hero, and soft pill buttons.',
    category: 'lifestyle',
    characteristics: ['Airy Palette', 'Centered Hero', 'Pill Buttons'],
    colors: {
      primaryColor: '#2A9D8F', accentColor: '#E76F51', bgColor: '#FBFEFD', textColor: '#173A36', font: 'DM Sans',
      buttonStyle: 'soft', buttonRadius: 'full', buttonWidth: 'auto', buttonSize: 'md',
      imageRadius: 'large',
      typeScale: 'comfortable', containerWidth: 'wide', sectionSpacing: 'spacious',
      productCardStyle: 'elevated', productCardRadius: 'medium',
      testimonialCardStyle: 'outlined', testimonialCardRadius: 'full',
      heroStyle: 'overlay', heroAlignment: 'center',
      productImageRatio: 'square', productImageHover: 'zoom', productGridDensity: 'relaxed',
      testimonialStyle: 'cards', faqStyle: 'list',
    },
    headerStyle: 'centered', footerStyle: 'columns',
  },
  demoContent: {
    storeName: 'Salt & Sand Co.',
    heroHeadline: 'Summer, all year round.',
    heroSubheading: 'Breezy essentials for the coast and beyond.',
    heroCta: 'Shop the Collection',
    heroImage: img(410, 1600, 900),
    products: [
      { name: 'Linen Beach Kaftan', price: 68, image: img(420) },
      { name: 'Woven Straw Tote', price: 45, image: img(430) },
      { name: 'Polarized Sunglasses', price: 52, image: img(440) },
    ],
    testimonial: { quote: 'Feels like a permanent vacation wardrobe.', authorName: 'Talia M.', authorRole: 'Verified Buyer', rating: 5 },
    extras: {
      story: {
        heading: 'Designed on the Shoreline',
        body: 'Every Salt & Sand piece is designed and sample-tested on the beaches of our home coast.',
        imageUrl: img(600),
        ctaText: 'Our Story',
      },
      trustBadges: [
        { icon: 'truck', text: 'Free shipping over $75' },
        { icon: 'refresh', text: 'Easy 30-day returns' },
        { icon: 'shield', text: 'Sustainably sourced' },
      ],
      faqs: [
        { question: 'Do your kaftans run true to size?', answer: 'They’re designed with a relaxed, one-size-fits-most fit.' },
        { question: 'How long does delivery take?', answer: '3-5 business days within the continental US.' },
      ],
    },
  },
  // No exclusive section fits this theme either — composed from shared
  // types in a different order/mix from Bold Editorial's (the only other
  // shared-types-only theme): a brand-story feature leads here instead of
  // trailing, with trust badges before the FAQ.
  templates: {
    home: [
      {
        type: 'image_with_text',
        settings: {},
        blocks: [
          { type: 'image_text_pair', settings: { imageUrl: img(600), heading: 'Designed on the Shoreline', body: 'Every Salt & Sand piece is designed and sample-tested on the beaches of our home coast.', ctaText: 'Our Story', imagePosition: 'left' } },
        ],
      },
      {
        type: 'trust_badges',
        settings: {},
        blocks: [
          { type: 'trust_badge_item', settings: { icon: 'truck', text: 'Free shipping over $75' } },
          { type: 'trust_badge_item', settings: { icon: 'refresh', text: 'Easy 30-day returns' } },
          { type: 'trust_badge_item', settings: { icon: 'shield', text: 'Sustainably sourced' } },
        ],
      },
      {
        type: 'faq',
        settings: { heading: 'Shipping & Fit' },
        blocks: [
          { type: 'faq_item', settings: { question: 'Do your kaftans run true to size?', answer: 'They’re designed with a relaxed, one-size-fits-most fit.' } },
          { type: 'faq_item', settings: { question: 'How long does delivery take?', answer: '3-5 business days within the continental US.' } },
        ],
      },
    ],
    collection: [
      {
        type: 'trust_badges',
        settings: {},
        blocks: [
          { type: 'trust_badge_item', settings: { icon: 'truck', text: 'Free shipping over $75' } },
          { type: 'trust_badge_item', settings: { icon: 'refresh', text: 'Easy 30-day returns' } },
          { type: 'trust_badge_item', settings: { icon: 'shield', text: 'Sustainably sourced' } },
        ],
      },
    ],
    product: [
      {
        type: 'faq',
        settings: { heading: 'Fit & Delivery' },
        blocks: [
          { type: 'faq_item', settings: { question: 'Does this run true to size?', answer: 'Our pieces are designed with a relaxed, one-size-fits-most fit.' } },
          { type: 'faq_item', settings: { question: 'How long does delivery take?', answer: '3-5 business days within the continental US.' } },
        ],
      },
    ],
  },
};
