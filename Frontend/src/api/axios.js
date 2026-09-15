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

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Try to refresh token
        const res = await axios.post(
          `${resolveApiBaseUrl()}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        if (res.data && res.data.data && res.data.data.accessToken) {
          const newAccessToken = res.data.data.accessToken;
          localStorage.setItem('token', newAccessToken);
          // Update the original request's authorization header
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.warn("Session expired. Logging out.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    // If not a 401 or refresh failed, reject standard
    return Promise.reject(error);
  }
);

export default api;
