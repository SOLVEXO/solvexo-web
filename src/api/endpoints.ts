// ── API Endpoints ─────────────────────────────────────────────────────────────
// All endpoint paths in one place.
// Base URL is loaded from VITE_API_URL in .env via the Axios client.
// ─────────────────────────────────────────────────────────────────────────────

export const ENDPOINTS = {

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
  },

  // ── ADDRESS ────────────────────────────────────────────────────────────────
  ADDRESS: {
    ADD: '/address/add-address',
    GET_ALL: '/address/getMyAddresses',
    GET_DEFAULT: '/address/getDefaultAddress',
    UPDATE: '/address/update-address',
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

} as const;
