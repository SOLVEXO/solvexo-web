import { img, type ThemeModule } from './types';

export const cleanGrid: ThemeModule = {
  definition: {
    id: 'clean-grid',
    name: 'Clean Grid',
    description: 'Contemporary ecommerce — vibrant, fully rounded, with soft-tinted buttons.',
    category: 'general',
    badge: 'popular',
    characteristics: ['Structured Grid', 'Pill Buttons', 'Rounded Imagery'],
    colors: {
      primaryColor: '#FF6B35', accentColor: '#FFB627', bgColor: '#FFFDF9', textColor: '#241C15', font: 'DM Sans',
      buttonStyle: 'soft', buttonRadius: 'full', buttonWidth: 'auto', buttonSize: 'md',
      imageRadius: 'full',
      typeScale: 'comfortable', containerWidth: 'standard', sectionSpacing: 'comfortable',
      productCardStyle: 'elevated', productCardRadius: 'full',
      testimonialCardStyle: 'flat', testimonialCardRadius: 'full',
      heroStyle: 'split', heroAlignment: 'center',
      productImageRatio: 'square', productImageHover: 'zoom', productGridDensity: 'relaxed',
      testimonialStyle: 'minimal', faqStyle: 'list',
    },
    headerStyle: 'centered', footerStyle: 'minimal',
  },
  demoContent: {
    storeName: 'Norm & Co',
    heroHeadline: 'New arrivals, every week.',
    heroSubheading: 'Everyday basics, done right.',
    heroCta: 'Shop New In',
    heroImage: img(170, 1600, 900),
    products: [
      { name: 'Everyday Sneakers', price: 119, image: img(180) },
      { name: 'Classic Denim Jacket', price: 98, image: img(190) },
      { name: 'Essential Backpack', price: 76, image: img(200) },
    ],
    testimonial: { quote: 'Easy to browse, easy to buy. My go-to store now.', authorName: 'Sam T.', authorRole: 'Verified Buyer', rating: 4 },
    extras: {
      trustBadges: [
        { icon: 'truck', text: 'Free shipping over $50' },
        { icon: 'refresh', text: '60-day easy returns' },
        { icon: 'lock', text: 'Secure checkout' },
      ],
      faqs: [
        { question: 'What’s your return policy?', answer: '60 days, no questions asked.' },
        { question: 'Do you restock sold-out sizes?', answer: 'Yes — join the waitlist on any sold-out product page.' },
      ],
    },
  },
  // Soft Gallery (secondary use of Soft Studio's exclusive section — a
  // shoppable "feed" grid fits this theme's vibrant, contemporary identity)
  // followed by trust badges then FAQ — the reverse order from Soft Studio's
  // own gallery/FAQ/trust-badges sequence.
  templates: {
    home: [
      {
        type: 'soft_gallery',
        settings: { heading: 'Shop the Feed' },
        blocks: [
          { type: 'gallery_item', settings: { imageUrl: img(540), caption: '@normandco community' } },
          { type: 'gallery_item', settings: { imageUrl: img(541) } },
          { type: 'gallery_item', settings: { imageUrl: img(542), caption: 'New arrivals this week' } },
          { type: 'gallery_item', settings: { imageUrl: img(543) } },
          { type: 'gallery_item', settings: { imageUrl: img(544) } },
          { type: 'gallery_item', settings: { imageUrl: img(545) } },
        ],
      },
      {
        type: 'trust_badges',
        settings: {},
        blocks: [
          { type: 'trust_badge_item', settings: { icon: 'truck', text: 'Free shipping over $50' } },
          { type: 'trust_badge_item', settings: { icon: 'refresh', text: '60-day easy returns' } },
          { type: 'trust_badge_item', settings: { icon: 'lock', text: 'Secure checkout' } },
        ],
      },
      {
        type: 'faq',
        settings: { heading: 'Good to Know' },
        blocks: [
          { type: 'faq_item', settings: { question: 'What’s your return policy?', answer: '60 days, no questions asked.' } },
          { type: 'faq_item', settings: { question: 'Do you restock sold-out sizes?', answer: 'Yes — join the waitlist on any sold-out product page.' } },
        ],
      },
    ],
    collection: [
      {
        type: 'trust_badges',
        settings: {},
        blocks: [
          { type: 'trust_badge_item', settings: { icon: 'truck', text: 'Free shipping over $50' } },
          { type: 'trust_badge_item', settings: { icon: 'refresh', text: '60-day easy returns' } },
          { type: 'trust_badge_item', settings: { icon: 'lock', text: 'Secure checkout' } },
        ],
      },
    ],
    product: [
      {
        type: 'faq',
        settings: { heading: 'Good to Know' },
        blocks: [
          { type: 'faq_item', settings: { question: 'What’s your return policy?', answer: '60 days, no questions asked.' } },
          { type: 'faq_item', settings: { question: 'Do you restock sold-out sizes?', answer: 'Yes — join the waitlist on any sold-out product page.' } },
        ],
      },
    ],
  },
};
