import axios from 'axios';
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearAllTokens,
} from '../utils/tokenStorage';

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '');
const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Flag and queue to manage concurrent token refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach in-memory JWT Access Token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Transparent JWT Refresh & Concurrency Guard
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Reject immediately if no response or not a 401
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // Bypass refresh logic for authentication endpoints to prevent recursion
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login/') ||
      originalRequest.url?.includes('/auth/register/') ||
      originalRequest.url?.includes('/auth/token/refresh/');

    if (isAuthEndpoint || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAllTokens();
      window.dispatchEvent(new CustomEvent('campusxplore:auth-expired'));
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/token/refresh/`,
        { refresh: refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const newAccessToken = response.data.access;
      setAccessToken(newAccessToken);

      // SimpleJWT may rotate the refresh token if configured
      if (response.data.refresh) {
        setRefreshToken(response.data.refresh);
      }

      processQueue(null, newAccessToken);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAllTokens();
      window.dispatchEvent(new CustomEvent('campusxplore:auth-expired'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
