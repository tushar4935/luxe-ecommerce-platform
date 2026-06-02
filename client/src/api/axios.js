import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  withCredentials: true, // send/receive the httpOnly refresh cookie
});

// ── Access token kept in memory (set by AuthContext) ────────────────────
let accessToken = null;
export const setAccessToken = (token) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

// Attach the bearer token to every request
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ── Silent refresh on 401 ───────────────────────────────────────────────
let isRefreshing = false;
let queue = [];

const processQueue = (error, token = null) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
};

// Allow AuthContext to register a logout handler used when refresh fails.
let onAuthFailure = () => {};
export const setAuthFailureHandler = (fn) => {
  onAuthFailure = fn;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url || '';

    // Don't try to refresh for the auth endpoints themselves.
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh-token');

    if (status === 401 && !original._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Queue requests while a refresh is in flight
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh-token');
        setAccessToken(data.accessToken);
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        onAuthFailure();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Normalize server error messages for the UI
export const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.errors?.[0]?.message ||
  error?.message ||
  'Something went wrong';

export default api;
