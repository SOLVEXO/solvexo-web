import type { SectionType } from '@/api/services/storefrontTypes';

export type PresetCategory = 'banners' | 'products' | 'collections' | 'trust' | 'story' | 'reviews' | 'marketing';
export type PresetMock =
  | 'banner' | 'banner-left' | 'strip' | 'slides' | 'countdown' | 'products' | 'products-3' | 'spotlight' | 'tiles'
  | 'badges' | 'columns' | 'steps' | 'rows' | 'text' | 'quotes' | 'gallery' | 'newsletter' | 'marquee' | 'faq' | 'blog' | 'video';

export interface SectionPreset {
  id: string;
  type: SectionType;
  category: PresetCategory;
  name: string;
  description: string;
  mock: PresetMock;
  /** Built when picked, so dates (countdowns) start from "now". Sample text only — never images the merchant didn't choose. */
  build: () => { settings: Record<string, unknown>; blocks: { type: string; settings: Record<string, unknown> }[] };
}

export const PRESET_CATEGORIES: { id: PresetCategory; label: string }[] = [
  { id: 'banners', label: 'Banners' },
  { id: 'products', label: 'Products' },
  { id: 'collections', label: 'Collections' },
  { id: 'trust', label: 'Trust' },
  { id: 'story', label: 'Brand story' },
  { id: 'reviews', label: 'Reviews & social' },
  { id: 'marketing', label: 'Marketing' },
];

const shopLink = { linkType: 'home' };
const inDays = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();
const only = (settings: Record<string, unknown>) => () => ({ settings, blocks: [] });

/** Whole-page starting points: a list of section designs added together, in order. */
export const PAGE_LAYOUTS: { id: string; name: string; description: string; presets: string[]; /** Only offered on this theme (omitted = every theme). */ themeId?: string; /** 'product' = only on the product template; omitted = every other template. */ scope?: 'product' }[] = [
  // ── Maison (theme-03-fashion) ──
  { id: 'maison-editorial', themeId: 'theme-03-fashion', name: 'Maison · Editorial', description: 'Slideshow, trust row, new arrivals, story, reviews, sign-up',
    presets: ['hero-slides', 'trust-4', 'products-new', 'story-rows', 'reviews-3', 'newsletter-offer'] },
  { id: 'maison-catalogue', themeId: 'theme-03-fashion', name: 'Maison · Catalogue', description: 'Big banner, collections, best sellers, offer strip, gallery',
    presets: ['banner-hero', 'collections-grid', 'products-best', 'marquee-offers', 'social-gallery', 'newsletter-offer'] },
  { id: 'maison-minimal', themeId: 'theme-03-fashion', name: 'Maison · Minimal', description: 'Statement, a few best sellers, brand film, sign-up',
    presets: ['story-statement', 'products-best', 'brand-video', 'newsletter-offer'] },
  { id: 'maison-product-classic', themeId: 'theme-03-fashion', scope: 'product', name: 'Maison · Classic product page', description: 'Related products, benefits, reviews',
    presets: ['related-also-like', 'benefits-3', 'reviews-3'] },
  { id: 'maison-product-lookbook', themeId: 'theme-03-fashion', scope: 'product', name: 'Maison · Complete the look', description: 'Complete the look, trust row, FAQ',
    presets: ['related-complete-look', 'trust-4', 'faq-basics'] },
  { id: 'maison-product-minimal', themeId: 'theme-03-fashion', scope: 'product', name: 'Maison · Minimal product page', description: 'Just a related-products row',
    presets: ['related-also-like'] },
  { id: 'fashion', name: 'Fashion & lifestyle', description: 'Big banner, new arrivals, collections, story, reviews, sign-up',
    presets: ['banner-hero', 'trust-4', 'products-new', 'collections-grid', 'story-rows', 'reviews-3', 'social-gallery', 'newsletter-offer'] },
  { id: 'electronics', name: 'Electronics & gadgets', description: 'Slideshow, categories, best sellers, sale timer, FAQ',
    presets: ['hero-slides', 'categories-grid', 'products-best', 'countdown-sale', 'products-trending', 'benefits-3', 'faq-basics', 'newsletter-offer'] },
  { id: 'grocery', name: 'Grocery & daily needs', description: 'Offer strip, categories, deals, how it works, FAQ',
    presets: ['marquee-offers', 'banner-promo', 'categories-grid', 'products-sale', 'products-new', 'how-it-works', 'faq-basics'] },
  { id: 'beauty', name: 'Beauty & skincare', description: 'Editorial banner, spotlight, benefits, reviews, blog',
    presets: ['banner-left', 'product-spotlight', 'products-best', 'benefits-3', 'reviews-3', 'blog-latest', 'newsletter-offer'] },
  { id: 'minimal', name: 'Minimal brand', description: 'Statement, a few products, story and sign-up',
    presets: ['banner-hero', 'story-statement', 'products-best', 'brand-video', 'newsletter-offer'] },
];

