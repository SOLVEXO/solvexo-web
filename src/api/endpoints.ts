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
  },

  PRODUCT: {
    CREATE_PHYSICAL: '/api/products/add-physical-product',
    CREATE_DIGITAL: '/api/products/add-digital-product',
    EDIT_PHYSICAL: (id: string) => `/api/products/edit-product${id}`,
    EDIT_DIGITAL: (id: string) => `/api/products/edit-product/${id}`,
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

} as const;
