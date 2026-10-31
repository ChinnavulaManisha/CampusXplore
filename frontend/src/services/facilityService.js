import api from './api';

export const facilityService = {
  /**
   * Fetch paginated list of facilities with optional filtering.
   * Response format: { count, next, previous, results: [...] }
   */
  async getFacilities(params = {}) {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.pageSize) cleanParams.page_size = params.pageSize;
    if (params.category) cleanParams.category = params.category;
    if (params.building) cleanParams.building = params.building;
    if (params.search) cleanParams.search = params.search;
    if (params.isActive !== undefined && params.isActive !== null && params.isActive !== '') {
      cleanParams.is_active = params.isActive;
    }

    const response = await api.get('/facilities/', { params: cleanParams });
    return response.data;
  },

  /**
   * Fetch detailed information for a single facility by ID.
   */
  async getFacilityById(id) {
    const response = await api.get(`/facilities/${id}/`);
    return response.data;
  },

  /**
   * Fetch all facility categories with facility counts.
   * Response format: Array of category objects.
   */
  async getCategories() {
    const response = await api.get('/categories/');
    return response.data;
  },

  /**
   * Fetch single category details.
   */
  async getCategoryById(id) {
    const response = await api.get(`/categories/${id}/`);
    return response.data;
  },

  /**
   * Fetch facilities directly belonging to a specific category.
   */
  async getCategoryFacilities(categoryId, params = {}) {
    const response = await api.get(`/categories/${categoryId}/facilities/`, { params });
    return response.data;
  },
};

export default facilityService;
