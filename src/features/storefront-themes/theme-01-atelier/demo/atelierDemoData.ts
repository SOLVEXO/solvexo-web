import type { Section } from '@/api/services/storefrontTypes';

/** Static demo content for the Theme Library's isolated Atelier preview —
 *  genuinely disconnected from any real store/product/category/collection
 *  data (no API calls at all), so this can render for a seller who hasn't
 *  installed Atelier yet, or before any real content exists. Deliberately
 *  omits the section types that require real backend data (`featured_products`,
 *  `product_catalog`, `featured_category_grid`, `collection_product_grid`) —
 *  a disclosed scope boundary, not faked with placeholder product cards. */

export const ATELIER_DEMO_STORE = {
  name: 'Atelier Demo',
  tagline: 'A premium editorial storefront, ready for your products.',
  description: 'This preview shows Atelier\'s real section engine with sample content — install the theme to build your own store around it.',
};

export const ATELIER_DEMO_SECTIONS: Section[] = [
  {
    type: 'hero',
    settings: {},
    blocks: [
      {
        type: 'hero_slide',
        settings: {
          heading: 'Considered pieces, quietly made',
          subheading: 'New Collection',
          ctaText: 'Shop the Collection',
          ctaLink: { linkType: 'home' },
        },
      },
    ],
  },
  {
    type: 'image_with_text',
    settings: {},
    blocks: [
      {
        type: 'image_text_pair',
        settings: {
          heading: 'Our Craft',
          body: 'Every product tells a story of care — from material selection to final finishing. Atelier\'s editorial layout gives your story room to breathe.',
          ctaText: 'Learn More',
          imagePosition: 'left',
        },
      },
    ],
  },
  {
    type: 'testimonials',
    settings: { heading: 'What buyers say' },
    blocks: [
      { type: 'testimonial', settings: { quote: 'The quality is exactly what I hoped for — considered, well-made, and beautifully presented.', authorName: 'Amara K.', authorRole: 'Verified Buyer', rating: 5 } },
      { type: 'testimonial', settings: { quote: 'Fast shipping, and the product looked even better in person than online.', authorName: 'Daniel R.', authorRole: 'Verified Buyer', rating: 5 } },
      { type: 'testimonial', settings: { quote: 'A genuinely different shopping experience — calm, confident, and easy to trust.', authorName: 'Priya S.', authorRole: 'Verified Buyer', rating: 4 } },
    ],
  },
  {
    type: 'faq',
    settings: { heading: 'Frequently Asked Questions' },
    blocks: [
      { type: 'faq_item', settings: { question: 'What is your return policy?', answer: 'We offer a simple 30-day return window on all unused items.' } },
      { type: 'faq_item', settings: { question: 'How long does shipping take?', answer: 'Most orders arrive within 3-7 business days.' } },
      { type: 'faq_item', settings: { question: 'Do you ship internationally?', answer: 'Yes — shipping options are shown at checkout based on your address.' } },
    ],
  },
  {
    type: 'trust_badges',
    settings: {},
    blocks: [
      { type: 'trust_badge_item', settings: { icon: 'truck', text: 'Fast, tracked shipping' } },
      { type: 'trust_badge_item', settings: { icon: 'shield', text: 'Secure checkout' } },
      { type: 'trust_badge_item', settings: { icon: 'refresh', text: 'Easy 30-day returns' } },
      { type: 'trust_badge_item', settings: { icon: 'headset', text: 'Real human support' } },
    ],
  },
];
