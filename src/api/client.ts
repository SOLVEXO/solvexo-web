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

    return Promise.reject(new Error(msg));
  },
);

export default client;
