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
  },
};
