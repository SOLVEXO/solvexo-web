import { img, type ThemeModule } from './types';

export const softStudio: ThemeModule = {
  definition: {
    id: 'soft-studio',
    name: 'Soft Studio',
    description: 'Beauty & skincare — soft neutrals, spacious layout, and subtle shadow-only cards.',
    category: 'beauty',
    badge: 'trending',
    characteristics: ['Soft Neutrals', 'Spacious Layout', 'Subtle Shadows'],
    colors: {
      primaryColor: '#C98B7A', accentColor: '#E8B4A0', bgColor: '#FBF6F3', textColor: '#3A2E2A', font: 'Lora',
      buttonStyle: 'soft', buttonRadius: 'large', buttonWidth: 'auto', buttonSize: 'md',
      imageRadius: 'large',
      typeScale: 'comfortable', containerWidth: 'narrow', sectionSpacing: 'spacious',
      productCardStyle: 'elevated', productCardRadius: 'large',
      testimonialCardStyle: 'elevated', testimonialCardRadius: 'large',
      heroStyle: 'split', heroAlignment: 'center',
      productImageRatio: 'square', productImageHover: 'none', productGridDensity: 'relaxed',
      testimonialStyle: 'cards', faqStyle: 'accordion',
    },
    headerStyle: 'centered', footerStyle: 'minimal',
  },
  demoContent: {
    storeName: 'Petal & Glow',
    heroHeadline: 'Skincare, simplified.',
    heroSubheading: 'Clean formulas for your everyday ritual.',
    heroCta: 'Shop Skincare',
    heroImage: img(330, 1600, 900),
    products: [
      { name: 'Rose Quartz Face Serum', price: 58, image: img(340) },
      { name: 'Hydrating Clay Mask', price: 32, image: img(350) },
      { name: 'Vitamin C Glow Oil', price: 46, image: img(360) },
    ],
    testimonial: { quote: 'My skin has never felt this calm — and it smells incredible.', authorName: 'Hana S.', authorRole: 'Verified Buyer', rating: 5 },
    extras: {
      lookbook: [
        { imageUrl: img(580), caption: 'Morning ritual' },
        { imageUrl: img(581), caption: '' },
        { imageUrl: img(582), caption: 'Evening wind-down' },
        { imageUrl: img(583), caption: '' },
        { imageUrl: img(584), caption: '' },
        { imageUrl: img(585), caption: '' },
      ],
      story: {
        heading: 'Formulated Without Compromise',
        body: 'Every Petal & Glow formula is dermatologist-tested and free from parabens, sulfates, and synthetic fragrance.',
        imageUrl: img(586),
        ctaText: 'Our Ingredients',
      },
      faqs: [
        { question: 'Is this safe for sensitive skin?', answer: 'Yes — every formula is fragrance-free and patch-tested.' },
        { question: 'How soon will I see results?', answer: 'Most customers notice a difference within 2-3 weeks of consistent use.' },
      ],
    },
  },
  // Soft Gallery (exclusive/primary) — real routine photos — then an
  // ingredients feature and a skincare FAQ.
  templates: {
    home: [
      {
        type: 'soft_gallery',
        settings: { heading: 'Real Routines, Real Results' },
        blocks: [
          { type: 'gallery_item', settings: { imageUrl: img(580), caption: 'Morning ritual' } },
          { type: 'gallery_item', settings: { imageUrl: img(581) } },
          { type: 'gallery_item', settings: { imageUrl: img(582), caption: 'Evening wind-down' } },
          { type: 'gallery_item', settings: { imageUrl: img(583) } },
          { type: 'gallery_item', settings: { imageUrl: img(584) } },
          { type: 'gallery_item', settings: { imageUrl: img(585) } },
        ],
      },
      {
        type: 'image_with_text',
        settings: {},
        blocks: [
          { type: 'image_text_pair', settings: { imageUrl: img(586), heading: 'Formulated Without Compromise', body: 'Every Petal & Glow formula is dermatologist-tested and free from parabens, sulfates, and synthetic fragrance.', ctaText: 'Our Ingredients', imagePosition: 'right' } },
        ],
      },
      {
        type: 'faq',
        settings: { heading: 'Skincare Questions' },
        blocks: [
          { type: 'faq_item', settings: { question: 'Is this safe for sensitive skin?', answer: 'Yes — every formula is fragrance-free and patch-tested.' } },
          { type: 'faq_item', settings: { question: 'How soon will I see results?', answer: 'Most customers notice a difference within 2-3 weeks of consistent use.' } },
        ],
      },
    ],
    collection: [
      {
        type: 'trust_badges',
        settings: {},
        blocks: [
          { type: 'trust_badge_item', settings: { icon: 'shield', text: 'Dermatologist-tested' } },
          { type: 'trust_badge_item', settings: { icon: 'refresh', text: '30-day happiness guarantee' } },
          { type: 'trust_badge_item', settings: { icon: 'lock', text: 'Secure checkout' } },
        ],
      },
    ],
    product: [
      {
        type: 'faq',
        settings: { heading: 'Skincare Questions' },
        blocks: [
          { type: 'faq_item', settings: { question: 'Is this safe for sensitive skin?', answer: 'Yes — every formula is fragrance-free and patch-tested.' } },
          { type: 'faq_item', settings: { question: 'How soon will I see results?', answer: 'Most customers notice a difference within 2-3 weeks of consistent use.' } },
        ],
      },
    ],
  },
};
