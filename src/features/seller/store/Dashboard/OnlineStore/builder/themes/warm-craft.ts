import { img, type ThemeModule } from './types';

// Baseline theme — intentionally matches every schema default exactly, so
// it's the safe equivalent a pre-existing store (or a fresh one that's
// never applied a theme) already renders as.
export const warmCraft: ThemeModule = {
  definition: {
    id: 'warm-craft',
    name: 'Warm Craft',
    description: 'Artisan & handmade — warm terracotta, a full-bleed hero, and soft rounded cards.',
    category: 'lifestyle',
    characteristics: ['Full-Bleed Hero', 'Warm Terracotta', 'Rounded Cards'],
    colors: {
      primaryColor: '#D97757', accentColor: '#B95A3A', bgColor: '#FAF9F5', textColor: '#2C2A28', font: 'Poppins',
      buttonStyle: 'solid', buttonRadius: 'medium', buttonWidth: 'auto', buttonSize: 'md',
      imageRadius: 'medium',
      typeScale: 'comfortable', containerWidth: 'standard', sectionSpacing: 'comfortable',
      productCardStyle: 'outlined', productCardRadius: 'medium',
      testimonialCardStyle: 'outlined', testimonialCardRadius: 'medium',
      heroStyle: 'overlay', heroAlignment: 'left',
      productImageRatio: 'square', productImageHover: 'none', productGridDensity: 'cozy',
      testimonialStyle: 'cards', faqStyle: 'accordion',
    },
    headerStyle: 'standard', footerStyle: 'columns',
  },
  demoContent: {
    storeName: 'Willow & Clay',
    heroHeadline: 'Handcrafted, with intention.',
    heroSubheading: 'Small-batch ceramics and leather goods, made slowly.',
    heroCta: 'Shop the Collection',
    heroImage: img(10, 1600, 900),
    products: [
      { name: 'Luna Leather Tote', price: 129, image: img(20) },
      { name: 'Hand-Thrown Ceramic Mug', price: 34, image: img(30) },
      { name: 'Woven Market Basket', price: 58, image: img(40) },
    ],
    testimonial: { quote: 'Every piece feels like it was made just for me.', authorName: 'Priya N.', authorRole: 'Verified Buyer', rating: 5 },
    extras: {
      processSteps: [
        { title: 'Sourced by Hand', body: 'Clay, leather, and thread chosen personally from small regional suppliers.' },
        { title: 'Shaped Slowly', body: 'Every piece is thrown, cut, or stitched one at a time — no molds, no shortcuts.' },
        { title: 'Finished with Care', body: 'Glazed, oiled, or waxed by hand, then inspected before it leaves the studio.' },
        { title: 'Packed & Sent', body: 'Wrapped in recycled paper and shipped straight from our workshop to your door.' },
      ],
      story: {
        heading: 'From a Kitchen Table to a Working Studio',
        body: 'Willow & Clay started in 2016 with one potter’s wheel. Today it’s a studio of six makers who still throw every mug by hand.',
        imageUrl: img(500),
        ctaText: 'Meet the Makers',
      },
      trustBadges: [
        { icon: 'truck', text: 'Ships within 3 days' },
        { icon: 'shield', text: 'Handmade guarantee' },
        { icon: 'refresh', text: '30-day returns' },
        { icon: 'headset', text: 'Real studio support' },
      ],
    },
  },
  // Craft Process (exclusive) leads — a typographic step-by-step of how a
  // piece gets made — followed by the studio's own story and a trust strip.
  templates: {
    home: [
      {
        type: 'craft_process',
        settings: { heading: 'How Each Piece Is Made' },
        blocks: [
          { type: 'craft_process_step', settings: { title: 'Sourced by Hand', body: 'Clay, leather, and thread chosen personally from small regional suppliers.' } },
          { type: 'craft_process_step', settings: { title: 'Shaped Slowly', body: 'Every piece is thrown, cut, or stitched one at a time — no molds, no shortcuts.' } },
          { type: 'craft_process_step', settings: { title: 'Finished with Care', body: 'Glazed, oiled, or waxed by hand, then inspected before it leaves the studio.' } },
          { type: 'craft_process_step', settings: { title: 'Packed & Sent', body: 'Wrapped in recycled paper and shipped straight from our workshop to your door.' } },
        ],
      },
      {
        type: 'image_with_text',
        settings: {},
        blocks: [
          { type: 'image_text_pair', settings: { imageUrl: img(500), heading: 'From a Kitchen Table to a Working Studio', body: 'Willow & Clay started in 2016 with one potter’s wheel. Today it’s a studio of six makers who still throw every mug by hand.', ctaText: 'Meet the Makers', imagePosition: 'right' } },
        ],
      },
      {
        type: 'trust_badges',
        settings: {},
        blocks: [
          { type: 'trust_badge_item', settings: { icon: 'truck', text: 'Ships within 3 days' } },
          { type: 'trust_badge_item', settings: { icon: 'shield', text: 'Handmade guarantee' } },
          { type: 'trust_badge_item', settings: { icon: 'refresh', text: '30-day returns' } },
          { type: 'trust_badge_item', settings: { icon: 'headset', text: 'Real studio support' } },
        ],
      },
    ],
    // Collection browse: the same reassurance strip as Home, right below the
    // product grid — appropriate wherever a buyer is deciding to add to cart.
    collection: [
      {
        type: 'trust_badges',
        settings: {},
        blocks: [
          { type: 'trust_badge_item', settings: { icon: 'truck', text: 'Ships within 3 days' } },
          { type: 'trust_badge_item', settings: { icon: 'shield', text: 'Handmade guarantee' } },
          { type: 'trust_badge_item', settings: { icon: 'refresh', text: '30-day returns' } },
        ],
      },
    ],
    // Product detail: care/authenticity questions a buyer has right before purchasing a handmade piece.
    product: [
      {
        type: 'faq',
        settings: { heading: 'Before You Order' },
        blocks: [
          { type: 'faq_item', settings: { question: 'Is every piece really one of a kind?', answer: 'Yes — small natural variations in glaze, grain, or stitching are part of being handmade, not a flaw.' } },
          { type: 'faq_item', settings: { question: 'How do I care for a handmade piece?', answer: 'Ceramics are hand-wash only; leather goods should be conditioned every few months to stay supple.' } },
        ],
      },
    ],
  },
};
