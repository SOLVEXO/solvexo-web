import client from './client';
import { ENDPOINTS } from './endpoints';

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN STORAGE
// ─────────────────────────────────────────────────────────────────────────────
export const TokenStorage = {
  save(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken',  accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },
  saveUser(user: object) {
    localStorage.setItem('user', JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('authCtx');
  },
  getToken()     { return localStorage.getItem('accessToken'); },
  getRefresh()   { return localStorage.getItem('refreshToken'); },
  getUser<T = Record<string, unknown>>(): T | null {
    const u = localStorage.getItem('user');
    return u ? (JSON.parse(u) as T) : null;
  },
  isLoggedIn()   { return !!localStorage.getItem('accessToken'); },
};

// ─────────────────────────────────────────────────────────────────────────────
// ROLE-BASED REDIRECT
// ─────────────────────────────────────────────────────────────────────────────
export type AppRole = 'user' | 'seller' | 'admin';

export function getRoleRedirect(role: AppRole): string {
  switch (role) {
    case 'admin':  return '/admin';
    case 'seller': return '/onboarding';
    default:       return '/marketplace';       // "user" / buyer
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH CONTEXT  (sessionStorage — survives between pages, clears on tab close)
// ─────────────────────────────────────────────────────────────────────────────
export interface AuthCtx {
  email:   string;
  role:    AppRole;
  userId?: string;
  flow?:   'register' | 'forgot';
}

export const AuthContext = {
  set(data: AuthCtx) {
    sessionStorage.setItem('authCtx', JSON.stringify(data));
  },
  get(): AuthCtx | null {
    const s = sessionStorage.getItem('authCtx');
    return s ? (JSON.parse(s) as AuthCtx) : null;
  },
  clear() { sessionStorage.removeItem('authCtx'); },
};

// ─────────────────────────────────────────────────────────────────────────────
// API TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data:    T;
}

export interface RegisterPayload {
  name:     string;
  email:    string;
  password: string;
  phone:    string;
  address:  string;
  role:     AppRole;
}
interface RegisterData { userId: string; otp?: string }

export interface LoginPayload {
  email:    string;
  password: string;
  role:     AppRole;
}
interface LoginUser   { id: string; name: string; email: string; role: AppRole; image: string | null }
interface AuthTokens  { accessToken: string; refreshToken: string }
interface LoginData   { user: LoginUser; token: AuthTokens }

export interface VerifyOtpPayload { email: string; role: AppRole; otp: string }
interface VerifyOtpUser { id: string; name: string; email: string; phone: string; address: string }
interface VerifyOtpData { user: VerifyOtpUser; token: AuthTokens }

export interface ForgotPayload  { email: string; role: AppRole }
interface ForgotData            { userId: string; otp?: string }

export interface ResetPayload   { email: string; role: AppRole; otp: string; newPassword: string }

// ─────────────────────────────────────────────────────────────────────────────
// AUTH API FUNCTIONS  (all use Axios client → base URL from .env)
// ─────────────────────────────────────────────────────────────────────────────

/** POST /auth/register — sends OTP to email */
export function apiRegister(payload: RegisterPayload) {
  return client.post<never, ApiResponse<RegisterData>>(ENDPOINTS.AUTH.REGISTER, payload);
}

/** POST /auth/login — returns user + tokens */
export function apiLogin(payload: LoginPayload) {
  return client.post<never, ApiResponse<LoginData>>(ENDPOINTS.AUTH.LOGIN, payload);
}

/** POST /auth/verifyOtp — verifies OTP after register, returns tokens */
export function apiVerifyOtp(payload: VerifyOtpPayload) {
  return client.post<never, ApiResponse<VerifyOtpData>>(ENDPOINTS.AUTH.VERIFY_OTP, payload);
}

/** POST /auth/forgot-password — sends OTP for password reset */
export function apiForgotPassword(payload: ForgotPayload) {
  return client.post<never, ApiResponse<ForgotData>>(ENDPOINTS.AUTH.FORGOT_PASSWORD, payload);
}

/** POST /auth/reset-password — verifies OTP + changes password in ONE call */
export function apiResetPassword(payload: ResetPayload) {
  return client.post<never, ApiResponse<Record<string, never>>>(ENDPOINTS.AUTH.RESET_PASSWORD, payload);
}

