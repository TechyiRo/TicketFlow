import api, { setAccessToken } from './api';

export const authService = {
  /**
   * Register User (Form-data for logo file upload)
   */
  registerUser: async (formData) => {
    const response = await api.post('/auth/register/user', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (response.data.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    return response.data;
  },

  /**
   * Register Employee
   */
  registerEmployee: async (data) => {
    const response = await api.post('/auth/register/employee', data);
    if (response.data.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    return response.data;
  },

  /**
   * User Login
   */
  loginUser: async (username, password) => {
    const response = await api.post('/auth/login/user', { username, password });
    if (response.data.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    return response.data;
  },

  /**
   * Employee Login
   */
  loginEmployee: async (username, password) => {
    const response = await api.post('/auth/login/employee', { username, password });
    if (response.data.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    return response.data;
  },

  /**
   * Unified Login
   */
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    return response.data;
  },

  /**
   * Silent Refresh Token Exchange
   */
  refresh: async () => {
    const response = await api.post('/auth/refresh');
    if (response.data.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async () => {
    const response = await api.post('/auth/logout');
    setAccessToken('');
    return response.data;
  },

  /**
   * Fetch current profile
   */
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default authService;
