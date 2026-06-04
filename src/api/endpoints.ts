// ─── Solvexo API Endpoints ───────────────────────────────────────────────────
// All API endpoints in one place — change BASE_URL once for all environments

export const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

// Helper to build URLs cleanly
const url = (path: string) => `${BASE_URL}${path}`;

// ────────────────────────────────────────────────────────────────────────────
// AUTH
// ────────────────────────────────────────────────────────────────────────────
export const AUTH = {
  REGISTER:        url('/auth/register'),
  LOGIN:           url('/auth/login'),
  LOGOUT:          url('/auth/logout'),
  REFRESH:         url('/auth/refresh'),
  ME:              url('/auth/me'),
  FORGOT_PASSWORD: url('/auth/forgot-password'),
  RESET_PASSWORD:  url('/auth/reset-password'),
  VERIFY_EMAIL:    url('/auth/verify-email'),
  SOCIAL_GOOGLE:   url('/auth/google'),
  SOCIAL_APPLE:    url('/auth/apple'),
} as const;

// ────────────────────────────────────────────────────────────────────────────
// MARKETPLACE (Buyer)
// ────────────────────────────────────────────────────────────────────────────
export const MARKETPLACE = {
  PRODUCTS:            url('/marketplace/products'),
  PRODUCT_DETAIL:      (id: string) => url(`/marketplace/products/${id}`),
  CATEGORIES:          url('/marketplace/categories'),
  CATEGORY_PRODUCTS:   (slug: string) => url(`/marketplace/categories/${slug}/products`),
  SEARCH:              url('/marketplace/search'),
  FEATURED:            url('/marketplace/featured'),
  TRENDING:            url('/marketplace/trending'),
  EDUCATION:           url('/marketplace/education'),
  SELLERS_LIST:        url('/marketplace/sellers'),
  SELLER_STOREFRONT:   (storeSlug: string) => url(`/marketplace/stores/${storeSlug}`),
  SELLER_PRODUCTS:     (storeSlug: string) => url(`/marketplace/stores/${storeSlug}/products`),
  PRODUCT_REVIEWS:     (id: string) => url(`/marketplace/products/${id}/reviews`),
  ADD_REVIEW:          (id: string) => url(`/marketplace/products/${id}/reviews`),
} as const;

// ────────────────────────────────────────────────────────────────────────────
// CART & CHECKOUT (Buyer)
// ────────────────────────────────────────────────────────────────────────────
export const CART = {
  GET:         url('/cart'),
  ADD_ITEM:    url('/cart/items'),
  UPDATE_ITEM: (itemId: string) => url(`/cart/items/${itemId}`),
  REMOVE_ITEM: (itemId: string) => url(`/cart/items/${itemId}`),
  CLEAR:       url('/cart'),
  APPLY_COUPON: url('/cart/coupon'),
  REMOVE_COUPON: url('/cart/coupon'),
} as const;

export const CHECKOUT = {
  CREATE_SESSION: url('/checkout/session'),
  CONFIRM:        url('/checkout/confirm'),
  PAYMENT_INTENT: url('/checkout/payment-intent'),
} as const;

// ────────────────────────────────────────────────────────────────────────────
// BUYER ORDERS
// ────────────────────────────────────────────────────────────────────────────
export const BUYER_ORDERS = {
  LIST:        url('/buyer/orders'),
  DETAIL:      (id: string) => url(`/buyer/orders/${id}`),
  DOWNLOADS:   (id: string) => url(`/buyer/orders/${id}/downloads`),
  REQUEST_REFUND: (id: string) => url(`/buyer/orders/${id}/refund`),
} as const;

// ────────────────────────────────────────────────────────────────────────────
// SELLER — ONBOARDING
// ────────────────────────────────────────────────────────────────────────────
export const SELLER_ONBOARDING = {
  CHECK_STORE_SLUG: (slug: string) => url(`/seller/onboarding/check-slug?slug=${slug}`),
  COMPLETE:         url('/seller/onboarding/complete'),
} as const;

// ────────────────────────────────────────────────────────────────────────────
// SELLER — DASHBOARD
// ────────────────────────────────────────────────────────────────────────────
export const SELLER_DASHBOARD = {
  STATS:         url('/seller/dashboard/stats'),
  REVENUE_CHART: url('/seller/dashboard/revenue-chart'),
  RECENT_ORDERS: url('/seller/dashboard/recent-orders'),
  QUICK_METRICS: url('/seller/dashboard/quick-metrics'),
} as const;

