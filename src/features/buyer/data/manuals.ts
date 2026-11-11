// Solvexo's user manuals, served as static PDFs from /public/manuals. Keep free of React and `@` imports:
// the SEO build (src/seo) imports it too.

export interface ManualFile { label: string; file: string; sizeBytes: number }
export interface Manual {
  key: 'store' | 'pos';
  title: string;
  kicker: string;
  summary: string;
  audience: string;
  complete: ManualFile;
  chapters: ManualFile[];
}

const f = (key: Manual['key'], label: string, name: string, sizeBytes: number): ManualFile =>
  ({ label, file: `/manuals/${key}/${name}`, sizeBytes });

export const MANUALS: Manual[] = [
  {
    key: 'store',
    title: 'Create Your Store',
    kicker: 'Online store',
    summary: 'From creating your account to a live store that takes its first order: products, payments, shipping, design, plans and going live.',
    audience: 'New store owners',
    complete: f('store', 'Complete manual', 'solvexo-create-your-store-complete-manual.pdf', 4810141),
    chapters: [
      f('store', 'Welcome and your setup journey', '00-welcome-and-setup-journey.pdf', 308078),
      f('store', 'Chapter 1: Create your account', '01-chapter-1-create-your-account.pdf', 681427),
      f('store', 'Chapter 2: Create your store', '02-chapter-2-create-your-store.pdf', 693430),
      f('store', 'Chapter 3: Your dashboard', '03-chapter-3-your-dashboard.pdf', 468908),
      f('store', 'Chapter 4: Add your products', '04-chapter-4-add-your-products.pdf', 740683),
      f('store', 'Chapter 5: Get paid', '05-chapter-5-get-paid.pdf', 592995),
      f('store', 'Chapter 6: Shipping, tax and settings', '06-chapter-6-shipping-tax-and-settings.pdf', 519412),
      f('store', 'Chapter 7: Design your storefront', '07-chapter-7-design-your-storefront.pdf', 521832),
      f('store', 'Chapter 8: Choose your plan', '08-chapter-8-choose-your-plan.pdf', 378399),
      f('store', 'Chapter 9: Go live and your first order', '09-chapter-9-go-live-and-first-order.pdf', 558414),
      f('store', 'FAQ and getting help', '10-faq-and-getting-help.pdf', 387090),
    ],
  },
  {
    key: 'pos',
    title: 'Solvexo POS',
    kicker: 'In-store selling',
    summary: 'Set up your team, registers and tills, then sell, take payments, handle returns, manage stock, count the cash and close the shift.',
    audience: 'Shop owners, managers and cashiers',
    complete: f('pos', 'Complete manual', 'solvexo-pos-complete-manual.pdf', 6531408),
    chapters: [
      f('pos', 'Welcome to Solvexo POS', '00-welcome-to-solvexo-pos.pdf', 203356),
      f('pos', 'Chapter 1: Get started', '01-chapter-1-get-started.pdf', 528308),
      f('pos', 'Chapter 2: Team, registers and plan', '02-chapter-2-team-registers-and-plan.pdf', 718706),
      f('pos', 'Chapter 3: Set up the till device', '03-chapter-3-set-up-the-till-device.pdf', 639266),
      f('pos', 'Chapter 4: Start your shift', '04-chapter-4-start-your-shift.pdf', 431252),
      f('pos', 'Chapter 5: Make a sale', '05-chapter-5-make-a-sale.pdf', 1399589),
      f('pos', 'Chapter 6: Held sales, receipts and returns', '06-chapter-6-held-sales-receipts-and-returns.pdf', 629181),
      f('pos', 'Chapter 7: Customers', '07-chapter-7-customers.pdf', 345651),
      f('pos', 'Chapter 8: Products and stock', '08-chapter-8-products-and-stock.pdf', 789666),
      f('pos', 'Chapter 9: Cash and closing your shift', '09-chapter-9-cash-and-closing-your-shift.pdf', 405273),
      f('pos', 'Chapter 10: Reports and needs attention', '10-chapter-10-reports-and-needs-attention.pdf', 625051),
      f('pos', 'Chapter 11: Offline, devices and account', '11-chapter-11-offline-devices-and-account.pdf', 319448),
      f('pos', 'FAQ and getting help', '12-faq-and-getting-help.pdf', 311588),
    ],
  },
];

/** "4.8 MB" / "310 KB" */
export function formatFileSize(bytes: number): string {
  return bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.round(bytes / 1e3)} KB`;
}
