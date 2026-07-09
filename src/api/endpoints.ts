// ── API Endpoints ─────────────────────────────────────────────────────────────
// All endpoint paths in one place.
// Base URL is loaded from VITE_API_URL in .env via the Axios client.
// ─────────────────────────────────────────────────────────────────────────────

export const ENDPOINTS = {

  // ── USERS (self-service account management) ──────────────────────────────
  USERS: {
    CHANGE_PASSWORD: '/api/users/change-password',
    DELETE_ACCOUNT:  '/api/users/profile',
  },

  // ── AUTH ───────────────────────────────────────────────────────────────────
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    VERIFY_OTP: '/api/auth/verifyOtp',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    REFRESH_TOKEN: '/api/auth/refresh',
    GET_PROFILE: '/api/auth/getprofile',
    EDIT_PROFILE: '/api/auth/edit-profile',
    RESEND_OTP: '/api/auth/resend-otp',
  },

  // ── CATEGORIES ────────────────────────────────────────────────────────────
  CATEGORIES: {
    ADD:       '/api/categories/add-category',
    TREE:      '/api/categories/category-tree',
    GET_BY_ID: (id: string) => `/api/categories/category/${id}`,
  },

  // ── STORE ─────────────────────────────────────────────────────────────────
  STORE: {
    CREATE: '/api/store/create-store',
    UPDATE: '/api/store/update-store',
    GET_BY_ID: (id: string) => `/api/store/getStoreById/${id}`,
    MY_STORES: '/api/store/my-stores',

    // Builder
    SAVE_BUILDER_CONFIG: '/api/store/save-builder-config',
    GET_BUILDER_CONFIG: (storeId: string) => `/api/store/builder-config/${storeId}`,

    // Public storefront
    PUBLIC_BY_SLUG: (slug: string) => `/api/store/public/${slug}`,
    PUBLIC_PRODUCTS: (storeId: string) => `/api/store/public/${storeId}/products`,
    PUBLIC_FILTERS:  (storeId: string) => `/api/store/public/${storeId}/filters`,

    // Follow
    FOLLOW: (storeId: string) => `/api/store/${storeId}/follow`,
    FOLLOW_STATUS: (storeId: string) => `/api/store/${storeId}/follow-status`,
    FOLLOWERS: (storeId: string) => `/api/store/${storeId}/followers`,

    // Customers (staff-facing — only people who ordered from this store)
    CUSTOMERS: {
      LIST:   (storeId: string) => `/api/store/${storeId}/customers`,
      UPDATE: (storeId: string, customerId: string) => `/api/store/${storeId}/customers/${customerId}`,
    },
  },

  // ── ACTIVITY LOG ──────────────────────────────────────────────────────────
  ACTIVITY_LOG: {
    LIST:   (storeId: string) => `/api/activity-log/${storeId}`,
    STATS:  (storeId: string) => `/api/activity-log/${storeId}/stats`,
    EXPORT: (storeId: string) => `/api/activity-log/${storeId}/export`,
  },

  // ── SUBSCRIPTIONS ─────────────────────────────────────────────────────────
  SUBSCRIPTIONS: {
    // Buyer
    BROWSE_PLANS: (storeId: string) => `/api/subscriptions/public/${storeId}/plans`,
    SUBSCRIBE:    '/api/subscriptions/subscribe',
    MY:           '/api/subscriptions/my',
    MY_BY_ID:     (id: string) => `/api/subscriptions/my/${id}`,
    MY_PAUSE:     (id: string) => `/api/subscriptions/my/${id}/pause`,
    MY_RESUME:    (id: string) => `/api/subscriptions/my/${id}/resume`,
    MY_CANCEL:    (id: string) => `/api/subscriptions/my/${id}/cancel`,
    MY_CHANGE_PLAN: (id: string) => `/api/subscriptions/my/${id}/change-plan`,

    // Seller (store-scoped)
    PLANS: {
      CREATE:    (storeId: string) => `/api/subscriptions/${storeId}/plans`,
      LIST:      (storeId: string) => `/api/subscriptions/${storeId}/plans`,
      GET_BY_ID: (storeId: string, id: string) => `/api/subscriptions/${storeId}/plans/${id}`,
      UPDATE:    (storeId: string, id: string) => `/api/subscriptions/${storeId}/plans/${id}`,
      ARCHIVE:   (storeId: string, id: string) => `/api/subscriptions/${storeId}/plans/${id}`,
      ESTIMATE_HEALTH: (storeId: string) => `/api/subscriptions/${storeId}/plans/estimate-health`,
    },
    DASHBOARD:   (storeId: string) => `/api/subscriptions/${storeId}/dashboard`,
    EXPORT:      (storeId: string) => `/api/subscriptions/${storeId}/export`,
    SUBSCRIBERS: {
      LIST:      (storeId: string) => `/api/subscriptions/${storeId}/subscribers`,
      GET_BY_ID: (storeId: string, id: string) => `/api/subscriptions/${storeId}/subscribers/${id}`,
      PAUSE:     (storeId: string, id: string) => `/api/subscriptions/${storeId}/subscribers/${id}/pause`,
      RESUME:    (storeId: string, id: string) => `/api/subscriptions/${storeId}/subscribers/${id}/resume`,
      CANCEL:    (storeId: string, id: string) => `/api/subscriptions/${storeId}/subscribers/${id}/cancel`,
    },

    // Admin
    ADMIN: {
      OVERVIEW:          '/api/subscriptions/admin/overview',
      STORES:            '/api/subscriptions/admin/stores',
      STORE_DETAIL:      (storeId: string) => `/api/subscriptions/admin/stores/${storeId}`,
      SUSPEND_PLAN:      (id: string) => `/api/subscriptions/admin/plans/${id}/suspend`,
      UNSUSPEND_PLAN:    (id: string) => `/api/subscriptions/admin/plans/${id}/unsuspend`,
      PAYMENT_FAILURES:  '/api/subscriptions/admin/payment-failures',
      SUB_DETAIL:        (id: string) => `/api/subscriptions/admin/subscriptions/${id}`,
      SUB_PAYMENT_ATTEMPTS: (id: string) => `/api/subscriptions/admin/subscriptions/${id}/payment-attempts`,
    },
  },

  // ── MARKETING ─────────────────────────────────────────────────────────────
  MARKETING: {
    COUPONS: {
      CREATE: (storeId: string) => `/api/marketing/${storeId}/coupons`,
      LIST:   (storeId: string) => `/api/marketing/${storeId}/coupons`,
      UPDATE: (storeId: string, couponId: string) => `/api/marketing/${storeId}/coupons/${couponId}`,
      DELETE: (storeId: string, couponId: string) => `/api/marketing/${storeId}/coupons/${couponId}`,
    },
  },

  // ── LOYALTY & REWARDS ─────────────────────────────────────────────────────
  LOYALTY: {
    OVERVIEW:      (storeId: string) => `/api/loyalty/${storeId}/overview`,
    PROGRAM:       (storeId: string) => `/api/loyalty/${storeId}/program`,
    EARNING_RULES: (storeId: string) => `/api/loyalty/${storeId}/earning-rules`,
    TIERS:         (storeId: string) => `/api/loyalty/${storeId}/tiers`,
    MEMBERS:       (storeId: string) => `/api/loyalty/${storeId}/members`,
    MEMBER_TRANSACTIONS: (storeId: string, memberId: string) => `/api/loyalty/${storeId}/members/${memberId}/transactions`,
    AWARD_POINTS:  (storeId: string, memberId: string) => `/api/loyalty/${storeId}/members/${memberId}/award`,
    REWARDS: {
      CREATE: (storeId: string) => `/api/loyalty/${storeId}/rewards`,
      LIST:   (storeId: string) => `/api/loyalty/${storeId}/rewards`,
      UPDATE: (storeId: string, rewardId: string) => `/api/loyalty/${storeId}/rewards/${rewardId}`,
      DELETE: (storeId: string, rewardId: string) => `/api/loyalty/${storeId}/rewards/${rewardId}`,
    },
    MY_BALANCE: (storeId: string) => `/api/loyalty/${storeId}/my-balance`,
    REDEEM:     (storeId: string) => `/api/loyalty/${storeId}/redeem`,
  },

  PRODUCT: {
    CREATE_PHYSICAL: '/api/products/add-physical-product',
    CREATE_DIGITAL: '/api/products/add-digital-product',
    EDIT_PRODUCT: '/api/products/edit-product',
    GET_MY_ALL_PRODUCT: (id: string) => `/api/inventory/getStoreInventory/${id}`,
    GET_MY_PRODUCT_BY_ID: (id: string) => `/api/products/get-my-product/${id}`,
  },

  // ── MARKETPLACE ───────────────────────────────────────────────────────────
  MARKETPLACE: {
    PRODUCTS_BY_CATEGORY: `/api/products/products-by-category`,
    PRODUCT_BY_ID: (id: string) => `/api/products/getProductById/${id}`,
  },

  // ── CART ──────────────────────────────────────────────────────────────────
  CART: {
    ADD: '/api/cart/add-to-cart',
    GET: '/api/cart/get-cart',
    UPDATE_QUANTITY: '/api/cart/update-cart-quantity',
    REMOVE_ITEM: '/api/cart/remove-cart-item',
    CLEAR: '/api/cart/clear-cart',
  },

  // ── WISHLIST ───────────────────────────────────────────────────────────────
  WISHLIST: {
    ADD: '/api/cart/add-to-wishlist',
    GET: '/api/cart/get-wishlist',
    GET_ITEM: '/api/cart/get-wishlist-item',
    REMOVE: '/api/cart/remove-from-wishlist',
    CLEAR: '/api/cart/clear-wishlist',
  },

  // ── ADDRESS ────────────────────────────────────────────────────────────────
  ADDRESS: {
    ADD: '/address/add-address',
    GET_ALL: '/address/getMyAddresses',
    GET_DEFAULT: '/address/getDefaultAddress',
    UPDATE: '/address/update-address',
    GET_BY_ID: (addressId: string) => `/address/get-address-by-id/${addressId}`,
    SET_DEFAULT: (addressId: string) => `/address/setDefaultAddress/${addressId}`,
    DELETE: (addressId: string) => `/address/delete-address/${addressId}`,
  },

  SHIPPING: {
    GET_SHIPPING_ZONES: '/api/checkout/getShippingZones',
  },

  CHECKOUT: {
    CREATE: '/api/checkout/create-checkout',
    ADD_SHIPPING_ZONE_IN_CHECKOUT: '/api/checkout/addShippingInCheckout',
    DELETE_CHECKOUT: '/api/checkout/delete-checkout', 
  },

  UPLOAD: {
    PUBLIC_FILE: '/api/upload/file',
    PRIVATE_FILE: '/api/upload/private-file',
  },

  INVENTORY: {
    GET_STORE_INVENTORY: (id: string) => `/api/inventory/getStoreInventory/${id}`,
  },

  SELLER_ACCOUNT: {
    GET_SELLER_ORDERS: (id: string) => `/api/orders/seller-orders/${id}`,
  },

  PAYMENT: {
    COD:         '/api/payment/cod-payment',
    PLACE_ORDER: '/api/payment/place-order',
  },

  ORDERS: {
    MARK_PAID:     (id: string) => `/api/orders/mark-paid/${id}`,
    UPDATE_STATUS: '/api/orders/update-status',
    DOWNLOAD_URL:  '/api/orders/download-url',

    MY_ORDERS:       '/api/orders/my-orders',
    GET_BY_ID:       (orderId: string) => `/api/orders/${orderId}`,
    CANCEL:          (orderId: string) => `/api/orders/cancel/${orderId}`,
    RETURN_REQUEST:  (orderId: string) => `/api/orders/return-request/${orderId}`,
    SELLER_RETURNS:  '/api/orders/returns',
    RETURN_ACTION:   (orderId: string) => `/api/orders/return-action/${orderId}`,
    GET_DOWNLOAD_LINK: '/api/orders/get-download-link',
    STREAM_PDF:        '/api/orders/stream-pdf',
  },

  // ── MESSAGING ─────────────────────────────────────────────────────────────
  MESSAGING: {
    CONVERSATIONS: {
      START:     '/api/messaging/conversations',
      LIST:      '/api/messaging/conversations',
      SEARCH:    '/api/messaging/conversations/search',
      GET_BY_ID: (id: string) => `/api/messaging/conversations/${id}`,
      ARCHIVE:   (id: string) => `/api/messaging/conversations/${id}/archive`,
      RESTORE:   (id: string) => `/api/messaging/conversations/${id}/restore`,
      PIN:       (id: string) => `/api/messaging/conversations/${id}/pin`,
      MUTE:      (id: string) => `/api/messaging/conversations/${id}/mute`,
      DELETE:    (id: string) => `/api/messaging/conversations/${id}`,
    },
    ATTACHMENTS: {
      UPLOAD: (conversationId: string) => `/api/messaging/conversations/${conversationId}/attachments`,
    },
    MESSAGES: {
      LIST:      (conversationId: string) => `/api/messaging/conversations/${conversationId}/messages`,
      SEND:      (conversationId: string) => `/api/messaging/conversations/${conversationId}/messages`,
      SEARCH:    (conversationId: string) => `/api/messaging/conversations/${conversationId}/messages/search`,
      EDIT:      (messageId: string) => `/api/messaging/messages/${messageId}`,
      DELETE:    (messageId: string) => `/api/messaging/messages/${messageId}`,
      MARK_SEEN: (messageId: string) => `/api/messaging/messages/${messageId}/seen`,
    },
    MODERATION: {
      BLOCK:   '/api/messaging/block',
      UNBLOCK: (targetId: string) => `/api/messaging/block/${targetId}`,
      REPORT:  '/api/messaging/report',
    },
    ADMIN: {
      LIST_CONVERSATIONS:     '/api/messaging/admin/conversations',
      GET_CONVERSATION_BY_ID: (id: string) => `/api/messaging/admin/conversations/${id}`,
      GET_REPORTS:            '/api/messaging/admin/reports',
    },
  },

  // ── POS ───────────────────────────────────────────────────────────────────
  POS: {
    PIN_LOGIN: '/api/pos/pin-login',

    EMPLOYEES: {
      CREATE:     '/api/pos/employees',
      LIST:       (storeId: string) => `/api/pos/employees/${storeId}`,
      GET_BY_ID:  (storeId: string, employeeId: string) => `/api/pos/employees/${storeId}/${employeeId}`,
      UPDATE:     (storeId: string, employeeId: string) => `/api/pos/employees/${storeId}/${employeeId}`,
      REMOVE:     (storeId: string, employeeId: string) => `/api/pos/employees/${storeId}/${employeeId}`,
      RESET_PIN:  (storeId: string, employeeId: string) => `/api/pos/employees/${storeId}/${employeeId}/reset-pin`,
    },

    REGISTERS: {
      ADD:       (storeId: string) => `/api/pos/registers/${storeId}`,
      LIST:      (storeId: string) => `/api/pos/registers/${storeId}`,
      GET_BY_ID: (storeId: string, registerId: string) => `/api/pos/registers/${storeId}/${registerId}`,
      UPDATE:    (storeId: string, registerId: string) => `/api/pos/registers/${storeId}/${registerId}`,
      REMOVE:    (storeId: string, registerId: string) => `/api/pos/registers/${storeId}/${registerId}`,
    },

    SHIFTS: {
      ADD:       (storeId: string) => `/api/pos/shifts/${storeId}`,
      LIST:      (storeId: string) => `/api/pos/shifts/${storeId}`,
      GET_BY_ID: (storeId: string, shiftId: string) => `/api/pos/shifts/${storeId}/${shiftId}`,
      UPDATE:    (storeId: string, shiftId: string) => `/api/pos/shifts/${storeId}/${shiftId}`,
      DELETE:    (storeId: string, shiftId: string) => `/api/pos/shifts/${storeId}/${shiftId}`,
    },

    PRODUCTS: {
      SEARCH:         '/api/pos/products/search',
      LIST:           (storeId: string) => `/api/pos/products/${storeId}`,
      GET_BY_BARCODE: (storeId: string, barcode: string) => `/api/pos/products/barcode/${storeId}/${barcode}`,
    },

    SESSIONS: {
      OPEN:            '/api/pos/sessions/open',
      CLOSE:           '/api/pos/sessions/close',
      ACTIVE:          '/api/pos/sessions/active',
      HISTORY:         '/api/pos/sessions/history',
      CASH_ADJUSTMENT: (sessionId: string) => `/api/pos/sessions/${sessionId}/cash-adjustment`,
      REPORT:          (sessionId: string) => `/api/pos/sessions/${sessionId}/report`,
      FORCE_CLOSE:     (sessionId: string) => `/api/pos/sessions/${sessionId}/force-close`,
    },

    SALES: {
      CREATE:      '/api/pos/sales',
      HELD:        '/api/pos/sales/held',
      LIST:        '/api/pos/sales',
      GET_BY_ID:   (saleId: string) => `/api/pos/sales/${saleId}`,
      COMPLETE:    (saleId: string) => `/api/pos/sales/${saleId}/complete`,
      REFUND:      (saleId: string) => `/api/pos/sales/${saleId}/refund`,
      DISCARD:     (saleId: string) => `/api/pos/sales/${saleId}/discard`,
      VOID:        (saleId: string) => `/api/pos/sales/${saleId}/void`,
      UPDATE_ITEMS:(saleId: string) => `/api/pos/sales/${saleId}/items`,
    },

    REPORTS: {
      DAILY:          '/api/pos/reports/daily',
      RANGE:          '/api/pos/reports/range',
      DAILY_EXPORT:   '/api/pos/reports/daily/export',
      REGISTER:       (registerId: string) => `/api/pos/reports/register/${registerId}`,
      EMPLOYEE:       (employeeId: string) => `/api/pos/reports/employee/${employeeId}`,
    },

    SETTINGS: {
      GET:    (storeId: string) => `/api/pos/settings/${storeId}`,
      UPDATE: (storeId: string) => `/api/pos/settings/${storeId}`,
    },

    AUDIT_LOGS: {
      LIST: (storeId: string) => `/api/pos/audit-logs/${storeId}`,
    },
  },

  // ── BANNERS ───────────────────────────────────────────────────────────────
  BANNER: {
    LIST:   '/api/banners',
    COUNT:  '/api/banners/count',
    CREATE: '/api/banners',
    UPLOAD: '/api/banners/upload',
    UPDATE: (id: string) => `/api/banners/${id}`,
    DELETE: (id: string) => `/api/banners/${id}`,
  },

  // ── FAQS ──────────────────────────────────────────────────────────────────
  FAQ: {
    LIST:       '/api/faqs',
    SEARCH:     '/api/faqs/search',
    CATEGORIES: '/api/faqs/categories',
    ADMIN_ALL:  '/api/faqs/admin/all',
    CREATE:     '/api/faqs',
    UPDATE:     (id: string) => `/api/faqs/${id}`,
    TOGGLE:     (id: string) => `/api/faqs/${id}/toggle`,
    DELETE:     (id: string) => `/api/faqs/${id}`,
  },

  // ── RATING / REVIEWS ──────────────────────────────────────────────────────
  // ── ANALYTICS ─────────────────────────────────────────────────────────────
  ANALYTICS: {
    SELLER: {
      OVERVIEW:             '/api/seller/analytics/overview',
      REVENUE_OVER_TIME:    '/api/seller/analytics/revenue-over-time',
      ORDERS_OVER_TIME:     '/api/seller/analytics/orders-over-time',
      TRAFFIC_SOURCES:      '/api/seller/analytics/traffic-sources',
      TOP_PRODUCTS:         '/api/seller/analytics/top-products',
      CUSTOMERS:            '/api/seller/analytics/customers',
      PRODUCTS_PERFORMANCE: '/api/seller/analytics/products/performance',
      INVENTORY_INSIGHTS:   '/api/seller/analytics/inventory-insights',
      PAYMENT_METHODS:      '/api/seller/analytics/payment-methods',
      REVENUE_BREAKDOWN:    '/api/seller/analytics/revenue-breakdown',
      EXPORT:               '/api/seller/analytics/export',
    },
    ADMIN: {
      OVERVIEW:                    '/api/admin/analytics/overview',
      REVENUE_OVER_TIME:           '/api/admin/analytics/revenue-over-time',
      REVENUE_BREAKDOWN:           '/api/admin/analytics/revenue-breakdown',
      SELLERS_TOP:                 '/api/admin/analytics/sellers/top',
      SELLERS_PERFORMANCE:         '/api/admin/analytics/sellers/performance',
      SELLERS_REGISTRATION_TRENDS: '/api/admin/analytics/sellers/registration-trends',
      CUSTOMERS:                   '/api/admin/analytics/customers',
      PRODUCTS_TOP:                '/api/admin/analytics/products/top',
      CATEGORIES_TOP:              '/api/admin/analytics/categories/top',
      PRODUCTS_PERFORMANCE:        '/api/admin/analytics/products/performance',
      INVENTORY_INSIGHTS:          '/api/admin/analytics/inventory-insights',
      ORDERS_OVER_TIME:            '/api/admin/analytics/orders-over-time',
      ORDERS_STATUS_BREAKDOWN:     '/api/admin/analytics/orders/status-breakdown',
      PAYMENTS_BREAKDOWN:          '/api/admin/analytics/payments/breakdown',
      PLATFORM_METRICS:            '/api/admin/analytics/platform-metrics',
      EXPORT:                      '/api/admin/analytics/export',
    },
  },

  // ── FINANCE ───────────────────────────────────────────────────────────────
  FINANCE: {
    ADMIN: {
      OVERVIEW:              '/api/admin/finance/overview',
      REVENUE_OVER_TIME:     '/api/admin/finance/revenue-over-time',
      COMMISSION_OVER_TIME:  '/api/admin/finance/commission-over-time',
      SELLER_BALANCES:       '/api/admin/finance/sellers/balances',
      SELLER_DETAIL:         (storeId: string) => `/api/admin/finance/sellers/${storeId}`,
      SELLER_TRANSACTIONS:   (storeId: string) => `/api/admin/finance/sellers/${storeId}/transactions`,
      MANUAL_PAYOUT:         (storeId: string) => `/api/admin/finance/sellers/${storeId}/payouts/manual`,
      TRANSACTIONS:          '/api/admin/finance/transactions',
      PAYOUT_QUEUE:          '/api/admin/finance/payouts',
      APPROVE_PAYOUT:        (payoutId: string) => `/api/admin/finance/payouts/${payoutId}/approve`,
      REJECT_PAYOUT:         (payoutId: string) => `/api/admin/finance/payouts/${payoutId}/reject`,
      RETRY_PAYOUT:          (payoutId: string) => `/api/admin/finance/payouts/${payoutId}/retry`,
      PROCESS_CLEARING:      '/api/admin/finance/process-clearing',
      REFUND_REPORT:         '/api/admin/finance/reports/refunds',
      TAX_REPORTS:           '/api/admin/finance/reports/tax',
      SETTLEMENT_REPORT:     '/api/admin/finance/reports/settlement',
      MONTHLY_REPORT:        '/api/admin/finance/reports/monthly',
      EXPORT:                '/api/admin/finance/export',
    },
  },

  RATING: {
    ADD_REVIEW:      '/api/rating/add-review',
    MY_REVIEWS:      '/api/rating/my-reviews',
    EDIT_REVIEW:     (reviewId: string) => `/api/rating/${reviewId}`,
    DELETE_REVIEW:   (reviewId: string) => `/api/rating/${reviewId}`,
    PRODUCT_REVIEWS: (productId: string) => `/api/rating/product/${productId}`,
    STORE_REVIEWS:   (storeId: string) => `/api/rating/store-reviews/${storeId}`,
    REPLY:           (reviewId: string) => `/api/rating/reply/${reviewId}`,
    EDIT_REPLY:      (reviewId: string) => `/api/rating/edit-reply/${reviewId}`,
    FLAG:            (reviewId: string) => `/api/rating/flag/${reviewId}`,
    UNFLAG:          (reviewId: string) => `/api/rating/unflag/${reviewId}`,
    MODERATE_DELETE: (reviewId: string) => `/api/rating/admin/${reviewId}`,
  },

} as const;
