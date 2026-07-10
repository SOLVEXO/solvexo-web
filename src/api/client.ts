import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

// ── Axios instance ────────────────────────────────────────────────────────────
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ── Request interceptor — attach Bearer token automatically ───────────────────
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let browser set multipart/form-data boundary automatically for FormData
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  err => Promise.reject(err),
);

// ── Response interceptor — normalize errors, handle 401 ──────────────────────
client.interceptors.response.use(
  (res: AxiosResponse) => res.data,   // unwrap → caller gets { success, message, data }
  err => {
    const msg: string =
      err.response?.data?.message ||
      err.message ||
      'Something went wrong. Please try again.';

    // Session expired → force logout
    if (err.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('authCtx');
      window.location.href = '/login';
    }

    // `isNetworkError` distinguishes "the request never reached the server" (no
    // network, timeout, DNS failure — safe to retry/queue) from a real server
    // rejection (4xx/5xx — retrying with the same input will just fail again).
    // Existing call sites are unaffected: they only ever read `.message`.
    return Promise.reject(Object.assign(new Error(msg), {
      isNetworkError: !err.response,
      status: err.response?.status,
    }));
  },
);

export function isNetworkError(err: unknown): boolean {
  return err instanceof Error && (err as Error & { isNetworkError?: boolean }).isNetworkError === true;
}

export default client;
