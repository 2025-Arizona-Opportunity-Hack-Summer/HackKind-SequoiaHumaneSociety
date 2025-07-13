import api from './api';

const createFormData = (data) => {
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    if (key === 'trainingTraits') {
      return;
    }
    
    if (key === 'image' && data[key] instanceof File) {
      formData.append('image', data[key]);
    } 
    else if (typeof data[key] === 'object' && data[key] !== null) {
      if (Array.isArray(data[key])) {
        data[key].forEach((item, index) => {
          formData.append(`${key}[${index}]`, item);
        });
      } else {
        formData.append(key, JSON.stringify(data[key]));
      }
    }
    else if (typeof data[key] === 'boolean') {
      formData.append(key, String(data[key]));
    }
    else if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  
  return formData;
};

export const petService = {
  getAllPets: async (status = '') => {
    try {
      const params = {};
      if (status) {
        params.status = status;
      }
      const response = await api.get('/pets', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getPets: async (skip = 0, limit = 10) => {
    try {
      const response = await api.get(`/pets?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getPet: async (petId) => {
    try {
      const response = await api.get(`/pets/${petId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createPet: async (petData) => {
    try {
      const formData = new FormData();
      
      for (const key in petData) {
        if (petData[key] !== undefined && petData[key] !== null) {
          if (petData[key] instanceof File) {
            formData.append(key, petData[key]);
          } else if (typeof petData[key] === 'object') {
            formData.append(key, JSON.stringify(petData[key]));
          } else if (typeof petData[key] === 'boolean') {
            formData.append(key, petData[key] ? 'true' : 'false');
          } else {
            formData.append(key, petData[key]);
          }
        }
      }
      
      const token = await import('./authService').then(m => m.authService.getAccessToken());
      const response = await api.post('/pets/', formData, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${await token}` } : {})
        }
      });
      
      if (response.status === 422) {
        if (response.data?.detail) {
          response.data.detail.forEach((error, index) => {
          });
        }
        
        const error = new Error('Validation failed');
        error.response = response;
        throw error;
      }
      
      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.data && error.response.data.detail) {
          let details;
          if (Array.isArray(error.response.data.detail)) {
            details = error.response.data.detail.map(d => {
              if (typeof d === 'object' && d !== null) {
                return d.msg || JSON.stringify(d);
              }
              return String(d);
            }).join('; ');
          } else {
            details = JSON.stringify(error.response.data.detail);
          }
          error.message = `Validation failed: ${details}`;
          if (typeof window !== 'undefined' && window.toast) {
            window.toast.error(details, {
              position: 'top-center',
              autoClose: 7000,
            });
          }
        }
      } else if (error.request) {
      } else {
      }
      
      throw error;
    }
  },

  updatePet: async (petId, petData, existingPet = null) => {
    try {
      const formData = createFormData(petData);

      const response = await api.patch(`/pets/${petId}`, formData);
      
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      return response.data;
    } catch (error) {
      
      if (error.response?.status === 422 && error.response?.data?.detail) {
        const validationErrors = error.response.data.detail;
        const errorMessages = validationErrors.map(err => {
          if (typeof err === 'string') return err;
          if (err.msg) return err.msg;
          if (err.message) return err.message;
          return JSON.stringify(err);
        });
        
        const errorMessage = `Validation error: ${errorMessages.join('. ')}`;
        const enhancedError = new Error(errorMessage);
        enhancedError.response = error.response;
        enhancedError.status = 422;
        throw enhancedError;
      }
      
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to update pet';
      const enhancedError = new Error(errorMessage);
      enhancedError.response = error.response;
      enhancedError.status = error.response?.status;
      
      throw enhancedError;
    }
  },

  deletePet: async (petId) => {
    try {
      const response = await api.delete(`/pets/${petId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  uploadPetImage: async (petId, imageFile) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await api.post(`/pets/${petId}/image`, formData);
      
      return response.data;
    } catch (error) {
      throw error;
    }
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
      throw new Error(error.response?.data?.message || 'Failed to load pet matches. Please try again later.');
    }
  }
};
