import axios from 'axios';
import { queueOfflineAction } from '../pwa/offlineDB';
import toast from 'react-hot-toast';

let accessToken = '';

/**
 * Update the memory-stored access token
 * @param {string} token 
 */
export const setAccessToken = (token) => {
  accessToken = token;
};

/**
 * Retrieve the memory-stored access token
 * @returns {string}
 */
export const getAccessToken = () => {
  return accessToken;
};

const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // Bulletproof fallback for Vercel static deployments pointing to Render
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://ticketflow-33vf.onrender.com/api';
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true, // Crucial for receiving/sending httpOnly refresh cookies
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // If offline and attempting a write action (POST, PUT, DELETE), queue in IndexedDB
    if (!navigator.onLine && ['post', 'put', 'delete'].includes(config.method.toLowerCase())) {
      // Avoid queuing token refresh or logouts
      if (!config.url.includes('/auth/refresh') && !config.url.includes('/auth/logout')) {
        const action = {
          type: `${config.method.toUpperCase()}_ACTION`,
          endpoint: config.url,
          method: config.method.toUpperCase(),
          body: config.data,
        };

        await queueOfflineAction(action);
        toast.info('You are offline. Action queued for auto-sync on reconnect.');
        
        // Cancel request
        const cancelTokenSource = axios.CancelToken.source();
        config.cancelToken = cancelTokenSource.token;
        cancelTokenSource.cancel('OFFLINE_QUEUED');
      }
    }

    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isCancel(error) && error.message === 'OFFLINE_QUEUED') {
      // Resolve cleanly with a mock response representing queued action
      return Promise.resolve({ data: { _queued: true, message: 'Action queued offline' } });
    }
    return Promise.reject(error);
  }
);

export default api;