// ────────────────────────────────────────────────────────────────────────────
// SELLER — PRODUCTS
// ────────────────────────────────────────────────────────────────────────────
export const SELLER_PRODUCTS = {
  LIST:          url('/seller/products'),
  CREATE:        url('/seller/products'),
  DETAIL:        (id: string) => url(`/seller/products/${id}`),
  UPDATE:        (id: string) => url(`/seller/products/${id}`),
  DELETE:        (id: string) => url(`/seller/products/${id}`),
  DUPLICATE:     (id: string) => url(`/seller/products/${id}/duplicate`),
  PUBLISH:       (id: string) => url(`/seller/products/${id}/publish`),
  UNPUBLISH:     (id: string) => url(`/seller/products/${id}/unpublish`),
  UPLOAD_IMAGES: (id: string) => url(`/seller/products/${id}/images`),
  DELETE_IMAGE:  (id: string, imgId: string) => url(`/seller/products/${id}/images/${imgId}`),
  UPLOAD_FILE:   (id: string) => url(`/seller/products/${id}/files`),
  DELETE_FILE:   (id: string, fileId: string) => url(`/seller/products/${id}/files/${fileId}`),
  BULK_ACTION:   url('/seller/products/bulk'),
} as const;

// ────────────────────────────────────────────────────────────────────────────
// SELLER — ORDERS
// ────────────────────────────────────────────────────────────────────────────
export const SELLER_ORDERS = {
  LIST:        url('/seller/orders'),
  DETAIL:      (id: string) => url(`/seller/orders/${id}`),
  FULFILL:     (id: string) => url(`/seller/orders/${id}/fulfill`),
  CANCEL:      (id: string) => url(`/seller/orders/${id}/cancel`),
  REFUND:      (id: string) => url(`/seller/orders/${id}/refund`),
  ADD_NOTE:    (id: string) => url(`/seller/orders/${id}/notes`),
  EXPORT_CSV:  url('/seller/orders/export'),
  BULK_FULFILL: url('/seller/orders/bulk-fulfill'),
} as const;

// ────────────────────────────────────────────────────────────────────────────
// SELLER — INVENTORY
// ────────────────────────────────────────────────────────────────────────────
export const SELLER_INVENTORY = {
  LIST:         url('/seller/inventory'),
  UPDATE_STOCK: (productId: string) => url(`/seller/inventory/${productId}/stock`),
  BULK_UPDATE:  url('/seller/inventory/bulk'),
  IMPORT_CSV:   url('/seller/inventory/import'),
  EXPORT_CSV:   url('/seller/inventory/export'),
  LOW_STOCK:    url('/seller/inventory/low-stock'),
} as const;

// ────────────────────────────────────────────────────────────────────────────
// SELLER — ANALYTICS
// ────────────────────────────────────────────────────────────────────────────
export const SELLER_ANALYTICS = {
  OVERVIEW:          url('/seller/analytics/overview'),
  REVENUE_CHART:     url('/seller/analytics/revenue'),
  ORDERS_CHART:      url('/seller/analytics/orders'),
  TRAFFIC_SOURCES:   url('/seller/analytics/traffic'),
  TOP_PRODUCTS:      url('/seller/analytics/top-products'),
  CONVERSION_FUNNEL: url('/seller/analytics/conversion'),
  EXPORT_PDF:        url('/seller/analytics/export'),
} as const;

// ────────────────────────────────────────────────────────────────────────────
// SELLER — CUSTOMERS
// ────────────────────────────────────────────────────────────────────────────
export const SELLER_CUSTOMERS = {
  LIST:          url('/seller/customers'),
  DETAIL:        (id: string) => url(`/seller/customers/${id}`),
  ORDERS:        (id: string) => url(`/seller/customers/${id}/orders`),
  EMAIL:         (id: string) => url(`/seller/customers/${id}/email`),
  LOYALTY_GIFT:  (id: string) => url(`/seller/customers/${id}/loyalty-gift`),
  EXPORT_CSV:    url('/seller/customers/export'),
  ADD:           url('/seller/customers'),
} as const;

