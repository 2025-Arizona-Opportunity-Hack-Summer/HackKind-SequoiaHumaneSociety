import api from './api';

const PREFERENCES_ENDPOINT = '/users/me/preferences';

export const preferencesService = {
  // Save user preferences from questionnaire
  async savePreferences(preferencesData) {
    console.log('Saving preferences with data:', { preferences: preferencesData });
    
    try {
      // First, try to update existing preferences if they exist
      try {
        console.log('Attempting to update existing preferences...');
        const response = await api.put(PREFERENCES_ENDPOINT, { preferences: preferencesData });
        console.log('Successfully updated preferences:', response.data);
        return response.data;
      } catch (updateError) {
        console.log('Update error:', updateError.response?.status, updateError.response?.data);
        
        // If update fails with 404, try creating new preferences
        if (updateError.response?.status === 404) {
          console.log('No existing preferences found, creating new...');
          try {
            const response = await api.post(PREFERENCES_ENDPOINT, { preferences: preferencesData });
            console.log('Successfully created new preferences:', response.data);
            return response.data;
          } catch (createError) {
            console.error('Error creating preferences:', createError);
            const createErrorMessage = createError.response?.data?.detail || 
                                     createError.response?.data?.message || 
                                     'Failed to create new preferences.';
            throw new Error(createErrorMessage);
          }
        }
        
        // For other errors, rethrow the original error
        console.error('Error updating preferences:', updateError);
        const updateErrorMessage = updateError.response?.data?.detail || 
                                 updateError.response?.data?.message || 
                                 'Failed to update preferences.';
        throw new Error(updateErrorMessage);
      }
    } catch (error) {
      console.error('Unexpected error in savePreferences:', error);
      const errorMessage = error.message || 'An unexpected error occurred while saving preferences.';
      throw new Error(errorMessage);
    }
  },

  // Get current user's preferences
  async getMyPreferences() {
    try {
      const response = await api.get(PREFERENCES_ENDPOINT);
      return response.data || {};
    } catch (error) {
      if (error.response?.status === 404) {
        return {}; // Return empty preferences if not found
      }
      console.error('Error fetching user preferences:', error);
      throw error;
    }
  },

  // Update user preferences
  async updatePreferences(updates) {
    try {
      const response = await api.patch(PREFERENCES_ENDPOINT, updates);
      return response.data || {};
    } catch (error) {
      console.error('Error updating preferences:', error);
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Failed to update preferences. Please try again.';
      throw new Error(errorMessage);
    }
  },

  // Map questionnaire form data to API format
  mapQuestionnaireToPreferences(formData) {
    console.log('Raw form data:', formData);
    
    // Map pet_type to preferred_species
    const petTypeMap = {
      'dog': 'DOG',
      'cat': 'CAT'
    };

    // Map activity_level to energy level
    const energyLevelMap = {
      'lap': 'LOW',
      'calm': 'LOW',
      'moderate': 'MEDIUM',
      'very_active': 'HIGH'
    };

    // Map has_pets to has_dogs and has_cats
    let hasDogs = false;
    let hasCats = false;
    
    if (formData.has_pets) {
      if (formData.has_pets === 'dog' || formData.has_pets === 'both') hasDogs = true;
      if (formData.has_pets === 'cat' || formData.has_pets === 'both') hasCats = true;
    }

    // Map required_traits to wants_allergy_friendly
    const wantsAllergyFriendly = formData.required_traits?.includes('allergy_friendly') || false;
    
    const preferences = {
      preferred_species: petTypeMap[formData.pet_type] || 'DOG',
      pet_purpose: formData.pet_purpose?.toUpperCase(),
      has_children: Boolean(formData.has_children),
      has_dogs: hasDogs,
      has_cats: hasCats,
      ownership_experience: formData.ownership_experience?.toUpperCase(),
      preferred_age: formData.preferred_age?.toUpperCase(),
      preferred_sex: formData.preferred_sex === 'no_preference' ? 'ANY' : formData.preferred_sex?.toUpperCase(),
      preferred_size: formData.preferred_size === 'no_preference' ? 'ANY' : formData.preferred_size?.toUpperCase(),
      preferred_energy_level: formData.activity_level ? energyLevelMap[formData.activity_level] || 'MEDIUM' : 'MEDIUM',
      preferred_hair_length: formData.hair_length === 'no_preference' ? 'ANY' : formData.hair_length?.toUpperCase(),
      wants_allergy_friendly: wantsAllergyFriendly,
      accepts_special_needs: Boolean(formData.special_needs)
    };

    // Convert all values to uppercase for enum fields
    const enumFields = [
      'preferred_species', 'pet_purpose', 'ownership_experience', 
      'preferred_age', 'preferred_sex', 'preferred_size',
      'preferred_energy_level', 'preferred_hair_length'
    ];

    enumFields.forEach(field => {
      if (preferences[field] && typeof preferences[field] === 'string') {
        preferences[field] = preferences[field].toUpperCase();
      }
    });

    console.log('Mapped preferences:', preferences);
    return preferences;
  }
};

export default preferencesService;