export const SECTION_PRESETS: SectionPreset[] = [
  // ── Banners ──
  { id: 'banner-hero', type: 'image_banner', category: 'banners', name: 'Big hero banner', description: 'Full-height image with a centred headline and button', mock: 'banner',
    build: only({ imageUrl: '', heading: 'New season, new arrivals', subheading: 'Fresh styles picked for you — shop the latest collection.', ctaText: 'Shop now', ctaLink: shopLink, heightPreset: 'large', contentAlign: 'center', contentPosition: 'middle', overlayOpacity: 35 }) },
  { id: 'banner-left', type: 'image_banner', category: 'banners', name: 'Banner, text on the left', description: 'Editorial look with the words on one side', mock: 'banner-left',
    build: only({ imageUrl: '', heading: 'Made to last', subheading: 'Quality pieces you will reach for every day.', ctaText: 'Explore', ctaLink: shopLink, heightPreset: 'medium', contentAlign: 'left', contentPosition: 'middle', overlayOpacity: 25 }) },
  { id: 'banner-promo', type: 'image_banner', category: 'banners', name: 'Slim promo banner', description: 'A short strip for an offer', mock: 'strip',
    build: only({ imageUrl: '', heading: 'Free delivery on orders over Rs. 3,000', subheading: '', ctaText: 'Start shopping', ctaLink: shopLink, heightPreset: 'small', contentAlign: 'center', contentPosition: 'middle', overlayOpacity: 30 }) },
  { id: 'hero-slides', type: 'hero', category: 'banners', name: 'Slideshow', description: 'Several images that rotate, with arrows', mock: 'slides',
    build: only({ heightPreset: 'large', autoplay: true, autoplaySeconds: 6, showArrows: true, showPauseButton: false, pagination: 'dots', transition: 'fade' }) },
  { id: 'countdown-sale', type: 'drop_countdown', category: 'banners', name: 'Sale countdown', description: 'Live timer to the end of your sale', mock: 'countdown',
    build: () => ({ settings: { heading: 'Mega sale ends soon', subheading: 'Up to 50% off — while stocks last', targetDate: inDays(7), ctaText: 'Shop the sale', ctaLink: shopLink, endedText: 'The sale has ended' }, blocks: [] }) },

  // ── Products ──
  { id: 'products-new', type: 'featured_products', category: 'products', name: 'New arrivals', description: 'Your latest products in a 4-column grid', mock: 'products',
    build: only({ heading: 'New arrivals', source: 'newArrivals', limit: 8, columns: 4 }) },
  { id: 'products-best', type: 'featured_products', category: 'products', name: 'Best sellers', description: 'Your top sellers, 3 large cards per row', mock: 'products-3',
    build: only({ heading: 'Best sellers', source: 'bestsellers', limit: 6, columns: 3 }) },
  { id: 'related-also-like', type: 'related_products', category: 'products', name: 'You may also like', description: 'Other products from the same category (product page only)', mock: 'products',
    build: only({ heading: 'You may also like', source: 'related', limit: 4, columns: 4 }) },
  { id: 'related-complete-look', type: 'related_products', category: 'products', name: 'Complete the look', description: 'Products you pick to go with each product (product page only)', mock: 'products-3',
    build: only({ heading: 'Complete the look', source: 'complementary', limit: 3, columns: 3 }) },
  { id: 'products-sale', type: 'featured_products', category: 'products', name: 'On sale', description: 'Products with a discount price', mock: 'products',
    build: only({ heading: 'On sale now', source: 'onSale', limit: 8, columns: 4 }) },
  { id: 'products-trending', type: 'featured_products', category: 'products', name: 'Trending now', description: 'What shoppers are looking at most', mock: 'products',
    build: only({ heading: 'Trending now', source: 'trending', limit: 4, columns: 4 }) },
  { id: 'product-spotlight', type: 'featured_product', category: 'products', name: 'Product spotlight', description: 'One product shown big with its price', mock: 'spotlight',
    build: only({ heading: 'Customer favourite', productIds: [] }) },

  // ── Collections ──
  { id: 'collections-grid', type: 'collection_list', category: 'collections', name: 'Shop by collection', description: 'Image tiles for your collections', mock: 'tiles',
    build: only({ heading: 'Shop by collection', columns: 3, limit: 6, imageRatio: 'portrait', showDescription: false }) },
  { id: 'categories-grid', type: 'featured_category_grid', category: 'collections', name: 'Shop by category', description: 'Square tiles for your categories', mock: 'tiles',
    build: only({ heading: 'Shop by category', categoryIds: [], columns: 4, imageRatio: 'square' }) },

  // ── Trust ──
  { id: 'trust-4', type: 'trust_badges', category: 'trust', name: 'Why buy from us', description: 'Delivery, returns, secure payment, support', mock: 'badges',
    build: () => ({ settings: {}, blocks: [
      { type: 'trust_badge_item', settings: { icon: 'truck', text: 'Fast delivery nationwide' } },
      { type: 'trust_badge_item', settings: { icon: 'refresh', text: 'Easy 7-day returns' } },
      { type: 'trust_badge_item', settings: { icon: 'lock', text: 'Secure checkout' } },
      { type: 'trust_badge_item', settings: { icon: 'headset', text: 'Help 7 days a week' } },
    ] }) },
  { id: 'benefits-3', type: 'multicolumn', category: 'trust', name: 'Three benefits', description: 'Three short reasons to choose you', mock: 'columns',
    build: () => ({ settings: { heading: 'Why customers love us', columns: 3, textAlign: 'center' }, blocks: [
      { type: 'multicolumn_column', settings: { heading: 'Original products', body: 'Every item is checked before it ships.' } },
      { type: 'multicolumn_column', settings: { heading: 'Cash on delivery', body: 'Pay when your order reaches your door.' } },
      { type: 'multicolumn_column', settings: { heading: 'Real support', body: 'Questions? We reply within a few hours.' } },
    ] }) },

  // ── Brand story ──
  { id: 'story-statement', type: 'rich_text', category: 'story', name: 'Brand statement', description: 'A centred heading and a few lines about you', mock: 'text',
    build: () => ({ settings: { heading: 'Our story', alignment: 'center' }, blocks: [
      { type: 'paragraph', settings: { text: 'We started with a simple idea: well-made things at fair prices. Every product is chosen with care, and every order is packed by our own team.' } },
    ] }) },
  { id: 'story-rows', type: 'multirow', category: 'story', name: 'Story in rows', description: 'Image and text rows that alternate sides', mock: 'rows',
    build: () => ({ settings: { heading: '', imageRatio: 'default', alternate: true }, blocks: [
      { type: 'multirow_row', settings: { heading: 'Designed with care', body: 'Each piece starts as a sketch and is tested until it feels right.' } },
      { type: 'multirow_row', settings: { heading: 'Made by real people', body: 'We work with small workshops we know by name.' } },
    ] }) },
  { id: 'how-it-works', type: 'multicolumn', category: 'story', name: 'How it works', description: 'Three numbered steps', mock: 'steps',
    build: () => ({ settings: { heading: 'How it works', columns: 3, textAlign: 'center' }, blocks: [
      { type: 'multicolumn_column', settings: { heading: '1. Choose', body: 'Browse and add what you love to your cart.' } },
      { type: 'multicolumn_column', settings: { heading: '2. Order', body: 'Pay online or choose cash on delivery.' } },
      { type: 'multicolumn_column', settings: { heading: '3. Enjoy', body: 'We deliver to your door in a few days.' } },
    ] }) },
  { id: 'brand-video', type: 'video', category: 'story', name: 'Brand video', description: 'A YouTube, Vimeo or uploaded video', mock: 'video',
    build: only({ heading: 'See how it’s made', videoUrl: '', videoFileUrl: '', aspectRatio: '16:9' }) },

  // ── Reviews & social ──
  { id: 'reviews-3', type: 'testimonials', category: 'reviews', name: 'Customer reviews', description: 'Three star-rated quotes', mock: 'quotes',
    build: () => ({ settings: { heading: 'What our customers say' }, blocks: [
      { type: 'testimonial', settings: { quote: 'Beautiful quality and it arrived in two days. Will order again!', authorName: 'Ayesha K.', authorRole: 'Lahore', rating: 5 } },
      { type: 'testimonial', settings: { quote: 'Exactly like the pictures. Packaging was lovely too.', authorName: 'Hamza R.', authorRole: 'Karachi', rating: 5 } },
      { type: 'testimonial', settings: { quote: 'Great service — they helped me pick the right size.', authorName: 'Sara M.', authorRole: 'Islamabad', rating: 5 } },
    ] }) },
  { id: 'social-gallery', type: 'gallery_grid', category: 'reviews', name: 'Instagram gallery', description: 'A photo grid of your social posts', mock: 'gallery',
    build: only({ heading: 'Follow us on Instagram', columns: 4, imageRatio: 'square' }) },
  { id: 'blog-latest', type: 'blog_posts', category: 'reviews', name: 'From the blog', description: 'Your three latest articles', mock: 'blog',
    build: only({ heading: 'From the blog', limit: 3, imageRatio: 'landscape', viewAllLabel: 'Read all' }) },

  // ── Marketing ──
  { id: 'newsletter-offer', type: 'newsletter', category: 'marketing', name: 'Sign-up with offer', description: 'Collect emails with a first-order discount', mock: 'newsletter',
    build: only({ heading: 'Get 10% off your first order', subtext: 'Join our list for new arrivals and members-only offers.', placeholder: 'Your email address', buttonLabel: 'Get my code', successMessage: 'Check your inbox — your code is on its way.' }) },
  { id: 'marquee-offers', type: 'marquee', category: 'marketing', name: 'Scrolling offers', description: 'A moving strip of short messages', mock: 'marquee',
    build: () => ({ settings: { speed: 'medium', direction: 'left', pauseOnHover: true }, blocks: [
      { type: 'marquee_item', settings: { text: 'Free delivery over Rs. 3,000' } },
      { type: 'marquee_item', settings: { text: 'Cash on delivery available' } },
      { type: 'marquee_item', settings: { text: 'Easy 7-day returns' } },
    ] }) },
  { id: 'faq-basics', type: 'faq', category: 'marketing', name: 'FAQ', description: 'Answers to the questions shoppers ask most', mock: 'faq',
    build: () => ({ settings: { heading: 'Frequently asked questions', source: 'blocks' }, blocks: [
      { type: 'faq_item', settings: { question: 'How long does delivery take?', answer: 'Most orders arrive in 2–5 working days.' } },
      { type: 'faq_item', settings: { question: 'Can I pay cash on delivery?', answer: 'Yes, cash on delivery is available across the country.' } },
      { type: 'faq_item', settings: { question: 'What is your return policy?', answer: 'You can return unused items within 7 days of delivery.' } },
    ] }) },
];
