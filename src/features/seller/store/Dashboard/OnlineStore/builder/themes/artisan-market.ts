import { img, type ThemeModule } from './types';

export const artisanMarket: ThemeModule = {
  definition: {
    id: 'artisan-market',
    name: 'Artisan Market',
    description: 'Craft & maker marketplace — rustic rust and forest tones, a split hero, and portrait product photography.',
    category: 'general',
    characteristics: ['Rustic Palette', 'Split Hero', 'Portrait Cards'],
    colors: {
      primaryColor: '#B5451B', accentColor: '#3D5A45', bgColor: '#FFF9F0', textColor: '#2A1F16', font: 'Lora',
      buttonStyle: 'outline', buttonRadius: 'medium', buttonWidth: 'auto', buttonSize: 'md',
      imageRadius: 'small',
      typeScale: 'spacious', containerWidth: 'standard', sectionSpacing: 'comfortable',
      productCardStyle: 'outlined', productCardRadius: 'medium',
      testimonialCardStyle: 'elevated', testimonialCardRadius: 'small',
      heroStyle: 'split', heroAlignment: 'left',
      productImageRatio: 'portrait', productImageHover: 'none', productGridDensity: 'cozy',
      testimonialStyle: 'cards', faqStyle: 'accordion',
    },
    headerStyle: 'standard', footerStyle: 'minimal',
  },
  demoContent: {
    storeName: 'The Maker’s Market',
    heroHeadline: 'Made by hand, sold with pride.',
    heroSubheading: 'A curated marketplace of independent makers.',
    heroCta: 'Meet the Makers',
    heroImage: img(450, 1600, 900),
    products: [
      { name: 'Hand-Carved Wooden Bowl', price: 42, image: img(460) },
      { name: 'Small-Batch Candle Set', price: 26, image: img(470) },
      { name: 'Woven Wall Hanging', price: 64, image: img(480) },
    ],
    testimonial: { quote: 'You can feel the craftsmanship in every purchase.', authorName: 'Owen R.', authorRole: 'Verified Buyer', rating: 5 },
    extras: {
      processSteps: [
        { title: 'Apply', body: 'Makers submit their portfolio and a sample of their work for review.' },
        { title: 'Verify', body: 'We confirm every item is genuinely handmade, not mass-produced.' },
        { title: 'Onboard', body: 'Approved makers get their own shop page within The Maker’s Market.' },
      ],
      story: {
        heading: 'Meet Owen, Our Featured Woodworker',
        body: 'Owen has been hand-carving bowls from reclaimed walnut for over a decade.',
        imageUrl: img(610),
        ctaText: 'Read His Story',
      },
    },
  },
  // Craft Process (secondary use of Warm Craft's exclusive section — here
  // framed as "how we vet every maker" rather than "how a piece is made")
  // followed by a featured-maker spotlight — a shorter, two-section
  // composition distinct from Warm Craft's own three-section one.
  templates: {
    home: [
      {
        type: 'craft_process',
        settings: { heading: 'How We Vet Every Maker' },
        blocks: [
          { type: 'craft_process_step', settings: { title: 'Apply', body: 'Makers submit their portfolio and a sample of their work for review.' } },
          { type: 'craft_process_step', settings: { title: 'Verify', body: 'We confirm every item is genuinely handmade, not mass-produced.' } },
          { type: 'craft_process_step', settings: { title: 'Onboard', body: 'Approved makers get their own shop page within The Maker’s Market.' } },
        ],
      },
      {
        type: 'image_with_text',
        settings: {},
        blocks: [
          { type: 'image_text_pair', settings: { imageUrl: img(610), heading: 'Meet Owen, Our Featured Woodworker', body: 'Owen has been hand-carving bowls from reclaimed walnut for over a decade.', ctaText: 'Read His Story', imagePosition: 'right' } },
        ],
      },
    ],
    collection: [
      {
        type: 'trust_badges',
        settings: {},
        blocks: [
          { type: 'trust_badge_item', settings: { icon: 'shield', text: 'Verified handmade' } },
          { type: 'trust_badge_item', settings: { icon: 'lock', text: 'Secure checkout' } },
          { type: 'trust_badge_item', settings: { icon: 'headset', text: 'Support independent makers' } },
        ],
      },
    ],
    product: [
      {
        type: 'faq',
        settings: { heading: 'About This Piece' },
        blocks: [
          { type: 'faq_item', settings: { question: 'Is this genuinely handmade?', answer: 'Yes — every maker in our market is verified before their shop goes live.' } },
          { type: 'faq_item', settings: { question: 'How should I care for this piece?', answer: 'Care instructions specific to the material are included with every order.' } },
        ],
      },
    ],
  },
};
