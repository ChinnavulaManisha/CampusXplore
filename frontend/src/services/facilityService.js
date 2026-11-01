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
   * Fetch all facilities matching parameters across all pages sequentially.
   * Uses page_size=100.
   * Returns { facilities: [...], totalCount: number, isComplete: boolean }
   * If any subsequent page fails, returns what has been fetched so far with isComplete: false.
   */
  async getAllFacilities(params = {}) {
    const pageSize = 100;
    let allFacilities = [];
    let isComplete = true;
    let totalCount = 0;

    try {
      const firstPage = await this.getFacilities({ ...params, page: 1, pageSize });
      totalCount = firstPage.count ?? 0;
      allFacilities = [...(firstPage.results || [])];

      const totalPages = Math.ceil(totalCount / pageSize);

      for (let p = 2; p <= totalPages; p++) {
        try {
          const nextPage = await this.getFacilities({ ...params, page: p, pageSize });
          if (nextPage?.results?.length) {
            allFacilities.push(...nextPage.results);
          }
        } catch (pageError) {
          console.error(`Failed to fetch facilities page ${p}:`, pageError);
          isComplete = false;
          break; // Stop fetching subsequent pages, keep partial results
        }
      }
    } catch (initialError) {
      console.error('Failed to initiate facilities fetch:', initialError);
      throw initialError;
    }

    return {
      facilities: allFacilities,
      totalCount,
      isComplete,
    };
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

  /**
   * Create a new campus facility (Admin only).
   */
  async createFacility(facilityData) {
    const response = await api.post('/facilities/', facilityData);
    return response.data;
  },

  /**
   * Update an existing facility (Admin only).
   */
  async updateFacility(id, facilityData) {
    const response = await api.patch(`/facilities/${id}/`, facilityData);
    return response.data;
  },

  /**
   * Soft-delete / deactivate a facility (Admin only).
   */
  async deleteFacility(id) {
    const response = await api.delete(`/facilities/${id}/`);
    return response.data;
  },

  /**
   * Create a new facility category (Admin only).
   */
  async createCategory(categoryData) {
    const response = await api.post('/categories/', categoryData);
    return response.data;
  },

  /**
   * Update an existing category (Admin only).
   */
  async updateCategory(id, categoryData) {
    const response = await api.patch(`/categories/${id}/`, categoryData);
    return response.data;
  },

  /**
   * Delete a facility category (Admin only).
   */
  async deleteCategory(id) {
    const response = await api.delete(`/categories/${id}/`);
    return response.data;
  },
};

export default facilityService;
