import { img, type ThemeModule } from './types';

export const minimalBoutique: ThemeModule = {
  definition: {
    id: 'minimal-boutique',
    name: 'Minimal Boutique',
    description: 'Quiet luxury — restrained monochrome, sharp corners, and generous whitespace.',
    category: 'general',
    characteristics: ['Whitespace-First', 'Thin Type', 'Sharp Corners'],
    colors: {
      primaryColor: '#111111', accentColor: '#6E6E6E', bgColor: '#FFFFFF', textColor: '#111111', font: 'Inter',
      buttonStyle: 'outline', buttonRadius: 'none', buttonWidth: 'auto', buttonSize: 'sm',
      imageRadius: 'none',
      typeScale: 'compact', containerWidth: 'narrow', sectionSpacing: 'compact',
      productCardStyle: 'flat', productCardRadius: 'none',
      testimonialCardStyle: 'flat', testimonialCardRadius: 'none',
      heroStyle: 'overlay', heroAlignment: 'center',
      productImageRatio: 'square', productImageHover: 'none', productGridDensity: 'cozy',
      testimonialStyle: 'minimal', faqStyle: 'list',
    },
    headerStyle: 'standard', footerStyle: 'minimal',
  },
  demoContent: {
    storeName: 'STUDIO EIGHT',
    heroHeadline: 'Less, but better.',
    heroSubheading: 'A tightly-edited collection of everyday essentials.',
    heroCta: 'Explore',
    heroImage: img(90, 1600, 900),
    products: [
      { name: 'Cashmere Crewneck', price: 180, image: img(100) },
      { name: 'Minimal Leather Sandal', price: 145, image: img(110) },
      { name: 'Linen Wide-Leg Trouser', price: 128, image: img(120) },
    ],
    testimonial: { quote: 'Understated, timeless, exactly what I was looking for.', authorName: 'Elena R.', authorRole: 'Verified Buyer', rating: 5 },
    extras: {
      lookbook: [
        { imageUrl: img(520), caption: 'Studio, Autumn 2026' },
        { imageUrl: img(521), caption: 'The Essentials Rack' },
        { imageUrl: img(522), caption: '' },
        { imageUrl: img(523), caption: '' },
        { imageUrl: img(524), caption: '' },
        { imageUrl: img(525), caption: '' },
      ],
    },
  },
  // A short manifesto (rich_text) followed by a quiet, uncaptioned-mostly
  // masonry gallery — soft_gallery used here as a secondary theme (its
  // primary owner is Soft Studio), fitting Minimal Boutique's own
  // whitespace-first restraint just as well.
  templates: {
    home: [
      {
        type: 'rich_text',
        settings: { alignment: 'center' },
        blocks: [
          { type: 'heading', settings: { text: 'Considered, Not Curated' } },
          { type: 'paragraph', settings: { text: 'STUDIO EIGHT exists to remove the noise — a small, tightly-edited wardrobe built to outlast trends.' } },
        ],
      },
      {
        type: 'soft_gallery',
        settings: { heading: 'In the Studio' },
        blocks: [
          { type: 'gallery_item', settings: { imageUrl: img(520), caption: 'Studio, Autumn 2026' } },
          { type: 'gallery_item', settings: { imageUrl: img(521), caption: 'The Essentials Rack' } },
          { type: 'gallery_item', settings: { imageUrl: img(522) } },
          { type: 'gallery_item', settings: { imageUrl: img(523) } },
          { type: 'gallery_item', settings: { imageUrl: img(524) } },
          { type: 'gallery_item', settings: { imageUrl: img(525) } },
        ],
      },
    ],
    collection: [
      {
        type: 'trust_badges',
        settings: {},
        blocks: [
          { type: 'trust_badge_item', settings: { icon: 'truck', text: 'Free shipping over $100' } },
          { type: 'trust_badge_item', settings: { icon: 'refresh', text: '14-day returns' } },
          { type: 'trust_badge_item', settings: { icon: 'lock', text: 'Secure checkout' } },
        ],
      },
    ],
    product: [
      {
        type: 'faq',
        settings: { heading: 'Fit & Returns' },
        blocks: [
          { type: 'faq_item', settings: { question: 'How does this fit?', answer: 'Our pieces run true to size with a relaxed, considered cut — see the product description for exact measurements.' } },
          { type: 'faq_item', settings: { question: 'What is your return policy?', answer: 'Unworn items may be returned within 14 days for a full refund.' } },
        ],
      },
    ],
  },
};
