// ── API Endpoints ─────────────────────────────────────────────────────────────
// All endpoint paths in one place.
// Base URL is loaded from VITE_API_URL in .env via the Axios client.
// ─────────────────────────────────────────────────────────────────────────────

// import { ADMIN_NAV_ITEMS } from "@/constants/tokens";
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

  // BUYER: {
    
  // }

  // ── SELLER — DASHBOARD ────────────────────────────────────────────────────
  SELLER: {
    // ── STORE ─────────────────────────────────────────────────────────────────
    CREATE:     '/api/store/create-store',
    UPDATE:     '/api/store/update-store',
    GET_BY_ID:  (id: string) => `/api/store/getStoreById/${id}`,
    MY_STORES:  '/api/store/my-stores',             

    // ── PRODUCT ─────────────────────────────────────────────────────────────────
    CREATE_PHYSICAL_PRODUCT:     '/api/products/add-physical-product',
    CREATE_DIGITAL:     '/api/products/add-digital-product',
    EDIT_PHYSICAL:       '/api/products/edit-product',
    EDIT_DIGITAL:       '/api/products/edit-digital-product',
    // GET_MY_PRODUCT: (id: string) => `/api/products/get-my-product`,
    GET_MY_PRODUCT: (id: string) => `/api/products/get-my-product/${id}`,

  }

  // ADMIN: {
    
  // }

} as const;
