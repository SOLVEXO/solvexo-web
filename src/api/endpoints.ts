// ── API Endpoints ─────────────────────────────────────────────────────────────
// All endpoint paths in one place.
// Base URL is loaded from VITE_API_URL in .env via the Axios client.
// ─────────────────────────────────────────────────────────────────────────────

// import { PRODUCT_TYPES } from "@/constants/tokens";
// import { Edit } from "lucide-react";

export const ENDPOINTS = {

  // ── AUTH ───────────────────────────────────────────────────────────────────
  AUTH: {
    REGISTER:        '/api/auth/register',
    LOGIN:           '/api/auth/login',
    VERIFY_OTP:      '/api/auth/verifyOtp',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD:  '/api/auth/reset-password',
    REFRESH_TOKEN:   '/api/auth/refresh',
    GET_PROFILE:     '/api/auth/getprofile',
  },

  // ── STORE ─────────────────────────────────────────────────────────────────
  STORE: {
    CREATE:     '/api/store/create-store',
    UPDATE:     '/api/store/update-store',
    GET_BY_ID:  (id: string) => `/api/store/getStoreById/${id}`,
    MY_STORES:  '/api/store/my-stores',
  },

  PRODUCT: {
    CREATE_PHYSICAL: '/api/product/create-physical-product',
    CREATE_DIGITAL:  '/api/product/create-digital-product',
    EDIT_PHYSICAL:   (id: string) => `/api/products/edit-product${id}`,
    EDIT_DIGITAL:    (id: string) => `/api/products/edit-product/${id}`,
    GET_MY_PRODUCT_BY_ID: (id: string) => `/api/products/get-my-product/${id}`,
  },

  // ── MARKETPLACE ───────────────────────────────────────────────────────────
  MARKETPLACE: {
    PRODUCTS_BY_CATEGORY: `/api/products/products-by-category`,
    PRODUCT_BY_ID: (id: string) => `/api/products/getProductById/${id}`,
  },

  // ── CART ──────────────────────────────────────────────────────────────────
  CART: {
    ADD:             '/api/cart/add-to-cart',
    GET:             '/api/cart/get-cart',
    UPDATE_QUANTITY: '/api/cart/update-cart-quantity',
    REMOVE_ITEM:     '/api/cart/remove-cart-item',
    CLEAR:           '/api/cart/clear-cart',
  },

} as const;
