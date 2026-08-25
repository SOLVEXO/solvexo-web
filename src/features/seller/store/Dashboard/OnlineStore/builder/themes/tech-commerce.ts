import { img, type ThemeModule } from './types';

export const techCommerce: ThemeModule = {
  definition: {
    id: 'tech-commerce',
    name: 'Tech Commerce',
    description: 'Electronics & gadgets — a crisp geometric grid with structured, specification-style cards.',
    category: 'electronics',
    characteristics: ['Crisp Grid', 'Structured Cards', 'Modern Sans'],
    colors: {
      primaryColor: '#2563EB', accentColor: '#0EA5E9', bgColor: '#F7F9FC', textColor: '#10151C', font: 'Roboto',
      buttonStyle: 'solid', buttonRadius: 'small', buttonWidth: 'auto', buttonSize: 'md',
      imageRadius: 'small',
      typeScale: 'compact', containerWidth: 'standard', sectionSpacing: 'compact',
      productCardStyle: 'outlined', productCardRadius: 'small',
      testimonialCardStyle: 'outlined', testimonialCardRadius: 'small',
      heroStyle: 'split', heroAlignment: 'left',
      productImageRatio: 'square', productImageHover: 'none', productGridDensity: 'cozy',
      testimonialStyle: 'cards', faqStyle: 'accordion',
    },
    headerStyle: 'standard', footerStyle: 'columns',
  },
  demoContent: {
    storeName: 'NEXUS TECH',
    heroHeadline: 'Engineered for everyday.',
    heroSubheading: 'Thoughtfully designed tech, built to last.',
    heroCta: 'Shop Tech',
    heroImage: img(370, 1600, 900),
    products: [
      { name: 'Wireless ANC Headphones', price: 199, image: img(380) },
      { name: 'Smart Fitness Tracker', price: 149, image: img(390) },
      { name: 'USB-C Fast Charger', price: 39, image: img(400) },
    ],
    testimonial: { quote: 'Battery life and build quality both exceeded expectations.', authorName: 'Derek L.', authorRole: 'Verified Buyer', rating: 4 },
    extras: {
      specs: [
        { label: 'Driver Size', value: '40mm Dynamic' },
        { label: 'Battery Life', value: 'Up to 35 hours (ANC on)' },
        { label: 'Charging', value: 'USB-C, 10 min = 5 hrs playback' },
        { label: 'Bluetooth', value: '5.3, multipoint pairing' },
        { label: 'Weight', value: '254g' },
        { label: 'Water Resistance', value: 'IPX4' },
        { label: 'Warranty', value: '2-year limited warranty' },
      ],
      faqs: [
        { question: 'What’s covered under warranty?', answer: 'Manufacturing defects for 2 years from purchase date.' },
        { question: 'Is this compatible with both iOS and Android?', answer: 'Yes — full feature parity across both platforms via our app.' },
      ],
    },
  },
  // Spec Table (exclusive) — the one theme with a real data table — then a
  // durability blurb and a pre-purchase FAQ.
  templates: {
    home: [
      {
        type: 'tech_specs_compare',
        settings: { heading: 'Nexus Pro Headphones — Full Specs' },
        blocks: [
          { type: 'spec_row', settings: { label: 'Driver Size', value: '40mm Dynamic' } },
          { type: 'spec_row', settings: { label: 'Battery Life', value: 'Up to 35 hours (ANC on)' } },
          { type: 'spec_row', settings: { label: 'Charging', value: 'USB-C, 10 min = 5 hrs playback' } },
          { type: 'spec_row', settings: { label: 'Bluetooth', value: '5.3, multipoint pairing' } },
          { type: 'spec_row', settings: { label: 'Weight', value: '254g' } },
          { type: 'spec_row', settings: { label: 'Water Resistance', value: 'IPX4' } },
          { type: 'spec_row', settings: { label: 'Warranty', value: '2-year limited warranty' } },
        ],
      },
      {
        type: 'rich_text',
        settings: { heading: 'Built to Last' },
        blocks: [
          { type: 'paragraph', settings: { text: 'Every Nexus product goes through 200+ hours of stress testing before it ships — because "durable" should mean something.' } },
        ],
      },
      {
        type: 'faq',
        settings: { heading: 'Before You Buy' },
        blocks: [
          { type: 'faq_item', settings: { question: 'What’s covered under warranty?', answer: 'Manufacturing defects for 2 years from purchase date.' } },
          { type: 'faq_item', settings: { question: 'Is this compatible with both iOS and Android?', answer: 'Yes — full feature parity across both platforms via our app.' } },
        ],
      },
    ],
    collection: [
      {
        type: 'trust_badges',
        settings: {},
        blocks: [
          { type: 'trust_badge_item', settings: { icon: 'shield', text: '2-year limited warranty' } },
          { type: 'trust_badge_item', settings: { icon: 'truck', text: 'Free shipping over $75' } },
          { type: 'trust_badge_item', settings: { icon: 'lock', text: 'Secure payment' } },
        ],
      },
    ],
    product: [
      {
        type: 'faq',
        settings: { heading: 'Before You Buy' },
        blocks: [
          { type: 'faq_item', settings: { question: 'What’s covered under warranty?', answer: 'Manufacturing defects for 2 years from purchase date.' } },
          { type: 'faq_item', settings: { question: 'Is this compatible with both iOS and Android?', answer: 'Yes — full feature parity across both platforms via our app.' } },
        ],
      },
    ],
  },
};
