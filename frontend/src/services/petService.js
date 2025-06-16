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

  getMatches: async () => {
    const response = await api.get('/match/recommendations');
    return response.data;
  }
};