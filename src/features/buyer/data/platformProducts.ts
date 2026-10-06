// Real-feature copy only — every entry describes a capability that actually
// exists in the Solvexo seller workspace today (see CLAUDE.md's backend/
// frontend module list). No invented features, no placeholder claims.
export interface PlatformProductFaq { q: string; a: string; }

export interface PlatformProduct {
  slug: string;
  name: string;
  tagline: string;
  heroHeadline: string;
  heroSubtext: string;
  benefits: { title: string; desc: string }[];
  features: string[];
  useCases: string[];
  faq: PlatformProductFaq[];
}

export const PLATFORM_PRODUCTS: PlatformProduct[] = [
  {
    slug: 'store-builder',
    name: 'Store Builder',
    tagline: 'Your store, your brand, your way',
    heroHeadline: 'Build a store that feels like your brand.',
    heroSubtext: 'A real drag-and-drop storefront editor — pages, sections, theme, header and footer — with a live preview that updates as you edit, not a template you\'re stuck with.',
    benefits: [
      { title: 'Curated theme library', desc: 'Start from one of several complete, professionally designed themes — colors, typography, button style, card style and layout — then customize any of it.' },
      { title: 'Section-by-section editing', desc: 'Add, remove and reorder hero banners, featured products, testimonials, FAQs and more, with real content — not fixed template blocks.' },
      { title: 'Live preview as you build', desc: 'Every change to theme, header, footer or page content reflects instantly in a real preview before you publish.' },
      { title: 'Responsive by default', desc: 'Every theme and section renders correctly from a small phone screen to a large desktop, with no separate mobile setup required.' },
    ],
    features: ['Drag-and-drop page sections', '10 curated starting themes', 'Custom header & footer navigation', 'Live desktop/mobile preview', 'Your own store subdomain', 'Blog pages for your store'],
    useCases: ['Launching a new storefront from scratch in minutes', 'Refreshing an existing store\'s look without touching code', 'Running a themed seasonal storefront redesign'],
    faq: [
      { q: 'Do I need any coding knowledge?', a: 'No. Every part of the storefront — theme, pages, header, footer — is edited through visual controls and a live preview.' },
      { q: 'Can I change themes after launching?', a: 'Yes. Applying a different theme updates your colors, typography and layout tokens; your actual page content and products are untouched.' },
    ],
  },
  {
    slug: 'pos',
    name: 'Point of Sale',
    tagline: 'Sell in person, synced with your store',
    heroHeadline: 'Sell in-store. Sell online. One connected system.',
    heroSubtext: 'A real point-of-sale terminal for in-person sales — PIN-based employee login, live cart, receipts — that shares the exact same inventory and order records as your online store.',
    benefits: [
      { title: 'One inventory, everywhere', desc: 'A sale rung up at the counter updates the same stock numbers your online storefront reads — no separate system to reconcile.' },
      { title: 'Fast employee sign-in', desc: 'Staff sign in to the register with a PIN, not a full account login, so shift changes at the counter stay quick.' },
      { title: 'Works as its own product', desc: 'A seller can run POS on its own without a public storefront, or pair it with a store — both are fully supported.' },
      { title: 'Register sessions & audit history', desc: 'Each till session is tracked from open to close, with an audit log of the sales and actions recorded during it.' },
    ],
    features: ['PIN employee login', 'Real-time inventory sync', 'Register session tracking', 'Order history shared with the online store', 'Works standalone or with a storefront'],
    useCases: ['A retail counter selling the same catalog as the online store', 'A market-stall or pop-up seller with no storefront at all', 'A multi-staff shop needing per-employee sales tracking'],
    faq: [
      { q: 'Do I need an online store to use POS?', a: 'No — POS can run entirely on its own for a seller who only sells in person.' },
      { q: 'Does a POS sale affect my online stock count?', a: 'Yes, immediately — both systems read from the same underlying inventory.' },
    ],
  },
  {
    slug: 'ai-commerce',
    name: 'AI Commerce',
    tagline: 'AI tools built into your workflow',
    heroHeadline: 'AI that helps you sell smarter.',
    heroSubtext: 'AI Studio gives sellers real, usable AI tools inside the dashboard — not a marketing gimmick — for the writing and analysis work that normally eats the most time.',
    benefits: [
      { title: 'Product copy, generated for you', desc: 'Turn a rough product idea or photo set into a real listing description, instead of writing every one by hand.' },
      { title: 'Backed by real AI credits', desc: 'Usage is metered through an AI credits wallet tied to your plan, so cost stays predictable rather than open-ended.' },
      { title: 'A genuine product capability', desc: 'AI Studio is a real workspace section built on Anthropic\'s Claude models — not a decorative "AI-powered" label with nothing behind it.' },
    ],
    features: ['AI-assisted product descriptions', 'AI credits wallet metering', 'Available directly inside the seller dashboard', 'Gated by your platform plan'],
    useCases: ['Writing first-draft listings for a large catalog quickly', 'Refreshing weak or thin product descriptions', 'Getting a second opinion on a listing before publishing'],
    faq: [
      { q: 'Does AI guarantee more sales?', a: 'No — AI Studio speeds up the writing and analysis work of running a store. It\'s a productivity tool, not a sales guarantee.' },
      { q: 'How is usage billed?', a: 'Through an AI credits wallet included with your plan, with add-on credits available if you need more.' },
    ],
  },
  {
    slug: 'analytics',
    name: 'Analytics',
    tagline: 'Real numbers, not vanity metrics',
    heroHeadline: 'Understand your business in real time.',
    heroSubtext: 'Revenue, orders and customer activity, computed from your real store data — viewable per store or rolled up across every store you own.',
    benefits: [
      { title: 'Per-store or cross-store view', desc: 'Look at one store\'s numbers on its own dashboard, or roll every store you own into one combined view.' },
      { title: 'Exportable reports', desc: 'Pull a PDF or CSV export of your store\'s analytics for a given period whenever you need it outside the dashboard.' },
      { title: 'Real orders, not samples', desc: 'Every figure is computed directly from your actual order and payment records — nothing is simulated or estimated.' },
    ],
    features: ['Revenue, orders & customer trends', 'Per-store and cross-store views', 'PDF & CSV export', 'Date-range filtering & comparison'],
    useCases: ['Tracking month-over-month growth for one store', 'Comparing performance across several stores you own', 'Pulling a report for an accountant or investor'],
    faq: [
      { q: 'Can I see all my stores in one report?', a: 'Yes — the cross-store view rolls every store you own into a single set of numbers.' },
      { q: 'Can I export the data?', a: 'Yes, as PDF or CSV, for a single store\'s period-based report.' },
    ],
  },
  {
    slug: 'inventory',
    name: 'Inventory',
    tagline: 'Stock that stays accurate',
    heroHeadline: 'Know exactly what you have, everywhere you sell.',
    heroSubtext: 'Stock levels tracked per product variant, kept in sync across your storefront and POS, so you never oversell what you don\'t have.',
    benefits: [
      { title: 'Per-variant tracking', desc: 'Stock is tracked at the exact variant level — size, color, edition — not just at the product level.' },
      { title: 'One source of truth', desc: 'Online orders and POS sales both draw from, and update, the same inventory record.' },
      { title: 'Built for physical and digital', desc: 'Works for physical stock counts as well as digital products that don\'t need quantity tracking at all.' },
    ],
    features: ['Per-variant stock tracking', 'Shared across storefront & POS', 'Physical and digital product support'],
    useCases: ['A store with sized/colored variants that need separate stock counts', 'A seller running both an online store and an in-person counter'],
    faq: [
      { q: 'Does inventory apply to digital products?', a: 'Digital products can skip quantity tracking entirely since there\'s nothing physical to run out of.' },
    ],
  },
  {
    slug: 'orders-customers',
    name: 'Orders & Customers',
    tagline: 'Every order and every customer, organized',
    heroHeadline: 'Manage every order, from placed to delivered.',
    heroSubtext: 'A real order-management workspace — status tracking, returns, and a customer list — for both your online store and in-person POS sales.',
    benefits: [
      { title: 'One order list, both channels', desc: 'Online orders and POS sales show up in the same order workspace, not two separate systems.' },
      { title: 'Returns handled properly', desc: 'A real returns workflow exists for processing and tracking return requests, not just a manual note.' },
      { title: 'A real customer list', desc: 'See who\'s actually bought from your store, not just a raw export of email addresses.' },
    ],
    features: ['Combined online + POS order list', 'Order status tracking', 'Returns management', 'Customer list per store'],
    useCases: ['Tracking fulfillment status across every channel you sell on', 'Handling a return or refund request end-to-end', 'Looking up a specific customer\'s order history'],
    faq: [
      { q: 'Do POS sales show up in the same order list as online orders?', a: 'Yes — both channels share one order workspace.' },
    ],
  },
  {
    slug: 'loyalty',
    name: 'Loyalty & Rewards',
    tagline: 'Turn one-time buyers into repeat customers',
    heroHeadline: 'Reward loyalty. Bring buyers back.',
    heroSubtext: 'A real points-and-rewards program — buyers earn points on purchases and redeem them for a real voucher code that works right in your checkout\'s coupon field.',
    benefits: [
      { title: 'Points & tiers, not just a discount code', desc: 'Buyers earn points as they spend and redeem them against a rewards catalog you define — a real program, not a one-off promo.' },
      { title: 'Real, single-use voucher codes', desc: 'Redeeming a reward issues an actual voucher code, usable once, that a buyer applies at checkout the same way they\'d use any coupon.' },
      { title: 'Runs per store', desc: 'Each store sets its own point values and rewards catalog — there\'s no shared program across sellers.' },
    ],
    features: ['Points earned per purchase', 'Seller-defined rewards catalog', 'Single-use voucher codes at redemption', 'Redeemed through the existing checkout coupon field'],
    useCases: ['Encouraging repeat purchases with a real rewards catalog', 'Rewarding your best customers with a voucher instead of a blanket discount', 'Running a tiered loyalty program without a separate app'],
    faq: [
      { q: 'Is loyalty a separate app buyers have to download?', a: 'No — it\'s built into your store\'s checkout. A redeemed reward becomes a voucher code, used like any coupon.' },
      { q: 'Can I set my own rewards and point values?', a: 'Yes — you define what points cost and what they redeem for from your store dashboard.' },
    ],
  },
];

