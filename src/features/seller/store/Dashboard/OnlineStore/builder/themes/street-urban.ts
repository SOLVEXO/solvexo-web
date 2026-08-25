import { img, type ThemeModule } from './types';

export const streetUrban: ThemeModule = {
  definition: {
    id: 'street-urban',
    name: 'Street / Urban',
    description: 'Sneakers & streetwear — bold contrast type and an energetic, edge-to-edge grid.',
    category: 'fashion',
    badge: 'new',
    characteristics: ['Bold Type', 'High Contrast', 'Energetic Grid'],
    colors: {
      primaryColor: '#E8382A', accentColor: '#1A1A1A', bgColor: '#F5F4F0', textColor: '#111111', font: 'Space Grotesk',
      buttonStyle: 'solid', buttonRadius: 'none', buttonWidth: 'full', buttonSize: 'lg',
      imageRadius: 'none',
      typeScale: 'spacious', containerWidth: 'wide', sectionSpacing: 'compact',
      productCardStyle: 'flat', productCardRadius: 'none',
      testimonialCardStyle: 'flat', testimonialCardRadius: 'none',
      heroStyle: 'overlay', heroAlignment: 'left',
      productImageRatio: 'square', productImageHover: 'zoom', productGridDensity: 'cozy',
      testimonialStyle: 'minimal', faqStyle: 'list',
    },
    headerStyle: 'standard', footerStyle: 'minimal',
  },
  demoContent: {
    storeName: 'CONCRETE CO.',
    heroHeadline: 'Built for the street.',
    heroSubheading: 'New drop, limited run.',
    heroCta: 'Shop the Drop',
    heroImage: img(290, 1600, 900),
    products: [
      { name: 'Retro Runner Sneakers', price: 139, image: img(300), badge: 'NEW' },
      { name: 'Oversized Graphic Hoodie', price: 78, image: img(310) },
      { name: 'Cargo Utility Pants', price: 92, image: img(320) },
    ],
    testimonial: { quote: 'Drops sell out fast — glad I caught this one.', authorName: 'Malik J.', authorRole: 'Verified Buyer', rating: 5 },
    extras: {
      dropDate: '2026-09-15T18:00:00Z',
      story: {
        heading: 'Made for the Block, Tested on It',
        body: 'Every CONCRETE CO. piece is sampled and worn by our own crew before it ever ships.',
        imageUrl: img(570),
        ctaText: 'Shop Now',
      },
    },
  },
  // Drop Countdown (exclusive) hits first — the hype band a streetwear
  // storefront actually needs — followed by a brand-story feature. No
  // FAQ/trust badges here; this theme leans entirely on urgency + brand.
  templates: {
    home: [
      {
        type: 'drop_countdown',
        settings: {
          heading: 'NEXT DROP: VOLT PACK',
          subheading: 'Limited to 200 pairs. Once they’re gone, they’re gone.',
          targetDate: '2026-09-15T18:00:00Z',
          ctaText: 'Notify Me',
          ctaLink: { linkType: 'home' },
        },
      },
      {
        type: 'image_with_text',
        settings: {},
        blocks: [
          { type: 'image_text_pair', settings: { imageUrl: img(570), heading: 'Made for the Block, Tested on It', body: 'Every CONCRETE CO. piece is sampled and worn by our own crew before it ever ships.', ctaText: 'Shop Now', imagePosition: 'left' } },
        ],
      },
    ],
    collection: [
      {
        type: 'trust_badges',
        settings: {},
        blocks: [
          { type: 'trust_badge_item', settings: { icon: 'shield', text: '100% authentic, verified' } },
          { type: 'trust_badge_item', settings: { icon: 'truck', text: 'Fast tracked shipping' } },
          { type: 'trust_badge_item', settings: { icon: 'lock', text: 'Secure checkout' } },
        ],
      },
    ],
    product: [
      {
        type: 'faq',
        settings: { heading: 'Sizing & Restocks' },
        blocks: [
          { type: 'faq_item', settings: { question: 'How does the sizing run?', answer: 'True to size for most pieces — oversized fits are noted on the product page.' } },
          { type: 'faq_item', settings: { question: 'Will this restock if it sells out?', answer: 'Limited drops rarely restock — join the waitlist to get notified if it does.' } },
        ],
      },
    ],
  },
};