// ────────────────────────────────────────────────────────────────────────────
// SELLER — POS (Point of Sale)
// ────────────────────────────────────────────────────────────────────────────
export const SELLER_POS = {
  PRODUCTS:          url('/seller/pos/products'),
  CREATE_TRANSACTION: url('/seller/pos/transactions'),
  TRANSACTIONS:      url('/seller/pos/transactions'),
  TRANSACTION_DETAIL: (id: string) => url(`/seller/pos/transactions/${id}`),
  VOID_TRANSACTION:  (id: string) => url(`/seller/pos/transactions/${id}/void`),
  REFUND:            (id: string) => url(`/seller/pos/transactions/${id}/refund`),
  EMAIL_RECEIPT:     (id: string) => url(`/seller/pos/transactions/${id}/email-receipt`),
  PRINT_RECEIPT:     (id: string) => url(`/seller/pos/transactions/${id}/print-receipt`),
  HELD_SALES:        url('/seller/pos/held-sales'),
  SAVE_HELD:         url('/seller/pos/held-sales'),
  RESTORE_HELD:      (id: string) => url(`/seller/pos/held-sales/${id}/restore`),
  DELETE_HELD:       (id: string) => url(`/seller/pos/held-sales/${id}`),
  SHIFT_OPEN:        url('/seller/pos/shift/open'),
  SHIFT_CLOSE:       url('/seller/pos/shift/close'),
  SHIFT_SUMMARY:     url('/seller/pos/shift/summary'),
  APPLY_COUPON:      url('/seller/pos/coupon'),
  CUSTOMERS:         url('/seller/pos/customers'),
} as const;

// ────────────────────────────────────────────────────────────────────────────
// SELLER — AI STUDIO
// ────────────────────────────────────────────────────────────────────────────
export const SELLER_AI = {
  CREDITS:            url('/seller/ai/credits'),
  GENERATE_LISTING:   url('/seller/ai/listing'),
  OPTIMIZE_PRICE:     url('/seller/ai/pricing'),
  GENERATE_WORKSHEET: url('/seller/ai/worksheet'),
  SEO_BOOST:          url('/seller/ai/seo'),
  EMAIL_CAMPAIGN:     url('/seller/ai/email'),
  ENHANCE_IMAGE:      url('/seller/ai/image'),
  BUY_CREDITS:        url('/seller/ai/credits/purchase'),
  USAGE_HISTORY:      url('/seller/ai/usage'),
} as const;

// ────────────────────────────────────────────────────────────────────────────
// SELLER — MARKETING
// ────────────────────────────────────────────────────────────────────────────
export const SELLER_MARKETING = {
  // Coupons
  COUPONS:            url('/seller/marketing/coupons'),
  CREATE_COUPON:      url('/seller/marketing/coupons'),
  COUPON_DETAIL:      (id: string) => url(`/seller/marketing/coupons/${id}`),
  UPDATE_COUPON:      (id: string) => url(`/seller/marketing/coupons/${id}`),
  DELETE_COUPON:      (id: string) => url(`/seller/marketing/coupons/${id}`),
  PAUSE_COUPON:       (id: string) => url(`/seller/marketing/coupons/${id}/pause`),

  // Email Campaigns
  EMAIL_CAMPAIGNS:    url('/seller/marketing/email-campaigns'),
  CREATE_CAMPAIGN:    url('/seller/marketing/email-campaigns'),
  CAMPAIGN_DETAIL:    (id: string) => url(`/seller/marketing/email-campaigns/${id}`),
  UPDATE_CAMPAIGN:    (id: string) => url(`/seller/marketing/email-campaigns/${id}`),
  DELETE_CAMPAIGN:    (id: string) => url(`/seller/marketing/email-campaigns/${id}`),
  SEND_CAMPAIGN:      (id: string) => url(`/seller/marketing/email-campaigns/${id}/send`),
  CAMPAIGN_STATS:     (id: string) => url(`/seller/marketing/email-campaigns/${id}/stats`),

  // Abandoned Cart
  ABANDONED_CARTS:    url('/seller/marketing/abandoned-carts'),
  RECOVER_CART:       (id: string) => url(`/seller/marketing/abandoned-carts/${id}/recover`),

  // Affiliate
  AFFILIATES:         url('/seller/marketing/affiliates'),
  AFFILIATE_STATS:    url('/seller/marketing/affiliates/stats'),

  // Gift Cards
  GIFT_CARDS:         url('/seller/marketing/gift-cards'),
  CREATE_GIFT_CARD:   url('/seller/marketing/gift-cards'),
  GIFT_CARD_DETAIL:   (id: string) => url(`/seller/marketing/gift-cards/${id}`),
} as const;