// A second, separate array — NOT merged into PLATFORM_PRODUCTS. Homepage's
// "Connected System" diagram spaces its 7 nodes evenly around a circle based
// on `PLATFORM_PRODUCTS.length`; growing that array would silently cram a
// second ring of items into a layout tuned for exactly 7. These 7 real
// capabilities (Stripe Connect payouts, the real checkout, automatic
// discounts/coupons/campaigns, shipping zones, custom domains, the buyer
// account workspace, and PKR/USD markets — every one confirmed against the
// actual backend modules, not invented) get real `/products/:slug` pages via
// `getPlatformProduct` below, and are surfaced in the nav's mega-menu, without
// touching the Homepage diagram or `EXPLORER_SLUGS` at all.
export const EXTENDED_PLATFORM_PRODUCTS: PlatformProduct[] = [
  {
    slug: 'payments',
    name: 'Payments',
    tagline: 'Get paid straight into your own account',
    heroHeadline: 'Payments that settle to you, not just a shared pool.',
    heroSubtext: 'Connect your own Stripe account and eligible online sales route straight to you — card payments, automatic payouts, and a real finance dashboard to track it all.',
    benefits: [
      { title: 'Money goes to your own account', desc: 'Connect your own Stripe account and eligible online sales settle directly to you, with Solvexo\'s commission taken as a platform fee — not held in a shared balance.' },
      { title: 'Works without Stripe Connect too', desc: 'Haven\'t connected your own account yet? Sales still process through Solvexo\'s shared payment processing and pay out through your store\'s finance dashboard.' },
      { title: 'Refunds reverse the money correctly', desc: 'A refund on a Connect-settled sale claws the funds back from your own account automatically — never left for you to reconcile by hand.' },
      { title: 'A real finance dashboard', desc: 'See your available and pending balance, payout history and tax reports in one place — not just a raw transaction log.' },
    ],
    features: ['Direct-to-you payouts via Stripe Connect', 'Automatic commission handling', 'Refund reversal on connected accounts', 'Finance dashboard with balance & payout history', 'Downloadable tax reports'],
    useCases: ['A seller who wants payments to settle to their own bank account instead of a shared balance', 'Tracking available vs. pending payout balance day to day', 'Pulling a tax report for your own bookkeeping'],
    faq: [
      { q: 'Do I have to connect my own Stripe account?', a: 'No — it\'s optional. Without it, sales still process and pay out through Solvexo\'s own payment system.' },
      { q: 'What happens to a refund if I\'m connected?', a: 'The refunded amount is pulled back from your own connected account automatically, so your payout balance stays accurate.' },
    ],
  },
  {
    slug: 'checkout',
    name: 'Checkout',
    tagline: 'A real checkout, not a placeholder page',
    heroHeadline: 'A checkout built for how people actually pay.',
    heroSubtext: 'Card or cash on delivery, a real coupon and gift-card field, and shipping handled by your own zones — a complete checkout for every store on Solvexo.',
    benefits: [
      { title: 'Card and cash on delivery', desc: 'Buyers can pay online by card or choose cash on delivery — both are real, fully wired payment paths, not a single forced option.' },
      { title: 'Coupons and gift cards, together', desc: 'A buyer can apply a coupon code and a gift card in the same checkout — each tracked and redeemed independently.' },
      { title: 'Your own shipping zones', desc: 'Shipping cost and available methods are resolved from the zones and carriers you\'ve set up for your store.' },
      { title: 'Built for one store at a time', desc: 'Every checkout is scoped to a single store\'s cart, pricing and currency — no mixing orders across sellers.' },
    ],
    features: ['Card payments & cash on delivery', 'Coupon + gift-card redemption', 'Shipping zone & carrier resolution', 'Guest-friendly address entry', 'Real order placement, not a demo flow'],
    useCases: ['A buyer checking out with a mix of a coupon and a gift card', 'Offering cash on delivery alongside card payments', 'Charging the right shipping rate based on the buyer\'s zone'],
    faq: [
      { q: 'Can a buyer use a coupon and a gift card at once?', a: 'Yes — they\'re separate checkout fields, each applied and tracked independently.' },
      { q: 'Is cash on delivery a real option or just a label?', a: 'It\'s a fully real payment path — the order is placed and tracked the same way as a card payment.' },
    ],
  },
  {
    slug: 'discounts',
    name: 'Discounts & Promotions',
    tagline: 'Discounts that apply themselves',
    heroHeadline: 'Run promotions without typing a single code.',
    heroSubtext: 'Set up automatic, no-code discounts alongside coupon codes and platform-wide sale campaigns — Solvexo applies the single best one for each order.',
    benefits: [
      { title: 'No-code automatic discounts', desc: 'Set a percentage or fixed discount on your whole store, a category, or specific products — it applies at checkout with no code required.' },
      { title: 'Coupon codes, your own or platform-wide', desc: 'Run your own store coupons, or opt into a platform-wide sale campaign and let Solvexo handle the rest.' },
      { title: 'Never double-discounts an order', desc: 'An automatic discount and an active sale campaign are never combined on the same item — Solvexo always applies the single best one.' },
    ],
    features: ['No-code automatic discounts by store, category or product', 'Store-level coupon codes', 'Opt-in to platform-wide sale campaigns', 'One-best-discount logic, no stacking surprises'],
    useCases: ['Running a standing discount on one product category with zero setup', 'Joining a platform-wide flash sale for extra visibility', 'Issuing a one-off coupon code for a specific customer'],
    faq: [
      { q: 'Can I combine a coupon with an automatic discount?', a: 'Only the single best discount for an item applies — they\'re not stacked on top of each other.' },
      { q: 'Do I have to join platform sale campaigns?', a: 'No — joining is opt-in per store, from your own Marketing tab.' },
    ],
  },
  {
    slug: 'shipping',
    name: 'Shipping',
    tagline: 'Shipping rates that match how you actually ship',
    heroHeadline: 'Shipping, set up around your real zones and carriers.',
    heroSubtext: 'Define the zones you ship to and the carriers you use, and checkout resolves the right shipping cost and method automatically — per store.',
    benefits: [
      { title: 'Zone-based rates', desc: 'Set different shipping rates and availability for different regions instead of one flat rate for every buyer.' },
      { title: 'Your own carriers', desc: 'Add the carriers you actually ship with, and reference them directly on a shipment\'s tracking details.' },
      { title: 'Resolved automatically at checkout', desc: 'A buyer\'s address is matched to your zones automatically — no manual shipping calculation needed.' },
    ],
    features: ['Shipping zones per region', 'Custom carrier list', 'Automatic rate resolution at checkout', 'Per-store configuration'],
    useCases: ['Charging a different shipping rate for nearby vs. far regions', 'Attaching a real carrier and tracking number to a shipment', 'Running a store that only ships to specific regions'],
    faq: [
      { q: 'Can I restrict shipping to certain regions only?', a: 'Yes — a zone only matches the regions you\'ve defined for it.' },
    ],
  },
  {
    slug: 'domains',
    name: 'Custom Domains',
    tagline: 'Your own domain, pointed at your store',
    heroHeadline: 'Drop the .solvexo.store subdomain whenever you\'re ready.',
    heroSubtext: 'Connect a domain you already own, verify it with a real DNS check, and your storefront serves from it directly.',
    benefits: [
      { title: 'Real DNS verification', desc: 'Your domain is verified by actually checking its DNS records — not just trusting whatever you type in.' },
      { title: 'A clear status at every step', desc: 'See exactly whether your domain is verified, and the exact DNS record to add if it isn\'t yet.' },
      { title: 'Your subdomain still works', desc: 'Connecting a custom domain doesn\'t take away your original solvexo.store subdomain — it\'s an addition, not a swap you can\'t undo.' },
    ],
    features: ['Connect any domain you own', 'Real DNS CNAME verification', 'Clear setup status & instructions', 'Plan-gated by your platform tier'],
    useCases: ['Moving a store from its subdomain to a fully branded domain', 'Verifying DNS setup before going live on a new domain'],
    faq: [
      { q: 'Do I need technical knowledge to connect a domain?', a: 'You just need to add one DNS record at your domain registrar — the dashboard shows you exactly what to add.' },
      { q: 'Is a custom domain available on every plan?', a: 'It\'s gated by your platform plan tier — check your plan\'s entitlements.' },
    ],
  },
  {
    slug: 'customer-accounts',
    name: 'Customer Accounts',
    tagline: 'A real account, not a guest checkout',
    heroHeadline: 'Give your buyers a real account to come back to.',
    heroSubtext: 'Order history, wishlist, saved addresses and account security — a full buyer account workspace that comes with every Solvexo store.',
    benefits: [
      { title: 'Order history & tracking', desc: 'Buyers can see every past order and its status without contacting you to ask.' },
      { title: 'Wishlist & saved addresses', desc: 'A buyer\'s wishlist and addresses are saved to their own account, making a repeat purchase faster.' },
      { title: 'Built-in account security', desc: 'Password changes and account security live in the buyer\'s own account dashboard — no extra setup from you.' },
    ],
    features: ['Order history & status tracking', 'Wishlist', 'Saved addresses', 'Account security & password management', 'Built into every store, no setup required'],
    useCases: ['A returning buyer checking their past orders without asking you', 'A buyer saving items to a wishlist before they buy', 'A customer updating their own saved address'],
    faq: [
      { q: 'Do I need to set this up myself?', a: 'No — every buyer gets an account workspace automatically; there\'s nothing for you to configure.' },
    ],
  },
  {
    slug: 'markets',
    name: 'Markets',
    tagline: 'Sell in the currency your buyers actually use',
    heroHeadline: 'Let buyers check out in their own currency.',
    heroSubtext: 'Solvexo supports checkout in PKR and USD — choose which of the two your store accepts alongside its own base currency, with live exchange-rate conversion handling the rest.',
    benefits: [
      { title: 'PKR and USD, seller-controlled', desc: 'Your store\'s base currency is always accepted, and you choose whether to also accept the other.' },
      { title: 'Real exchange-rate conversion', desc: 'Conversion between currencies is handled by a live exchange-rate snapshot at checkout, not a guess.' },
      { title: 'Buyer picks what works for them', desc: 'A buyer sees prices and completes payment in a currency they actually recognize.' },
    ],
    features: ['Checkout in PKR and USD', 'Seller-controlled currency allow-list', 'Live exchange-rate conversion', 'Base currency always protected'],
    useCases: ['A store whose buyers are split across PKR and USD', 'Restricting checkout to only your store\'s base currency'],
    faq: [
      { q: 'Can I turn off a currency I don\'t want to support?', a: 'Yes — you choose whether to accept the second currency beyond your store\'s own base currency.' },
    ],
  },
];

// Looks across both real product lists — a page/nav link to either a core
// product or an extended one resolves through this one function. Exported
// for any page that genuinely means "every real product" (the nav's mega-
// menu, the Products overview grid) — NOT for Homepage's orbital diagram or
// `EXPLORER_SLUGS`, both of which stay on the original 7-item array on
// purpose (see the comment above `EXTENDED_PLATFORM_PRODUCTS`).
export const ALL_PLATFORM_PRODUCTS = [...PLATFORM_PRODUCTS, ...EXTENDED_PLATFORM_PRODUCTS];

export function getPlatformProduct(slug: string): PlatformProduct | undefined {
  return ALL_PLATFORM_PRODUCTS.find(p => p.slug === slug);
}
