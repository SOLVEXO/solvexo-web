// ─── Solvexo Brand Design Tokens ───────────────────────────────────────────
// Single source of truth — matches Tailwind @theme in index.css

export const COLORS = {
  // Brand
  orange:      '#D97757',
  deepOrange:  '#B95A3A',
  paleOrange:  '#FBECE4',

  // Neutrals
  carbon:   '#141413',
  charcoal: '#2C2A28',
  slate:    '#8C8A82',
  bone:     '#E8E6DC',
  cream:    '#FAF9F5',
  white:    '#FFFFFF',

  // Semantic
  success:    '#2D8A4E',
  successBg:  '#EBF7EF',
  warning:    '#C08B1E',
  warningBg:  '#FEF7E5',
  error:      '#C13030',
  errorBg:    '#FDEAEA',
  info:       '#1A72C2',
  infoBg:     '#E6F1FB',

  // POS Dark Theme
  posBg:      '#0F0E0D',
  posSurface: '#1A1918',
  posBorder:  '#2C2A28',
  posMuted:   '#5C5A58',
  posFaint:   '#6A6866',
} as const;

export const FONTS = {
  sans:  "'Poppins', system-ui, sans-serif",
  serif: "'Lora', Georgia, serif",
} as const;

export const RADIUS = {
  sm:  '6px',
  md:  '8px',
  lg:  '12px',
  xl:  '16px',
  '2xl': '20px',
  full: '9999px',
} as const;

export const SHADOWS = {
  card: '0 2px 12px rgba(0,0,0,0.06)',
  lg:   '0 8px 40px rgba(0,0,0,0.12)',
  pos:  '0 4px 24px rgba(0,0,0,0.3)',
} as const;

// ── Status → Badge color mapping ────────────────────────────────────────────
export const STATUS_COLORS: Record<string, 'green' | 'yellow' | 'blue' | 'gray' | 'red' | 'orange'> = {
  Active:      'green',
  Paid:        'green',
  Delivered:   'green',
  Published:   'green',
  Approved:    'green',
  Fulfilled:   'green',
  InStock:     'green',
  Pending:     'yellow',
  'Low Stock': 'yellow',
  Processing:  'blue',
  Digital:     'blue',
  'In Review': 'blue',
  Draft:       'gray',
  Unpublished: 'gray',
  Suspended:   'red',
  Cancelled:   'red',
  Refunded:    'red',
  'Out of Stock': 'red',
};

// ── Seller Sidebar Navigation ────────────────────────────────────────────────
export const SELLER_NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',     icon: 'dashboard',  path: '/seller/dashboard'  },
  { id: 'orders',      label: 'Orders',         icon: 'orders',     path: '/seller/orders'     },
  { id: 'products',    label: 'Products',       icon: 'products',   path: '/seller/products'   },
  { id: 'inventory',   label: 'Inventory',      icon: 'inventory',  path: '/seller/inventory'  },
  { id: 'store',       label: 'Store Builder',  icon: 'store',      path: '/seller/store'      },
  { id: 'pos',         label: 'POS Register',   icon: 'pos',        path: '/seller/pos'        },
  { id: 'ai',          label: 'AI Studio',      icon: 'ai',         path: '/seller/ai'         },
  { id: 'analytics',   label: 'Analytics',      icon: 'analytics',  path: '/seller/analytics'  },
] as const;

export const SELLER_ACCOUNT_ITEMS = [
  { id: 'customers',  label: 'Customers',  icon: 'customers',  path: '/seller/customers' },
  { id: 'finance',    label: 'Finance',    icon: 'finance',    path: '/seller/finance'   },
  { id: 'marketing',  label: 'Marketing',  icon: 'marketing',  path: '/seller/marketing' },
  { id: 'settings',   label: 'Settings',   icon: 'settings',   path: '/seller/settings'  },
] as const;

// ── Admin Sidebar Navigation ─────────────────────────────────────────────────
export const ADMIN_NAV_ITEMS = [
  { id: 'overview',     label: 'Overview',         icon: 'overview',      path: '/admin'                   },
  { id: 'users',        label: 'Users & Sellers',   icon: 'users',         path: '/admin/users'             },
  { id: 'moderation',   label: 'Moderation',        icon: 'moderation',    path: '/admin/moderation'        },
  { id: 'marketplace',  label: 'Marketplace',       icon: 'marketplace',   path: '/admin/marketplace'       },
  { id: 'finance',      label: 'Finance',           icon: 'finance',       path: '/admin/finance'           },
  { id: 'announcements',label: 'Announcements',     icon: 'announcements', path: '/admin/announcements'     },
  { id: 'config',       label: 'Platform Config',   icon: 'config',        path: '/admin/config'            },
] as const;

