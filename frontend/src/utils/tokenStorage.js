/**
 * CampusXplore Token Storage Service
 *
 * Security Architecture:
 * - Access tokens are maintained strictly in memory (inMemoryAccessToken) to prevent persistent XSS exposure.
 * - Refresh tokens are stored in localStorage to enable session continuity across page reloads and browser tabs.
 * - Security Trade-off: While localStorage is accessible to client scripts and therefore susceptible to high-privilege
 *   XSS attacks, the backend mitigates this risk by enforcing refresh-token rotation, token blacklisting on logout,
 *   and strict token ownership validation.
 */

let inMemoryAccessToken = null;
const REFRESH_TOKEN_KEY = 'campusxplore_refresh_token';
const USER_KEY = 'campusxplore_user';

export const getAccessToken = () => inMemoryAccessToken;

export const setAccessToken = (token) => {
  inMemoryAccessToken = token || null;
};

export const clearAccessToken = () => {
  inMemoryAccessToken = null;
};

export const getRefreshToken = () => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setRefreshToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch (err) {
    console.error('Failed to write refresh token to storage:', err);
  }
};

export const clearRefreshToken = () => {
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (err) {
    console.error('Failed to clear refresh token:', err);
  }
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch (err) {
    console.error('Failed to store user profile:', err);
  }
};

export const clearStoredUser = () => {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (err) {
    console.error('Failed to clear stored user profile:', err);
  }
};

export const clearAllTokens = () => {
  clearAccessToken();
  clearRefreshToken();
  clearStoredUser();
};
