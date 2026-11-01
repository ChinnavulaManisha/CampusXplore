import api from './api';

export const reportService = {
  /**
   * Submit a new campus issue report.
   * @param {Object} reportData - { facility: number, title: string, description: string, issue_type: string }
   * @returns {Promise<Object>} Created issue report representation
   */
  async createReport(reportData) {
    const response = await api.post('/reports/', reportData);
    return response.data;
  },

  /**
   * Fetch paginated list of issue reports with optional filters.
   * @param {Object} params - { status, issue_type, facility, page, page_size, search }
   * @returns {Promise<Object>} { count, next, previous, results: [...] }
   */
  async getReports(params = {}) {
    const response = await api.get('/reports/', { params });
    return response.data;
  },

  /**
   * Fetch single report details by ID.
   * @param {number|string} id - Report ID
   * @returns {Promise<Object>} Issue report detail
   */
  async getReportById(id) {
    const response = await api.get(`/reports/${id}/`);
    return response.data;
  },

  /**
   * Update report status (Faculty / Admin only).
   * @param {number|string} id - Report ID
   * @param {string} status - New status ('IN_PROGRESS', 'RESOLVED', 'REJECTED')
   * @returns {Promise<Object>} Updated issue report
   */
  async updateReportStatus(id, status) {
    const response = await api.patch(`/reports/${id}/`, { status });
    return response.data;
  },

  /**
   * Delete report (Admin only).
   * @param {number|string} id - Report ID
   * @returns {Promise<void>}
   */
  async deleteReport(id) {
    const response = await api.delete(`/reports/${id}/`);
    return response.data;
  },
};

export default reportService;
