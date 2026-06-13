import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add JWT authorization token
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

// Response interceptor: handles session expiration (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear credentials and force reload to auth pages if needed
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Check if not already on login/register pages
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register' && !path.startsWith('/reset-password')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getMediaUrl = (url) => {
  if (!url) return 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'; // safe CDN fallback
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  
  // Prepend backend port in dev, current host in prod
  const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;
  return `${backendUrl}${url}`;
};

export default api;
