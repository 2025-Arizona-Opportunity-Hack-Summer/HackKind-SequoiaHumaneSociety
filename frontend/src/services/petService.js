import api from './api';

export const petService = {
  getPets: async (skip = 0, limit = 10) => {
    const response = await api.get(`/pets?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getPet: async (petId) => {
    const response = await api.get(`/pets/${petId}`);
    return response.data;
  },

  getMatches: async ({ page = 1, pageSize = 10, forceRefresh = false } = {}) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(forceRefresh && { refresh: 'true' })
      });
      
      const response = await api.get(`/match/recommendations?${params.toString()}`);
      
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Please complete the questionnaire to get pet recommendations.');
      } else if (error.response?.status === 401) {
        throw new Error('Please log in to view your matches.');
      } else if (error.response?.status === 404) {
        return [];
      }
      console.error('Error fetching matches:', error);
      throw new Error(error.response?.data?.message || 'Failed to load pet matches. Please try again later.');
    }
  }
};
