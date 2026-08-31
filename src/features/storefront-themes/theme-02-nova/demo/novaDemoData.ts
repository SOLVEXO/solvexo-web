import type { Section } from '@/api/services/storefrontTypes';

/** Static demo content for the Theme Library's isolated Nova preview —
 *  genuinely disconnected from any real store/product/category/collection
 *  data (no API calls at all), so this can render for a seller who hasn't
 *  installed Nova yet, or before any real content exists. Mirrors
 *  `theme-01-atelier/demo/atelierDemoData.ts`'s exact same approach —
 *  including its `featured_category_grid`/`featured_products` sections,
 *  now that both are real, registered Nova section types (ported from
 *  Atelier — see `theme-02-nova/sections/index.ts`) fed fictional
 *  showcase data through their own `demoCategories`/`demoProducts` escape
 *  hatch, so this preview reads as a genuinely complete storefront
 *  homepage rather than one that stops short at the sections that don't
 *  need real backend data — and only ever uses section types this theme
 *  actually registers, so nothing here is ever silently dropped by
 *  `NovaSectionRenderer`. */

export const NOVA_DEMO_STORE = {
  name: 'Nova Demo',
  tagline: 'A bold, commerce-first storefront, ready for your products.',
  description: 'This preview shows Nova\'s real section engine with sample content — install the theme to build your own store around it.',
};

const SNEAKER_PASTEL = 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=1200&q=80&auto=format&fit=crop';
const SNEAKER_PASTEL_WIDE = 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=1600&q=80&auto=format&fit=crop';
const SNEAKER_VIVID = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80&auto=format&fit=crop';
const SNEAKER_VIVID_WIDE = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=80&auto=format&fit=crop';
const SNEAKER_FLATLAY = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80&auto=format&fit=crop';

export const NOVA_DEMO_SECTIONS: Section[] = [
  {
    type: 'hero',
    settings: {},
    blocks: [
      {
        type: 'hero_slide',
        settings: {
          heading: 'Made bold. Built to move.',
          subheading: 'New Drop',
          ctaText: 'Shop Now',
          ctaLink: { linkType: 'home' },
          imageUrl: SNEAKER_PASTEL_WIDE,
        },
      },
      {
        type: 'hero_slide',
        settings: {
          heading: 'This week\'s drop is live',
          subheading: 'Limited Run',
          ctaText: 'Shop the Drop',
          ctaLink: { linkType: 'home' },
          imageUrl: SNEAKER_VIVID_WIDE,
        },
      },
    ],
  },
  {
    type: 'rich_text',
    settings: { heading: '', alignment: 'center' },
    blocks: [
      { type: 'paragraph', settings: { text: 'Free shipping over $75. New drops every Friday — sign up isn\'t required, but the good stuff sells out fast.' } },
    ],
  },
  {
    type: 'featured_category_grid',
    settings: {
      heading: 'Shop by Category',
      demoCategories: [
        { _id: 'demo-cat-1', name: 'New Drops', slug: 'new-drops', image: SNEAKER_PASTEL },
        { _id: 'demo-cat-2', name: 'Sneakers', slug: 'sneakers', image: SNEAKER_VIVID },
        { _id: 'demo-cat-3', name: 'Performance', slug: 'performance', image: SNEAKER_FLATLAY },
        { _id: 'demo-cat-4', name: 'Essentials', slug: 'essentials', image: SNEAKER_PASTEL },
      ],
    },
    blocks: [],
  },
  {
    type: 'featured_products',
    settings: {
      heading: 'Best Sellers',
      demoProducts: [
        { _id: 'demo-prod-1', slug: 'volt-runner', name: 'Volt Runner', images: [SNEAKER_PASTEL], defaultVariantPrice: 128 },
        { _id: 'demo-prod-2', slug: 'flex-trainer', name: 'Flex Trainer', images: [SNEAKER_VIVID], defaultVariantPrice: 112 },
        { _id: 'demo-prod-3', slug: 'speed-sock-sneaker', name: 'Speed Sock Sneaker', images: [SNEAKER_FLATLAY], defaultVariantPrice: 98 },
        { _id: 'demo-prod-4', slug: 'court-classic', name: 'Court Classic', images: [SNEAKER_PASTEL], defaultVariantPrice: 105 },
        { _id: 'demo-prod-5', slug: 'trail-blazer-hi', name: 'Trail Blazer Hi', images: [SNEAKER_VIVID], defaultVariantPrice: 135, compareAtPrice: 160 },
        { _id: 'demo-prod-6', slug: 'pulse-knit', name: 'Pulse Knit', images: [SNEAKER_FLATLAY], defaultVariantPrice: 99 },
      ],
    },
    blocks: [],
  },
  {
    type: 'image_with_text',
    settings: {},
    blocks: [
      {
        type: 'image_text_pair',
        settings: {
          heading: 'Designed for speed',
          body: 'Nova pairs vivid color and confident type with a commerce-first layout — built to get buyers from browse to checkout with zero friction.',
          ctaText: 'See How It Works',
          imagePosition: 'left',
          imageUrl: SNEAKER_FLATLAY,
        },
      },
    ],
  },
  {
    type: 'testimonials',
    settings: { heading: 'Loved by shoppers' },
    blocks: [
      { type: 'testimonial', settings: { quote: 'Checkout was instant and the whole store just feels fast.', authorName: 'Zara M.', authorRole: 'Verified Buyer', rating: 5 } },
      { type: 'testimonial', settings: { quote: 'Bold design, easy to browse — found what I wanted in seconds.', authorName: 'Omar T.', authorRole: 'Verified Buyer', rating: 5 } },
      { type: 'testimonial', settings: { quote: 'Exactly the energetic vibe my brand needed.', authorName: 'Leah C.', authorRole: 'Verified Buyer', rating: 4 } },
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
  {
    type: 'faq',
    settings: { heading: 'Frequently Asked Questions' },
    blocks: [
      { type: 'faq_item', settings: { question: 'What is your return policy?', answer: 'We offer a simple 30-day return window on all unused items.' } },
      { type: 'faq_item', settings: { question: 'How long does shipping take?', answer: 'Most orders arrive within 3-7 business days.' } },
      { type: 'faq_item', settings: { question: 'Do you ship internationally?', answer: 'Yes — shipping options are shown at checkout based on your address.' } },
    ],
  },
];