// ── Public Navigation ────────────────────────────────────────────────────────
export const PUBLIC_NAV_ITEMS = [
  { label: 'Marketplace', path: '/marketplace' },
  { label: 'Sellers',     path: '/sellers'     },
  { label: 'Pricing',     path: '/pricing'     },
  { label: 'Learn',       path: '/education'   },
] as const;

// ── Seller Onboarding Steps ──────────────────────────────────────────────────
export const ONBOARDING_STEPS = [
  'Account',
  'Store Info',
  'Seller Type',
  'What You Sell',
  'Go Live',
] as const;

export const SELLER_TYPES = [
  { id: 'creator',    icon: 'palette',    title: 'Creator',           desc: 'Sell digital art, templates, fonts, music, presets' },
  { id: 'educator',   icon: 'book-open',  title: 'Educator',          desc: 'Worksheets, lesson plans, curriculum, assessments'  },
  { id: 'retailer',   icon: 'store',      title: 'Retailer',          desc: 'Physical goods, handmade products, branded items'   },
  { id: 'brand',      icon: 'briefcase',  title: 'Brand / Business',  desc: 'Run a full online store with inventory and POS'     },
  { id: 'freelancer', icon: 'monitor',    title: 'Freelancer',        desc: 'Offer services, bookings, or consulting packages'   },
  { id: 'multiple',   icon: 'gift',       title: 'Mix of the above',  desc: 'I sell across multiple categories and formats'      },
] as const;

export const PRODUCT_TYPES = [
  { id: 'physical',       icon: 'package',   label: 'Physical Products',     desc: 'Ship items to customers'      },
  { id: 'digital',        icon: 'download',  label: 'Digital Downloads',     desc: 'PDFs, files, audio, video'   },
  { id: 'educational',    icon: 'book-open', label: 'Educational Resources', desc: 'Worksheets, lesson plans'    },
  { id: 'services',       icon: 'calendar',  label: 'Services / Bookings',  desc: 'Appointments and packages'   },
  { id: 'subscriptions',  icon: 'repeat',    label: 'Subscriptions',         desc: 'Recurring membership access' },
  { id: 'pos',            icon: 'monitor',   label: 'In-Person / POS',      desc: 'Sell at a physical location'  },
] as const;

// ── Pricing Plans ────────────────────────────────────────────────────────────
export const PRICING_PLANS = [
  {
    name: 'Starter',
    monthly: 0, annual: 0,
    badge: null,
    desc: 'Perfect for trying Solvexo and selling your first products.',
    cta: 'Start Free',
    transactionFee: '3%',
    features: [
      'Up to 10 products', 'Marketplace listing', 'Basic store page',
      'Digital product delivery', 'Standard checkout', 'Email support',
      '100 AI credits / month', '3% transaction fee',
    ],
    missing: ['Custom domain', 'POS', 'Advanced analytics', 'Store Builder themes', 'Priority support'],
  },
  {
    name: 'Professional',
    monthly: 49, annual: 39,
    badge: 'Most Popular',
    desc: 'For growing sellers who need the full commerce toolkit.',
    cta: 'Start Free Trial',
    transactionFee: '1%',
    features: [
      'Unlimited products', 'Custom domain (.com)', 'Full Store Builder',
      'POS register', 'Advanced analytics', 'AI Studio — 1,000 credits / mo',
      '5 staff accounts', 'Email campaigns', 'Abandoned cart recovery',
      'Priority support', '1% transaction fee', 'Marketplace featured badge',
    ],
    missing: [],
  },
  {
    name: 'Business',
    monthly: 99, annual: 79,
    badge: null,
    desc: 'For high-volume sellers, agencies, and multi-location businesses.',
    cta: 'Start Free Trial',
    transactionFee: '0.5%',
    features: [
      'Everything in Professional', 'Multi-location POS', 'Unlimited staff accounts',
      'AI Studio — 5,000 credits / mo', 'Loyalty & Rewards program',
      'Subscription products', 'Advanced shipping rules',
      'API access & webhooks', 'Dedicated account manager',
      '0.5% transaction fee', 'White-label store option', 'SLA — 99.9% uptime',
    ],
    missing: [],
  },
  {
    name: 'Enterprise',
    monthly: null, annual: null,
    badge: 'Custom',
    desc: 'For schools, brands, and platforms with custom requirements.',
    cta: 'Contact Sales',
    transactionFee: '0%',
    features: [
      'Everything in Business', 'Custom AI credits', 'School purchase accounts',
      'Multi-brand management', 'Custom integrations', 'Dedicated infrastructure',
      'SSO & SAML login', 'Contract billing', '0% transaction fee', '24/7 dedicated support',
    ],
    missing: [],
  },
] as const;