// ────────────────────────────────────────────────────────────────────────────
// SELLER — STORE BUILDER
// ────────────────────────────────────────────────────────────────────────────
export const SELLER_STORE = {
  GET:              url('/seller/store'),
  UPDATE:           url('/seller/store'),
  PUBLISH:          url('/seller/store/publish'),
  UPLOAD_LOGO:      url('/seller/store/logo'),
  UPLOAD_BANNER:    url('/seller/store/banner'),
  THEMES:           url('/seller/store/themes'),
  PREVIEW_URL:      url('/seller/store/preview-url'),
  CUSTOM_DOMAIN:    url('/seller/store/domain'),
  VERIFY_DOMAIN:    url('/seller/store/domain/verify'),
} as const;

// ────────────────────────────────────────────────────────────────────────────
// SELLER — CATEGORIES
// ────────────────────────────────────────────────────────────────────────────
export const SELLER_CATEGORIES = {
  LIST:         url('/seller/categories'),
  CREATE:       url('/seller/categories'),
  UPDATE:       (id: string) => url(`/seller/categories/${id}`),
  DELETE:       (id: string) => url(`/seller/categories/${id}`),
  REORDER:      url('/seller/categories/reorder'),
  SUBCATEGORIES:       (catId: string) => url(`/seller/categories/${catId}/subcategories`),
  CREATE_SUBCATEGORY:  (catId: string) => url(`/seller/categories/${catId}/subcategories`),
  UPDATE_SUBCATEGORY:  (catId: string, subId: string) => url(`/seller/categories/${catId}/subcategories/${subId}`),
  DELETE_SUBCATEGORY:  (catId: string, subId: string) => url(`/seller/categories/${catId}/subcategories/${subId}`),
} as const;

// ────────────────────────────────────────────────────────────────────────────
// SELLER — SETTINGS
// ────────────────────────────────────────────────────────────────────────────
export const SELLER_SETTINGS = {
  GET:                url('/seller/settings'),
  UPDATE_PROFILE:     url('/seller/settings/profile'),
  UPDATE_STORE:       url('/seller/settings/store'),
  UPDATE_PAYMENTS:    url('/seller/settings/payments'),
  UPDATE_SHIPPING:    url('/seller/settings/shipping'),
  UPDATE_NOTIFICATIONS: url('/seller/settings/notifications'),
  UPDATE_PASSWORD:    url('/seller/settings/password'),
  ENABLE_2FA:         url('/seller/settings/2fa/enable'),
  DISABLE_2FA:        url('/seller/settings/2fa/disable'),
  UPLOAD_AVATAR:      url('/seller/settings/avatar'),
  DELETE_ACCOUNT:     url('/seller/settings/account'),
  STAFF_MEMBERS:      url('/seller/settings/staff'),
  INVITE_STAFF:       url('/seller/settings/staff/invite'),
  REMOVE_STAFF:       (id: string) => url(`/seller/settings/staff/${id}`),
  PAYOUTS:            url('/seller/settings/payouts'),
  UPDATE_PAYOUT:      url('/seller/settings/payouts'),
  TAX_SETTINGS:       url('/seller/settings/tax'),
} as const;

// ────────────────────────────────────────────────────────────────────────────
// SELLER — FINANCE
// ────────────────────────────────────────────────────────────────────────────
export const SELLER_FINANCE = {
  BALANCE:         url('/seller/finance/balance'),
  PAYOUTS:         url('/seller/finance/payouts'),
  REQUEST_PAYOUT:  url('/seller/finance/payouts/request'),
  TRANSACTIONS:    url('/seller/finance/transactions'),
  INVOICE:         (id: string) => url(`/seller/finance/invoices/${id}`),
  EXPORT:          url('/seller/finance/export'),
} as const;

