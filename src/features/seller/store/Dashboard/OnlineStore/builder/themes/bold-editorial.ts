import { img, type ThemeModule } from './types';

export const boldEditorial: ThemeModule = {
  definition: {
    id: 'bold-editorial',
    name: 'Bold Editorial',
    description: 'Magazine-inspired commerce — oversized serif headlines and a bordered product grid.',
    category: 'fashion',
    characteristics: ['Oversized Type', 'Split Hero', 'Bordered Cards'],
    colors: {
      primaryColor: '#8A6D3B', accentColor: '#5F4A28', bgColor: '#FBFAF7', textColor: '#242220', font: 'Fraunces',
      buttonStyle: 'outline', buttonRadius: 'small', buttonWidth: 'auto', buttonSize: 'lg',
      imageRadius: 'large',
      typeScale: 'spacious', containerWidth: 'wide', sectionSpacing: 'spacious',
      productCardStyle: 'outlined', productCardRadius: 'small',
      testimonialCardStyle: 'elevated', testimonialCardRadius: 'large',
      heroStyle: 'split', heroAlignment: 'left',
      productImageRatio: 'portrait', productImageHover: 'none', productGridDensity: 'relaxed',
      testimonialStyle: 'cards', faqStyle: 'accordion',
    },
    headerStyle: 'standard', footerStyle: 'columns',
  },
  demoContent: {
    storeName: 'THE FIELD JOURNAL',
    heroHeadline: 'Issue No. 12 — The Edit.',
    heroSubheading: 'Stories in fabric. A seasonal capsule, curated.',
    heroCta: 'Read the Edit',
    heroImage: img(130, 1600, 900),
    products: [
      { name: 'Editorial Trench Coat', price: 298, image: img(140) },
      { name: 'Statement Sunglasses', price: 89, image: img(150) },
      { name: 'Structured Tote', price: 210, image: img(160) },
    ],
    testimonial: { quote: 'Feels less like shopping and more like reading a magazine.', authorName: 'Jonas W.', authorRole: 'Verified Buyer', rating: 5 },
  },
};
