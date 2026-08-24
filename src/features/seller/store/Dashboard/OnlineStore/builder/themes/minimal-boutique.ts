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
  },
};
