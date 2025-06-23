import api from './api';

// Helper function to handle file uploads and form data
const createFormData = (data) => {
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    // Skip trainingTraits as they are handled separately
    if (key === 'trainingTraits') {
      return;
    }
    
    // Handle file uploads
    if (key === 'image' && data[key] instanceof File) {
      formData.append('image', data[key]);
    } 
    // Handle nested objects (like form data from PetModal)
    else if (typeof data[key] === 'object' && data[key] !== null) {
      // For arrays, append each item individually if needed
      if (Array.isArray(data[key])) {
        data[key].forEach((item, index) => {
          formData.append(`${key}[${index}]`, item);
        });
      } else {
        // For other objects, stringify them
        formData.append(key, JSON.stringify(data[key]));
      }
    }
    // Handle boolean values - convert to string
    else if (typeof data[key] === 'boolean') {
      formData.append(key, String(data[key]));
    }
    // Handle all other values that are not undefined or null
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
      // Always use FormData for consistency with the backend
      const formData = new FormData();
      
      // Add all pet data to form data
      for (const key in petData) {
        // Skip undefined values
        if (petData[key] !== undefined && petData[key] !== null) {
          // Handle file objects differently
          if (petData[key] instanceof File) {
            formData.append(key, petData[key]);
          } else if (typeof petData[key] === 'object') {
            // Stringify objects
            formData.append(key, JSON.stringify(petData[key]));
          } else if (typeof petData[key] === 'boolean') {
            // Convert booleans to strings
            formData.append(key, petData[key] ? 'true' : 'false');
          } else {
            // Handle all other types (string, number, etc.)
            formData.append(key, petData[key]);
          }
        }
      }
      
      // Log the data being sent
      console.log('Sending FormData with entries:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ', pair[1]);
      }
      
      // Set the content type to multipart/form-data
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      
      const response = await api.post('/pets', formData, config);
      
      // If we get here but status is 422, log the response
      if (response.status === 422) {
        console.error('=== VALIDATION ERRORS ===');
        console.error('Status:', response.status);
        console.error('Data:', response.data);
        
        if (response.data?.detail) {
          console.error('Detailed validation errors:');
          response.data.detail.forEach((error, index) => {
            console.error(`Error ${index + 1}:`, error);
            if (error.loc) console.error('  Location:', error.loc);
            if (error.msg) console.error('  Message:', error.msg);
            if (error.type) console.error('  Type:', error.type);
          });
        }
        
        const error = new Error('Validation failed');
        error.response = response;
        throw error;
      }
      
      return response.data;
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
        
        // Create a more descriptive error message
        if (error.response.data && error.response.data.detail) {
          const details = Array.isArray(error.response.data.detail) 
            ? error.response.data.detail.map(d => d.msg || d).join('; ')
            : JSON.stringify(error.response.data.detail);
          error.message = `Validation failed: ${details}`;
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
      }
      
      console.error('Error config:', error.config);
      throw error;
    }
  },

  // Update an existing pet
  updatePet: async (petId, petData, existingPet = null) => {
    try {
      console.log(`[petService] Updating pet ${petId} with data:`, petData);
      
      const formData = createFormData(petData);

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      
      console.log(`[petService] Sending PATCH request to /pets/${petId}`);
      const response = await api.patch(`/pets/${petId}`, formData, config);
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
