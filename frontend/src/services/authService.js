import api from './api';

export const authService = {
  /**
   * Authenticate user with email and password.
   * Returns: { access, refresh, user: { id, email, role, first_name, last_name } }
   */
  async login(credentials) {
    const response = await api.post('/auth/login/', {
      email: credentials.email.trim(),
      password: credentials.password,
    });
    return response.data;
  },

  /**
   * Register a new student account.
   * Returns: { message, user: { id, email, role, first_name, last_name } }
   */
  async register(studentData) {
    const response = await api.post('/auth/register/', {
      email: studentData.email.trim(),
      password: studentData.password,
      first_name: studentData.firstName?.trim() || '',
      last_name: studentData.lastName?.trim() || '',
    });
    return response.data;
  },

  /**
   * Blacklist refresh token and logout on backend.
   */
  async logout(refreshToken) {
    if (!refreshToken) return;
    try {
      await api.post('/auth/logout/', { refresh: refreshToken });
    } catch (err) {
      // Non-blocking: logout should proceed client-side even if network fails
      console.warn('Backend logout encountered an error:', err.response?.data || err.message);
    }
  },

  /**
   * Fetch currently authenticated user profile.
   * Returns: { id, email, role, first_name, last_name, created_at }
   */
  async getProfile() {
    const response = await api.get('/auth/me/');
    return response.data;
  },

  /**
   * Manually exchange refresh token for new access token.
   */
  async refreshToken(refreshToken) {
    const response = await api.post('/auth/token/refresh/', { refresh: refreshToken });
    return response.data;
  },
};

export default authService;
