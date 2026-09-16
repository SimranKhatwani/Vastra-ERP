import axios from 'axios';

const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return 'http://localhost:5001/api';
  const clean = envUrl.trim().replace(/\/+$/, '');
  if (clean.endsWith('/api') || clean.endsWith('/api/v1')) {
    return clean;
  }
  return `${clean}/api`;
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to identify public routes that don't need authentication tokens
const isPublicRoute = (url = '') => {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh-token') ||
    url.includes('/public/') ||
    url.includes('/billing/public/') ||
    url.includes('/pssm/public/') ||
    url.includes('/network-info')
  );
};

// Queue mechanism for handling simultaneous 401s cleanly
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (!isPublicRoute(config.url || '')) {
      // If user has no token and is requesting a protected resource,
      // cancel quietly before triggering a failing 401 HTTP network call
      const controller = new AbortController();
      config.signal = controller.signal;
      controller.abort('User unauthenticated - skipping request');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If request was aborted because unauthenticated, handle gracefully
    if (axios.isCancel(error) || error.message?.includes('User unauthenticated')) {
      return Promise.reject({ isAuthCancelled: true, message: 'Unauthenticated' });
    }

    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // If the 401 came from refresh-token or login itself, don't loop
      if (originalRequest.url?.includes('/auth/refresh-token') || originalRequest.url?.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${resolveApiBaseUrl()}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = res.data?.data?.accessToken;
        if (newAccessToken) {
          localStorage.setItem('token', newAccessToken);
          api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return api(originalRequest);
        } else {
          throw new Error('No access token returned from refresh');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
