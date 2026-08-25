import { img, type ThemeModule } from './types';

export const freshMarket: ThemeModule = {
  definition: {
    id: 'fresh-market',
    name: 'Fresh Market',
    description: 'Food, organic & wellness — a natural palette with a friendly, rounded feel.',
    category: 'food',
    characteristics: ['Rounded & Friendly', 'Soft CTA', 'Category Feel'],
    colors: {
      primaryColor: '#4C7A3D', accentColor: '#D98E2D', bgColor: '#FBF8F0', textColor: '#2B2A22', font: 'Nunito',
      buttonStyle: 'solid', buttonRadius: 'full', buttonWidth: 'auto', buttonSize: 'md',
      imageRadius: 'large',
      typeScale: 'comfortable', containerWidth: 'standard', sectionSpacing: 'comfortable',
      productCardStyle: 'outlined', productCardRadius: 'large',
      testimonialCardStyle: 'outlined', testimonialCardRadius: 'large',
      heroStyle: 'overlay', heroAlignment: 'left',
      productImageRatio: 'square', productImageHover: 'none', productGridDensity: 'cozy',
      testimonialStyle: 'cards', faqStyle: 'accordion',
    },
    headerStyle: 'standard', footerStyle: 'columns',
  },
  demoContent: {
    storeName: 'Bloom & Basket',
    heroHeadline: 'From farm to table.',
    heroSubheading: 'Organic, seasonal, delivered fresh.',
    heroCta: 'Shop Fresh',
    heroImage: img(250, 1600, 900),
    products: [
      { name: 'Organic Sourdough Loaf', price: 9, image: img(260) },
      { name: 'Cold-Pressed Juice Set', price: 28, image: img(270) },
      { name: 'Farm Honey Jar', price: 14, image: img(280) },
    ],
    testimonial: { quote: 'Everything tastes like it was picked this morning.', authorName: 'Noah B.', authorRole: 'Verified Buyer', rating: 5 },
    extras: {
      story: {
        heading: 'Our Farm-to-Table Journey',
        body: 'From seed to table, every step stays close to home.',
        imageUrl: img(560),
      },
      trustBadges: [
        { icon: 'truck', text: 'Same-day local delivery' },
        { icon: 'shield', text: '100% organic certified' },
        { icon: 'refresh', text: 'Freshness guaranteed' },
      ],
    },
  },
  // Farm Story (exclusive) — the icon-led "seed to table" journey strip —
  // followed by a trust-badges row. The one theme built around the
  // icon-driven journey format, distinct from Warm Craft's numeral-driven
  // Craft Process.
  templates: {
    home: [
      {
        type: 'farm_story',
        settings: {
          heading: 'Our Farm-to-Table Journey',
          subheading: 'From seed to table, every step stays close to home.',
          imageUrl: img(560),
        },
        blocks: [
          { type: 'farm_story_step', settings: { icon: 'sprout', title: 'Planted Locally', body: 'Seeds sown on partner farms within 50 miles of our kitchen.' } },
          { type: 'farm_story_step', settings: { icon: 'sun', title: 'Grown Naturally', body: 'No synthetic pesticides — just sun, soil, and patience.' } },
          { type: 'farm_story_step', settings: { icon: 'truck', title: 'Delivered Fresh', body: 'Harvested and on your doorstep within 24 hours.' } },
          { type: 'farm_story_step', settings: { icon: 'heart', title: 'Enjoyed at Home', body: 'Real food, the way nature intended it.' } },
        ],
      },
      {
        type: 'trust_badges',
        settings: {},
        blocks: [
          { type: 'trust_badge_item', settings: { icon: 'truck', text: 'Same-day local delivery' } },
          { type: 'trust_badge_item', settings: { icon: 'shield', text: '100% organic certified' } },
          { type: 'trust_badge_item', settings: { icon: 'refresh', text: 'Freshness guaranteed' } },
        ],
      },
    ],
    collection: [
      {
        type: 'trust_badges',
        settings: {},
        blocks: [
          { type: 'trust_badge_item', settings: { icon: 'truck', text: 'Same-day local delivery' } },
          { type: 'trust_badge_item', settings: { icon: 'shield', text: '100% organic certified' } },
        ],
      },
    ],
    product: [
      {
        type: 'faq',
        settings: { heading: 'Freshness & Delivery' },
        blocks: [
          { type: 'faq_item', settings: { question: 'How fresh is this when it arrives?', answer: 'Harvested or made to order and delivered within 24 hours — nothing sits in a warehouse.' } },
          { type: 'faq_item', settings: { question: 'Do you list allergens?', answer: 'Yes — every product page lists allergens and ingredients in full.' } },
        ],
      },
    ],
  },
};
