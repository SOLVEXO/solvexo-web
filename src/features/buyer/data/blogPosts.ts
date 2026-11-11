// Solvexo's own blog (www.solvexo.store/blog). Articles live here as data, like platformProducts.ts, so they are
// part of the pre-built pages, the sitemap and the structured data without any API. Rules for new articles:
// mention only features Solvexo really has (see platformProducts.ts), no invented statistics, no promises about
// third-party services Solvexo does not integrate with.
import type { StockPhotoKey } from '../../../assets/stockPhotos';

export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'tip'; text: string };

export interface BlogPost {
  slug: string;
  title: string;
  /** Search result description: 120–160 characters. */
  description: string;
  /** ISO date. */
  published: string;
  updated?: string;
  category: 'Getting started' | 'Selling online' | 'In-store selling' | 'Orders & delivery';
  readMinutes: number;
  image: StockPhotoKey;
  /** Product pages to suggest at the end (platformProducts slugs). */
  related: string[];
  body: BlogBlock[];
}

export const BLOG_AUTHOR = 'Solvexo Team';

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'how-to-start-an-online-store-in-pakistan',
    title: 'How to Start an Online Store in Pakistan: A Step-by-Step Guide',
    description: 'A practical, step-by-step guide to starting your own online store in Pakistan: products, pricing, delivery, cash on delivery and getting your first orders.',
    published: '2026-11-09',
    category: 'Getting started',
    readMinutes: 7,
    image: 'workspaceLaptop',
    related: ['store-builder', 'checkout', 'shipping'],
    body: [
      { type: 'p', text: 'More and more Pakistani shoppers buy online, and you no longer need a developer or a big budget to sell to them. Whether you make clothes at home, run a shop in a market or want to turn a hobby into income, your own online store gives you a place on the internet that belongs to you. This guide walks through the steps, from deciding what to sell to taking your first orders.' },
      { type: 'h2', text: '1. Decide what you will sell and who will buy it' },
      { type: 'p', text: 'Start narrow. A store that sells "unstitched lawn suits for working women" is easier to grow than one that sells "everything". A clear focus makes your product photos, prices and social media posts easier, and it helps customers remember you.' },
      { type: 'ul', items: [
        'List 10 to 30 products you can reliably keep in stock.',
        'Know your cost for each one: the product, packaging and delivery.',
        'Look at what similar sellers charge, then decide where you sit: cheaper, better quality, or faster delivery.',
      ] },
      { type: 'h2', text: '2. Choose your store name and web address' },
      { type: 'p', text: 'Pick a name that is short, easy to spell and easy to say on a phone call. Check that it is free on Instagram and Facebook too, so customers find the same name everywhere. On Solvexo every store gets its own address on solvexo.store straight away, and on plans that include it you can connect a domain you already own, for example yourbrand.pk.' },
      { type: 'h2', text: '3. Build the store' },
      { type: 'p', text: 'With a store builder you choose a theme, add your logo and colours, and arrange the sections of your home page: a banner, featured products, reviews and FAQs. You do not need to write code. Check the store on your phone, because most of your customers will see it there first.' },
      { type: 'tip', text: 'Use your best three products in the banner and featured section. Visitors decide in seconds whether to keep scrolling.' },
      { type: 'h2', text: '4. Add products the right way' },
      { type: 'p', text: 'Good product pages sell. For each product add clear photos taken in daylight, the price, the sizes or colours you have (as variants, so stock is tracked for each one), and a description that answers the questions customers usually ask on WhatsApp: fabric, size chart, care instructions and delivery time.' },
      { type: 'h2', text: '5. Set up delivery and cash on delivery' },
      { type: 'p', text: 'Delivery is where many new stores lose money, so set it up before you launch. Decide which cities or regions you deliver to and what each one costs. In Solvexo you create shipping zones and list the courier services you use, and checkout works out the shipping cost for each order automatically.' },
      { type: 'p', text: 'Most shoppers in Pakistan still prefer to pay cash on delivery, so offer it from day one. Solvexo checkout supports cash on delivery as well as card payments.' },
      { type: 'h2', text: '6. Prepare your store pages and policies' },
      { type: 'ul', items: [
        'An About page with your story and a photo of you or your shop builds trust.',
        'A clear return and exchange policy reduces doubts before the first order.',
        'Your WhatsApp number and email address, shown where customers can find them.',
      ] },
      { type: 'h2', text: '7. Get your first orders' },
      { type: 'p', text: 'Share your store link everywhere you already have customers: your Instagram bio, Facebook page, WhatsApp status and business card. Offer a small launch discount code to your existing followers. A coupon code or an automatic discount on a category is a simple way to give people a reason to order this week instead of "later".' },
      { type: 'h2', text: '8. Keep improving' },
      { type: 'p', text: 'After the first few weeks, look at which products sell, where your visitors come from and how many of them order. Add more of what works and fix what does not. Small steps every week add up to a store that grows.' },
      { type: 'p', text: 'Ready to start? You can create your Solvexo store and add your first products in an afternoon.' },
    ],
  },
  {
    slug: 'instagram-whatsapp-vs-your-own-online-store',
    title: 'Selling on Instagram and WhatsApp? Why Your Own Online Store Still Matters',
    description: 'Instagram and WhatsApp are great for finding customers, but an online store of your own saves time, builds trust and keeps your business in your hands.',
    published: '2026-11-09',
    category: 'Selling online',
    readMinutes: 6,
    image: 'cosmetics',
    related: ['store-builder', 'orders-customers', 'domains'],
    body: [
      { type: 'p', text: 'Many small businesses in Pakistan start on Instagram, Facebook and WhatsApp. It makes sense: your customers are already there, and posting is free. But as orders grow, selling only through messages starts to cost you time and sales. Here is why a store of your own works alongside social media, not instead of it.' },
      { type: 'h2', text: 'The hidden cost of "DM for price"' },
      { type: 'p', text: 'Every customer who has to message you for the price, sizes or delivery charges is a customer who might not wait for your reply. When you are busy, replies take hours, and many people simply buy from someone else. A store shows prices, stock and delivery costs at any time of day, so customers can order while they are interested.' },
      { type: 'h2', text: 'Orders in one place, not in a hundred chats' },
      { type: 'p', text: 'When orders arrive as messages, addresses get lost, quantities get mixed up and it is hard to see who has paid. In an online store every order is saved with the customer\'s details, items and address, and you can track it from new to delivered. You also build a customer list you can return to with new arrivals.' },
      { type: 'h2', text: 'Trust that converts' },
      { type: 'p', text: 'A proper store with clear policies, an About page and a checkout that works feels more trustworthy than a chat. That matters most for new customers who have never bought from you. With your own domain name, your business looks established from the very first visit.' },
      { type: 'h2', text: 'Your business, your rules' },
      { type: 'p', text: 'Social platforms change their rules and reach whenever they like, and accounts can be restricted. Your store and your customer list belong to you. Keep using Instagram and WhatsApp to find and talk to customers, and send them to your store to buy.' },
      { type: 'h2', text: 'How to combine them' },
      { type: 'ol', items: [
        'Put your store link in your Instagram and Facebook bio.',
        'In each post or story, link to the exact product page, not just your home page.',
        'Answer questions on WhatsApp, then send the product link so the customer orders in the store.',
        'Use a discount code for your followers to see which posts bring orders.',
      ] },
      { type: 'tip', text: 'Keep a few WhatsApp quick replies with links to your most popular products. It turns questions into orders in one tap.' },
      { type: 'p', text: 'With Solvexo you can have a store with your own branding, product pages, cash on delivery and order tracking, and keep selling on social media as you do today.' },
    ],
  },
  {
    slug: 'pos-for-clothing-shops',
    title: 'POS for Clothing Shops: Sell In-Store and Online From One Stock List',
    description: 'How clothing and fashion shops can use one point of sale and one stock list for the shop counter and the online store, so sizes never oversell.',
    published: '2026-11-09',
    category: 'In-store selling',
    readMinutes: 6,
    image: 'fashionRack',
    related: ['pos', 'inventory', 'store-builder'],
    body: [
      { type: 'p', text: 'If you run a clothing shop and also sell online, you know the problem: a customer orders a medium online, but the last medium was sold at the counter this morning. Now you have to call, apologise and refund. The fix is simple in principle: the shop and the website should use the same stock list.' },
      { type: 'h2', text: 'Why clothing is harder than other products' },
      { type: 'p', text: 'One design can come in five sizes and three colours, which means fifteen separate items to track. A paper register or a spreadsheet updated at night cannot keep up when you sell in two places at once. Stock has to be tracked for each size and colour, and it has to update the moment something sells.' },
      { type: 'h2', text: 'What a good POS should do for a clothing shop' },
      { type: 'ul', items: [
        'Find a product quickly by name and pick the exact size and colour.',
        'Reduce stock for that variant immediately, for both the shop and the online store.',
        'Let each staff member log in with their own PIN, so you know who sold what.',
        'Print or share a receipt for the customer.',
        'Keep the sale in the same order history as your online orders.',
      ] },
      { type: 'p', text: 'Solvexo POS works this way: it shares the exact same inventory and order records as your Solvexo online store, tracks stock per variant, and uses PIN-based staff logins with register sessions. You can also use it on its own if you only sell in person today.' },
      { type: 'h2', text: 'Setting it up' },
      { type: 'ol', items: [
        'Add each design once, with sizes and colours as variants.',
        'Count your current stock and enter it for every variant.',
        'Create PINs for your staff.',
        'Start selling at the counter. Every sale updates the online store\'s stock too.',
      ] },
      { type: 'tip', text: 'Do a quick stock count of your fastest-selling sizes once a week. It catches mistakes early and keeps online customers from ordering what you no longer have.' },
      { type: 'h2', text: 'One business, not two' },
      { type: 'p', text: 'When the counter and the website share stock, orders and customer history, you stop running two businesses side by side. You can see what really sells, reorder the right sizes, and offer online customers the same range your walk-in customers see.' },
    ],
  },
  {
    slug: 'cash-on-delivery-online-store-guide',
    title: 'Cash on Delivery for Online Stores: How to Reduce Returns and Fake Orders',
    description: 'Cash on delivery helps you sell more in Pakistan, but returned parcels cost money. Practical steps to keep COD orders real and reduce returns.',
    published: '2026-11-09',
    category: 'Orders & delivery',
    readMinutes: 6,
    image: 'businessHandshake',
    related: ['checkout', 'shipping', 'orders-customers'],
    body: [
      { type: 'p', text: 'Cash on delivery (COD) is how many Pakistani shoppers prefer to pay for online orders. Offering it usually means more orders, especially from first-time customers. The downside is that some parcels come back: the customer changed their mind, was not home, or never meant to buy. Each returned parcel costs you delivery both ways. Here is how to keep COD working for you.' },
      { type: 'h2', text: 'Make the product page answer every question' },
      { type: 'p', text: 'Many returns happen because the item was not what the customer expected. Show real photos, the exact size chart, fabric details and the total price including delivery. The fewer surprises at the door, the fewer refusals.' },
      { type: 'h2', text: 'Confirm orders before you ship' },
      { type: 'p', text: 'A short call or WhatsApp message before dispatching a COD order catches wrong addresses and changed minds before you pay for delivery. Confirm the items, the total amount and when the customer will be available.' },
      { type: 'h2', text: 'Set clear delivery charges and areas' },
      { type: 'p', text: 'Charge delivery fairly for each area, and show it at checkout, not after. In Solvexo you set up shipping zones with their own rates and list the couriers you use, and checkout shows the right shipping cost automatically.' },
      { type: 'h2', text: 'Encourage advance payment, gently' },
      { type: 'ul', items: [
        'Offer a small discount for paying online in advance.',
        'For expensive or custom-made items, ask for an advance before you start.',
        'Keep COD available for regular customers who have paid before.',
      ] },
      { type: 'h2', text: 'Keep a record of every order' },
      { type: 'p', text: 'Track which orders were delivered, refused or returned, and why. Over time you will see patterns: certain areas, products or order sizes. Solvexo keeps every order with its status and customer history, so you can see repeat customers and spot problems early.' },
      { type: 'tip', text: 'Pack carefully and ship quickly. An order that arrives within a day or two is far less likely to be refused than one that takes a week.' },
      { type: 'p', text: 'COD is part of selling in Pakistan. With clear product pages, confirmed orders and fair delivery charges, it can bring you more customers without eating into your profit.' },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find(p => p.slug === slug);
}

/** Newest first. */
export const SORTED_BLOG_POSTS = [...BLOG_POSTS].sort((a, b) => b.published.localeCompare(a.published));
