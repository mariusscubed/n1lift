import axios from 'axios';
import Constants from 'expo-constants';
import { useUserStore } from '../store/userStore';

const BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

/**
 * Axios instance pre-configured with the backend base URL.
 * Automatically attaches the JWT Bearer token from the Zustand store.
 */
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = useUserStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useUserStore.getState().logout();
    }
    return Promise.reject(err);
  }
);

export default api;
