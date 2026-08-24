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
  },
};
