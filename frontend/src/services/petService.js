import api from './api';

// Helper function to handle file uploads
const createFormData = (data) => {
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    // Handle file uploads
    if (key === 'image' && data[key] instanceof File) {
      formData.append('image', data[key]);
    } 
    // Handle nested objects (like form data from PetModal)
    else if (typeof data[key] === 'object' && data[key] !== null) {
      formData.append(key, JSON.stringify(data[key]));
    }
    // Handle all other values
    else if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  
  return formData;
};

export const petService = {
  // Get all pets with optional pagination
  getAllPets: async (status = '') => {
    try {
      const params = {};
      if (status) {
        params.status = status;
      }
      const response = await api.get('/pets', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching all pets:', error);
      throw error;
    }
  },
  
  // Get paginated list of pets
  getPets: async (skip = 0, limit = 10) => {
    try {
      const response = await api.get(`/pets?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching paginated pets:', error);
      throw error;
    }
  },

  // Get single pet by ID
  getPet: async (petId) => {
    try {
      const response = await api.get(`/pets/${petId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching pet ${petId}:`, error);
      throw error;
    }
  },

  // Create a new pet
  createPet: async (petData) => {
    try {
      const isFormData = petData instanceof FormData;
      const config = {
        headers: {
          'Content-Type': isFormData ? 'multipart/form-data' : 'application/json'
        }
      };
      
      const dataToSend = isFormData ? petData : createFormData(petData);
      const response = await api.post('/pets', dataToSend, config);
      return response.data;
    } catch (error) {
      console.error('Error creating pet:', error);
      throw error;
    }
  },

  // Update an existing pet
  updatePet: async (petId, petData, existingPet = null) => {
    try {
      console.log(`[petService] Updating pet ${petId} with data:`, petData);
      
      // If we're only updating the status and have the existing pet data,
      // include all required fields from the existing pet to avoid validation errors
      let updateData = { ...petData };
      if (existingPet && Object.keys(petData).length === 1 && 'status' in petData) {
        console.log('[petService] Status-only update detected, including all required fields');
        updateData = {
          ...existingPet,
          status: petData.status
        };
      }
      
      const isFormData = updateData instanceof FormData;
      const config = {
        headers: {
          'Content-Type': isFormData ? 'multipart/form-data' : 'application/json'
        }
      };
      
      // Log the data being sent
      let dataToSend;
      if (isFormData) {
        console.log('[petService] Sending FormData');
        dataToSend = updateData;
        // Log FormData entries if possible
        for (let pair of updateData.entries()) {
          console.log(`[petService] FormData entry: ${pair[0]} = ${pair[1]}`);
        }
      } else {
        console.log('[petService] Sending JSON data');
        dataToSend = createFormData(updateData);
        console.log('[petService] Created FormData from object:', Object.fromEntries(dataToSend));
      }
      
      console.log(`[petService] Sending PATCH request to /pets/${petId}`);
      const response = await api.patch(`/pets/${petId}`, dataToSend, config);
      console.log('[petService] Update response:', response);
      
      if (!response || !response.data) {
        console.error('[petService] Invalid response from server:', response);
        throw new Error('Invalid response from server');
      }
      
      return response.data;
    } catch (error) {
      console.error(`[petService] Error updating pet ${petId}:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      
      // Handle 422 validation errors
      if (error.response?.status === 422 && error.response?.data?.detail) {
        // Format the validation errors into a readable message
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
      
      // For other types of errors
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to update pet';
      const enhancedError = new Error(errorMessage);
      enhancedError.response = error.response;
      enhancedError.status = error.response?.status;
      
      throw enhancedError;
    }
  },

  // Delete a pet
  deletePet: async (petId) => {
    try {
      const response = await api.delete(`/pets/${petId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting pet ${petId}:`, error);
      throw error;
    }
  },

  // Upload pet image
  uploadPetImage: async (petId, imageFile) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await api.post(`/pets/${petId}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error uploading image for pet ${petId}:`, error);
      throw error;
    }
  },

  // Get pet matches with pagination
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
      console.error('Error fetching pet matches:', error);
      throw new Error(error.response?.data?.message || 'Failed to load pet matches. Please try again later.');
    }
  }
};
