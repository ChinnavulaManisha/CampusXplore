import React, { useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { AuthContext } from './authContextDef';
import {
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  getStoredUser,
  setStoredUser,
  clearAllTokens,
} from '../utils/tokenStorage';

export { AuthContext };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize session and hydrate profile using refresh token
  useEffect(() => {
    let isMounted = true;

    const hydrateAuth = async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearAllTokens();
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        // Exchange refresh token for fresh in-memory access token
        const refreshData = await authService.refreshToken(refreshToken);
        setAccessToken(refreshData.access);
        if (refreshData.refresh) {
          setRefreshToken(refreshData.refresh);
        }

        // Fetch authoritative profile from /api/auth/me/
        const profile = await authService.getProfile();
        if (isMounted) {
          setUser(profile);
          setStoredUser(profile);
        }
      } catch (err) {
        console.warn('Session restoration failed:', err.response?.data || err.message);
        clearAllTokens();
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    hydrateAuth();

    // Event listener for global session expiry triggered by Axios response interceptor
    const handleAuthExpired = () => {
      clearAllTokens();
      setUser(null);
      setAuthError('Your session has expired. Please log in again.');
    };

    window.addEventListener('campusxplore:auth-expired', handleAuthExpired);
    return () => {
      isMounted = false;
      window.removeEventListener('campusxplore:auth-expired', handleAuthExpired);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      const data = await authService.login({ email, password });
      setAccessToken(data.access);
      setRefreshToken(data.refresh);
      setStoredUser(data.user);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Authentication failed. Please verify your email and password.';
      setAuthError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const register = useCallback(async (studentData) => {
    setAuthError(null);
    try {
      const data = await authService.register(studentData);
      return data;
    } catch (err) {
      const data = err.response?.data;
      const fallbackMsg = 'Registration failed. Please check your input.';

      // Helper to defensively extract the first non-empty string from a value or array
      const extractMessage = (val) => {
        if (typeof val === 'string' && val.trim()) {
          return val.trim();
        }
        if (Array.isArray(val)) {
          for (const item of val) {
            if (typeof item === 'string' && item.trim()) {
              return item.trim();
            }
          }
        }
        return null;
      };

      let errorMsg = null;
      if (data) {
        if (typeof data === 'string' && data.trim()) {
          const trimmed = data.trim();
          if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html') || trimmed.includes('<title>Server Error')) {
            errorMsg = 'The server encountered an internal error. Please ensure database migrations have been applied.';
          } else {
            errorMsg = trimmed;
          }
        } else if (typeof data === 'object') {
          // Check standard DRF fields according to error precedence
          errorMsg =
            extractMessage(data.first_name) ||
            extractMessage(data.email) ||
            extractMessage(data.password) ||
            extractMessage(data.non_field_errors) ||
            extractMessage(data.detail);

          // If no message found in expected fields, check any unexpected field errors
          if (!errorMsg) {
            for (const key of Object.keys(data)) {
              const candidate = extractMessage(data[key]);
              if (candidate) {
                errorMsg = candidate;
                break;
              }
            }
          }
        }
      }

      const finalError = errorMsg || fallbackMsg;
      setAuthError(finalError);
      throw new Error(finalError);
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      await authService.logout(refreshToken);
    } finally {
      clearAllTokens();
      setUser(null);
      setAuthError(null);
    }
  }, []);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    authError,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
