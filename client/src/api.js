import axios from 'axios';

// Allow LAN testing (vite runs with --host 0.0.0.0): point at the same host that
// served the page, and let VITE_API_URL override this for deployment.
const host = window.location.hostname || 'localhost';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `${window.location.protocol}//${host}:5000/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('imovies_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('imovies_token');
      localStorage.removeItem('imovies_user');
      window.dispatchEvent(new Event('imovies:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export default api;
