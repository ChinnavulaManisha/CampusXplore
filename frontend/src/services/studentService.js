import api from './api';

export const studentService = {
  /**
   * Fetch paginated list of registered student accounts (Admin only).
   * @param {Object} params - { search, page, pageSize, ordering }
   * @returns {Promise<Object>} { count, next, previous, results: [...] }
   */
  async getStudents(params = {}) {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.pageSize || params.page_size) {
      cleanParams.page_size = params.pageSize || params.page_size;
    }
    if (params.search && params.search.trim()) {
      cleanParams.search = params.search.trim();
    }
    if (params.ordering) {
      cleanParams.ordering = params.ordering;
    }

    const response = await api.get('/auth/students/', { params: cleanParams });
    return response.data;
  },
};

export default studentService;