// ────────────────────────────────────────────────────────────────────────────
// ADMIN
// ────────────────────────────────────────────────────────────────────────────
export const ADMIN = {
  // Overview
  OVERVIEW_STATS:      url('/admin/overview/stats'),
  OVERVIEW_CHARTS:     url('/admin/overview/charts'),

  // Users & Sellers
  USERS:               url('/admin/users'),
  USER_DETAIL:         (id: string) => url(`/admin/users/${id}`),
  UPDATE_USER_STATUS:  (id: string) => url(`/admin/users/${id}/status`),
  SUSPEND_USER:        (id: string) => url(`/admin/users/${id}/suspend`),
  DELETE_USER:         (id: string) => url(`/admin/users/${id}`),
  SELLERS:             url('/admin/sellers'),
  SELLER_DETAIL:       (id: string) => url(`/admin/sellers/${id}`),
  VERIFY_SELLER:       (id: string) => url(`/admin/sellers/${id}/verify`),
  SUSPEND_SELLER:      (id: string) => url(`/admin/sellers/${id}/suspend`),

  // Moderation
  MODERATION_QUEUE:    url('/admin/moderation'),
  MODERATION_DETAIL:   (id: string) => url(`/admin/moderation/${id}`),
  APPROVE_ITEM:        (id: string) => url(`/admin/moderation/${id}/approve`),
  REJECT_ITEM:         (id: string) => url(`/admin/moderation/${id}/reject`),
  REMOVE_LISTING:      (id: string) => url(`/admin/moderation/${id}/remove`),
  FLAG_STATS:          url('/admin/moderation/stats'),

  // Marketplace
  MARKETPLACE_PRODUCTS: url('/admin/marketplace/products'),
  MARKETPLACE_CATEGORIES: url('/admin/marketplace/categories'),
  FEATURE_PRODUCT:     (id: string) => url(`/admin/marketplace/products/${id}/feature`),
  REMOVE_PRODUCT:      (id: string) => url(`/admin/marketplace/products/${id}`),

  // Finance
  FINANCE_OVERVIEW:    url('/admin/finance/overview'),
  FINANCE_PAYOUTS:     url('/admin/finance/payouts'),
  APPROVE_PAYOUT:      (id: string) => url(`/admin/finance/payouts/${id}/approve`),
  REJECT_PAYOUT:       (id: string) => url(`/admin/finance/payouts/${id}/reject`),
  PLATFORM_REVENUE:    url('/admin/finance/platform-revenue'),

  // Announcements
  ANNOUNCEMENTS:       url('/admin/announcements'),
  CREATE_ANNOUNCEMENT: url('/admin/announcements'),
  UPDATE_ANNOUNCEMENT: (id: string) => url(`/admin/announcements/${id}`),
  DELETE_ANNOUNCEMENT: (id: string) => url(`/admin/announcements/${id}`),
  PUBLISH_ANNOUNCEMENT:(id: string) => url(`/admin/announcements/${id}/publish`),

  // Platform Config
  CONFIG:              url('/admin/config'),
  UPDATE_CONFIG:       url('/admin/config'),
  MAINTENANCE_MODE:    url('/admin/config/maintenance'),
  FEATURE_FLAGS:       url('/admin/config/features'),
  UPDATE_FEATURE_FLAG: (key: string) => url(`/admin/config/features/${key}`),
  AI_CONFIG:           url('/admin/config/ai'),
  EMAIL_CONFIG:        url('/admin/config/email'),
} as const;

// ────────────────────────────────────────────────────────────────────────────
// UPLOAD (shared)
// ────────────────────────────────────────────────────────────────────────────
export const UPLOAD = {
  IMAGE:    url('/upload/image'),
  FILE:     url('/upload/file'),
  AVATAR:   url('/upload/avatar'),
  BANNER:   url('/upload/banner'),
} as const;

// ────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ────────────────────────────────────────────────────────────────────────────
export const NOTIFICATIONS = {
  LIST:       url('/notifications'),
  MARK_READ:  (id: string) => url(`/notifications/${id}/read`),
  MARK_ALL:   url('/notifications/read-all'),
  DELETE:     (id: string) => url(`/notifications/${id}`),
  PREFERENCES: url('/notifications/preferences'),
} as const;
