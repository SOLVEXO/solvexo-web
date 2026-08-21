/** Static, local demo content for the Theme Gallery — deliberately NOT
 *  fetched from any backend API (see `ThemeStorefrontPreview.tsx`: the
 *  gallery renders up to 10+ cards at once, and each would otherwise need
 *  its own real product/store query). Every theme gets its own realistic
 *  storefront personality — a store name, a hero moment, and 3 named,
 *  priced products with a real photograph — instead of generic placeholder
 *  text/rectangles.
 *
 *  Images are served from Lorem Picsum's stable id-based CDN
 *  (`picsum.photos/id/<n>/...`), a long-running, always-available stock
 *  photo service — chosen because no product-photo search/generation tool
 *  is available in this environment. Each theme gets its own reserved block
 *  of 4 ids (hero + 3 products) so nothing repeats within one card; the
 *  photos are real photography, not flat placeholders, even though their
 *  literal subject isn't guaranteed to match the product name next to it. */

export interface DemoProduct {
  name:  string;
  price: number;
  image: string;
  badge?: string;
}

export interface ThemeDemoContent {
  storeName:      string;
  heroHeadline:   string;
  heroSubheading: string;
  heroCta:        string;
  heroImage:      string;
  products:       [DemoProduct, DemoProduct, DemoProduct];
  testimonial: {
    quote:      string;
    authorName: string;
    authorRole: string;
    rating:     number;
  };
}

function img(id: number, w = 900, h = 900) {
  return `https://picsum.photos/id/${id}/${w}/${h}`;
}

/** Used for any catalog theme without its own hand-authored entry below
 *  (every theme added after the original 10, until it gets one) — a
 *  reasonable generic personality rather than an error/blank state. */
export const DEFAULT_DEMO_CONTENT: ThemeDemoContent = {
  storeName: 'Your Store',
  heroHeadline: 'Welcome to your store.',
  heroSubheading: 'This is a preview using sample content.',
  heroCta: 'Shop Now',
  heroImage: img(410, 1600, 900),
  products: [
    { name: 'Sample Product One', price: 49, image: img(420) },
    { name: 'Sample Product Two', price: 29, image: img(430) },
    { name: 'Sample Product Three', price: 69, image: img(440) },
  ],
  testimonial: { quote: 'A great shopping experience from start to finish.', authorName: 'Jordan P.', authorRole: 'Verified Buyer', rating: 5 },
};

// Keyed by the catalog theme's `slug` (see `seed-theme-catalog.ts`) — these
// 10 entries correspond to the original 10 curated themes, now re-slotted
// into their matching official 44-theme names (Vogue/Urban/etc.) rather than
// keeping their old working ids.
export const THEME_DEMO_CONTENT: Record<string, ThemeDemoContent> = {
  horizon: {
    storeName: 'Willow & Clay',
    heroHeadline: 'Handcrafted, with intention.',
    heroSubheading: 'Small-batch ceramics and leather goods, made slowly.',
    heroCta: 'Shop the Collection',
    heroImage: img(10, 1600, 900),
    products: [
      { name: 'Luna Leather Tote', price: 129, image: img(20) },
      { name: 'Hand-Thrown Ceramic Mug', price: 34, image: img(30) },
      { name: 'Woven Market Basket', price: 58, image: img(40) },
    ],
    testimonial: { quote: 'Every piece feels like it was made just for me.', authorName: 'Priya N.', authorRole: 'Verified Buyer', rating: 5 },
  },
  vogue: {
    storeName: 'NOIR MAISON',
    heroHeadline: 'The Fall/Winter Edit.',
    heroSubheading: 'Tailored silhouettes for a modern wardrobe.',
    heroCta: 'Shop Now',
    heroImage: img(50, 1600, 900),
    products: [
      { name: 'Tailored Wool Coat', price: 340, image: img(60) },
      { name: 'Silk Slip Dress', price: 210, image: img(70) },
      { name: 'Structured Leather Bag', price: 265, image: img(80) },
    ],
    testimonial: { quote: 'The quality and fit are unmatched. Worth every dollar.', authorName: 'Amara K.', authorRole: 'Verified Buyer', rating: 5 },
  },
  essential: {
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
  atelier: {
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
  nova: {
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
  royale: {
    storeName: 'AURELIA',
    heroHeadline: 'Timeless, by design.',
    heroSubheading: 'Fine jewelry crafted for a lifetime.',
    heroCta: 'Discover the Collection',
    heroImage: img(210, 1600, 900),
    products: [
      { name: '18k Gold Hoop Earrings', price: 420, image: img(220) },
      { name: 'Diamond Pendant Necklace', price: 980, image: img(230) },
      { name: 'Sterling Cuff Bracelet', price: 310, image: img(240) },
    ],
    testimonial: { quote: 'Exquisite craftsmanship — it photographs even better in person.', authorName: 'Camille D.', authorRole: 'Verified Buyer', rating: 5 },
  },
  freshly: {
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
  },
  urban: {
    storeName: 'CONCRETE CO.',
    heroHeadline: 'Built for the street.',
    heroSubheading: 'New drop, limited run.',
    heroCta: 'Shop the Drop',
    heroImage: img(290, 1600, 900),
    products: [
      { name: 'Retro Runner Sneakers', price: 139, image: img(300), badge: 'NEW' },
      { name: 'Oversized Graphic Hoodie', price: 78, image: img(310) },
      { name: 'Cargo Utility Pants', price: 92, image: img(320) },
    ],
    testimonial: { quote: 'Drops sell out fast — glad I caught this one.', authorName: 'Malik J.', authorRole: 'Verified Buyer', rating: 5 },
  },
  aura: {
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
  volt: {
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
  },
};
