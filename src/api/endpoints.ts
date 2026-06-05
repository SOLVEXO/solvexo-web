// ── API Endpoints ─────────────────────────────────────────────────────────────
// All endpoint paths in one place.
// Base URL is loaded from VITE_API_URL in .env via the Axios client.
// ─────────────────────────────────────────────────────────────────────────────

export const ENDPOINTS = {

  // ── AUTH ───────────────────────────────────────────────────────────────────
  AUTH: {
    REGISTER:        '/auth/register',        // POST  {name, email, password, phone, address, role}
    LOGIN:           '/auth/login',            // POST  {email, password, role}
    VERIFY_OTP:      '/auth/verifyOtp',        // POST  {email, role, otp}
    FORGOT_PASSWORD: '/auth/forgot-password',  // POST  {email, role}
    RESET_PASSWORD:  '/auth/reset-password',   // POST  {email, role, otp, newPassword}
    REFRESH_TOKEN:   '/auth/refresh',          // POST  {refreshToken}
    LOGOUT:          '/auth/logout',           // POST
    ME:              '/auth/me',               // GET
  },

  // ── MARKETPLACE (Buyer) ───────────────────────────────────────────────────
  MARKETPLACE: {
    PRODUCTS:          '/marketplace/products',
    PRODUCT:           (id: string) => `/marketplace/products/${id}`,
    CATEGORIES:        '/marketplace/categories',
    SEARCH:            '/marketplace/search',
    FEATURED:          '/marketplace/featured',
    TRENDING:          '/marketplace/trending',
    EDUCATION:         '/marketplace/education',
    SELLERS:           '/marketplace/sellers',
    STORE:             (slug: string) => `/marketplace/stores/${slug}`,
    STORE_PRODUCTS:    (slug: string) => `/marketplace/stores/${slug}/products`,
    PRODUCT_REVIEWS:   (id: string)  => `/marketplace/products/${id}/reviews`,
  },

  // ── CART ──────────────────────────────────────────────────────────────────
  CART: {
    GET:           '/cart',
    ADD:           '/cart/items',
    UPDATE:        (id: string) => `/cart/items/${id}`,
    REMOVE:        (id: string) => `/cart/items/${id}`,
    CLEAR:         '/cart',
    COUPON:        '/cart/coupon',
  },

  // ── SELLER — DASHBOARD ────────────────────────────────────────────────────
  SELLER: {
    DASHBOARD:     '/seller/dashboard/stats',
    REVENUE_CHART: '/seller/dashboard/revenue-chart',

    // Products
    PRODUCTS:      '/seller/products',
    PRODUCT:       (id: string) => `/seller/products/${id}`,
    PUBLISH:       (id: string) => `/seller/products/${id}/publish`,
    UNPUBLISH:     (id: string) => `/seller/products/${id}/unpublish`,
    UPLOAD_IMAGE:  (id: string) => `/seller/products/${id}/images`,
    UPLOAD_FILE:   (id: string) => `/seller/products/${id}/files`,
    BULK:          '/seller/products/bulk',

    // Orders
    ORDERS:        '/seller/orders',
    ORDER:         (id: string) => `/seller/orders/${id}`,
    FULFILL:       (id: string) => `/seller/orders/${id}/fulfill`,
    REFUND:        (id: string) => `/seller/orders/${id}/refund`,
    CANCEL:        (id: string) => `/seller/orders/${id}/cancel`,
    ORDERS_EXPORT: '/seller/orders/export',

    // Returns
    RETURNS:       '/seller/returns',
    RETURN:        (id: string) => `/seller/returns/${id}`,

    // Inventory
    INVENTORY:     '/seller/inventory',
    STOCK:         (id: string) => `/seller/inventory/${id}/stock`,
    INVENTORY_IMPORT: '/seller/inventory/import',
    INVENTORY_EXPORT: '/seller/inventory/export',

    // Analytics
    ANALYTICS:      '/seller/analytics/overview',
    REVENUE_CHART2: '/seller/analytics/revenue',
    ORDERS_CHART:   '/seller/analytics/orders',
    TRAFFIC:        '/seller/analytics/traffic',
    TOP_PRODUCTS:   '/seller/analytics/top-products',

    // SEO
    SEO_PRODUCTS:  '/seller/seo/products',
    SEO_UPDATE:    (id: string) => `/seller/seo/products/${id}`,
    SEO_STORE:     '/seller/seo/store',

    // AI Studio
    AI_CREDITS:    '/seller/ai/credits',
    AI_LISTING:    '/seller/ai/listing',
    AI_PRICING:    '/seller/ai/pricing',
    AI_WORKSHEET:  '/seller/ai/worksheet',
    AI_SEO:        '/seller/ai/seo',
    AI_EMAIL:      '/seller/ai/email',
    AI_IMAGE:      '/seller/ai/image',

    // Customers
    CUSTOMERS:     '/seller/customers',
    CUSTOMER:      (id: string) => `/seller/customers/${id}`,
    CUSTOMER_EMAIL: (id: string) => `/seller/customers/${id}/email`,

    // Loyalty
    LOYALTY:       '/seller/loyalty',
    LOYALTY_TIERS: '/seller/loyalty/tiers',
    LOYALTY_RULES: '/seller/loyalty/rules',

    // Subscriptions
    SUBSCRIPTIONS: '/seller/subscriptions',
    SUBSCRIPTION:  (id: string) => `/seller/subscriptions/${id}`,

    // Marketing
    COUPONS:       '/seller/marketing/coupons',
    COUPON:        (id: string) => `/seller/marketing/coupons/${id}`,
    CAMPAIGNS:     '/seller/marketing/email-campaigns',
    CAMPAIGN:      (id: string) => `/seller/marketing/email-campaigns/${id}`,
    ABANDONED:     '/seller/marketing/abandoned-carts',
    GIFT_CARDS:    '/seller/marketing/gift-cards',

    // Finance
    BALANCE:       '/seller/finance/balance',
    PAYOUTS:       '/seller/finance/payouts',
    TRANSACTIONS:  '/seller/finance/transactions',
    PAYOUT_REQUEST:'/seller/finance/payouts/request',
    TAX_REPORT:    '/seller/finance/tax-report',

    // Shipping
    SHIPPING_ZONES: '/seller/shipping/zones',
    SHIPPING_CARRIERS: '/seller/shipping/carriers',

    // Messages
    MESSAGES:      '/seller/messages',
    MESSAGE_THREAD:(id: string) => `/seller/messages/${id}`,

    // Reviews
    REVIEWS:       '/seller/reviews',
    REVIEW_REPLY:  (id: string) => `/seller/reviews/${id}/reply`,

    // Integrations
    INTEGRATIONS:  '/seller/integrations',
    INTEGRATION:   (id: string) => `/seller/integrations/${id}`,
    WEBHOOKS:      '/seller/integrations/webhooks',

    // Activity
    ACTIVITY:      '/seller/activity',

    // Store Builder
    STORE:         '/seller/store',
    STORE_PUBLISH: '/seller/store/publish',

    // Settings
    SETTINGS:      '/seller/settings',
    PROFILE:       '/seller/settings/profile',
    PAYOUTS_CONFIG:'/seller/settings/payouts',
    STAFF:         '/seller/settings/staff',

    // Categories
    CATEGORIES:    '/seller/categories',
    CATEGORY:      (id: string) => `/seller/categories/${id}`,
    SUBCATEGORIES: (catId: string) => `/seller/categories/${catId}/subcategories`,
    SUBCATEGORY:   (catId: string, subId: string) => `/seller/categories/${catId}/subcategories/${subId}`,

    // POS
    POS_PRODUCTS:    '/seller/pos/products',
    POS_TRANSACTION: '/seller/pos/transactions',
    POS_TRANSACTIONS:'/seller/pos/transactions',
    POS_HELD:        '/seller/pos/held-sales',
    POS_SHIFT_OPEN:  '/seller/pos/shift/open',
    POS_SHIFT_CLOSE: '/seller/pos/shift/close',
    POS_SHIFT_SUMMARY:'/seller/pos/shift/summary',
  },

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  ADMIN: {
    OVERVIEW:       '/admin/overview/stats',
    USERS:          '/admin/users',
    USER:           (id: string) => `/admin/users/${id}`,
    SUSPEND_USER:   (id: string) => `/admin/users/${id}/suspend`,
    SELLERS:        '/admin/sellers',
    SELLER:         (id: string) => `/admin/sellers/${id}`,
    VERIFY_SELLER:  (id: string) => `/admin/sellers/${id}/verify`,
    MODERATION:     '/admin/moderation',
    APPROVE:        (id: string) => `/admin/moderation/${id}/approve`,
    REJECT:         (id: string) => `/admin/moderation/${id}/reject`,
    REMOVE:         (id: string) => `/admin/moderation/${id}/remove`,
    MARKETPLACE_PRODUCTS: '/admin/marketplace/products',
    FINANCE:        '/admin/finance/overview',
    PAYOUTS_ADMIN:  '/admin/finance/payouts',
    APPROVE_PAYOUT: (id: string) => `/admin/finance/payouts/${id}/approve`,
    ANNOUNCEMENTS:  '/admin/announcements',
    ANNOUNCEMENT:   (id: string) => `/admin/announcements/${id}`,
    CONFIG:         '/admin/config',
    FEATURE_FLAGS:  '/admin/config/features',
  },

  // ── UPLOAD (shared) ───────────────────────────────────────────────────────
  UPLOAD: {
    IMAGE:  '/upload/image',
    FILE:   '/upload/file',
    AVATAR: '/upload/avatar',
  },

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
  NOTIFICATIONS: {
    LIST:      '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL:  '/notifications/read-all',
  },

} as const;
