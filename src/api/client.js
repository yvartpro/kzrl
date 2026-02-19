import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/kzrl/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    // Force absolute root path if no protocol to ensure it hits the Vite proxy
    if (config.url && !config.url.startsWith('http') && !config.url.startsWith('/')) {
      config.url = '/' + config.url;
    }

    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
      hasToken: !!token,
      headers: config.headers
    });

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      window.location.href = '/kzrl/login';
    }
    return Promise.reject(error);
  }
);

export default api;
