import type { Section } from '@/api/services/storefrontTypes';

/** Static demo content for the Theme Library's isolated Atelier preview —
 *  genuinely disconnected from any real store/product/category/collection
 *  data (no API calls at all), so this can render for a seller who hasn't
 *  installed Atelier yet, or before any real content exists.
 *
 *  Every image below is a real photograph (Unsplash CDN) rather than an
 *  empty color block — see `themeDemoPreview.ts`'s doc comment. The
 *  `featured_category_grid`/`featured_products` sections below use the
 *  exact same real, registered Atelier components a live store gets
 *  (`FeaturedCategoryGridSection`/`FeaturedProductsSection` →
 *  `AtelierProductCard`), fed fictional showcase data through each
 *  component's own `demoCategories`/`demoProducts` escape hatch — see
 *  those files' doc comments — instead of being disclosed away entirely,
 *  so the preview reads as a genuinely complete storefront homepage
 *  (hero → banner → shop-by-category → featured products → story →
 *  testimonials → trust → FAQ), the same shape WordPress/Shopify's own
 *  theme demos use, rather than stopping short at the sections that don't
 *  need real backend data. */

export const ATELIER_DEMO_STORE = {
  name: 'Atelier Demo',
  tagline: 'A premium editorial storefront, ready for your products.',
  description: 'This preview shows Atelier\'s real section engine with sample content — install the theme to build your own store around it.',
};

const HANGERS = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80&auto=format&fit=crop';
const HANGERS_WIDE = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80&auto=format&fit=crop';
const BOUTIQUE = 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&q=80&auto=format&fit=crop';
const BOUTIQUE_WIDE = 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&q=80&auto=format&fit=crop';
const EDITORIAL = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80&auto=format&fit=crop';

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
          imageUrl: HANGERS_WIDE,
        },
      },
      {
        type: 'hero_slide',
        settings: {
          heading: 'Made to last, styled to love',
          subheading: 'Editorial Edit',
          ctaText: 'Explore the Edit',
          ctaLink: { linkType: 'home' },
          imageUrl: BOUTIQUE_WIDE,
        },
      },
    ],
  },
  {
    type: 'rich_text',
    settings: { heading: '', alignment: 'center' },
    blocks: [
      { type: 'paragraph', settings: { text: 'Complimentary shipping on every order over $150 — considered packaging, delivered with care.' } },
    ],
  },
  {
    type: 'featured_category_grid',
    settings: {
      heading: 'Shop by Category',
      demoCategories: [
        { _id: 'demo-cat-1', name: 'New Arrivals', slug: 'new-arrivals', image: HANGERS },
        { _id: 'demo-cat-2', name: 'Outerwear', slug: 'outerwear', image: BOUTIQUE },
        { _id: 'demo-cat-3', name: 'Accessories', slug: 'accessories', image: EDITORIAL },
        { _id: 'demo-cat-4', name: 'Essentials', slug: 'essentials', image: HANGERS },
      ],
    },
    blocks: [],
  },
  {
    type: 'featured_products',
    settings: {
      heading: 'Featured Pieces',
      demoProducts: [
        { _id: 'demo-prod-1', slug: 'wool-overcoat', name: 'Wool Overcoat', images: [BOUTIQUE], defaultVariantPrice: 340 },
        { _id: 'demo-prod-2', slug: 'silk-blouse', name: 'Silk Blouse', images: [EDITORIAL], defaultVariantPrice: 128 },
        { _id: 'demo-prod-3', slug: 'tailored-trousers', name: 'Tailored Trousers', images: [HANGERS], defaultVariantPrice: 165 },
        { _id: 'demo-prod-4', slug: 'cashmere-scarf', name: 'Cashmere Scarf', images: [EDITORIAL], defaultVariantPrice: 95 },
        { _id: 'demo-prod-5', slug: 'leather-tote', name: 'Leather Tote', images: [BOUTIQUE], defaultVariantPrice: 210 },
        { _id: 'demo-prod-6', slug: 'merino-sweater', name: 'Merino Sweater', images: [HANGERS], defaultVariantPrice: 150, compareAtPrice: 190 },
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
          heading: 'Our Craft',
          body: 'Every product tells a story of care — from material selection to final finishing. Atelier\'s editorial layout gives your story room to breathe.',
          ctaText: 'Learn More',
          imagePosition: 'left',
          imageUrl: EDITORIAL,
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
