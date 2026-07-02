import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import authService from '../services/authService';
import { setAccessToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Silent refresh on mount or token expiry
  const checkAuth = useCallback(async () => {
    try {
      const data = await authService.refresh();
      setUser(data.user);
    } catch (err) {
      setUser(null);
      setAccessToken('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login User
  const loginUser = async (username, password) => {
    setLoading(true);
    try {
      const data = await authService.loginUser(username, password);
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw error.response?.data || { message: 'Authentication failed' };
    } finally {
      setLoading(false);
    }
  };

  // Login Employee
  const loginEmployee = async (username, password) => {
    setLoading(true);
    try {
      const data = await authService.loginEmployee(username, password);
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw error.response?.data || { message: 'Authentication failed' };
    } finally {
      setLoading(false);
    }
  };

  // Unified Login
  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await authService.login(username, password);
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw error.response?.data || { message: 'Authentication failed' };
    } finally {
      setLoading(false);
    }
  };

  // Register User
  const registerUser = async (formData) => {
    setLoading(true);
    try {
      const data = await authService.registerUser(formData);
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  // Register Employee
  const registerEmployee = async (data) => {
    setLoading(true);
    try {
      const resData = await authService.registerEmployee(data);
      setUser(resData.user);
      return resData.user;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const updateProfileState = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    login,
    loginUser,
    loginEmployee,
    registerUser,
    registerEmployee,
    logout,
    checkAuth,
    updateProfileState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
