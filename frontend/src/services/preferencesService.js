import api from './api';

// Define the endpoint without a trailing slash to avoid redirects
const PREFERENCES_ENDPOINT = '/users/me/preferences';

// Helper function to log detailed error information
const logErrorDetails = (error, context) => {
  console.error(`[${context}] Error:`, error);
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Response data:', error.response.data);
    console.error('Response status:', error.response.status);
    console.error('Response headers:', error.response.headers);
  } else if (error.request) {
    // The request was made but no response was received
    console.error('Request was made but no response received:', error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Error message:', error.message);
  }
  console.error('Error config:', error.config);
};

export const preferencesService = {
  // Save user preferences from questionnaire
  async savePreferences(preferencesData) {
    console.log('Saving preferences with data:', preferencesData);
    
    // Log the full URL being called
    const fullUrl = `${api.defaults.baseURL}${PREFERENCES_ENDPOINT}`.replace('//api', '/api');
    console.log('Full API URL:', fullUrl);
    
    try {
      // First, try to update existing preferences if they exist
      try {
        console.log('Attempting to update existing preferences...');
        const response = await api.put(PREFERENCES_ENDPOINT, preferencesData, {
          // Explicitly set the URL to prevent any automatic URL manipulation
          baseURL: api.defaults.baseURL,
          url: PREFERENCES_ENDPOINT,
          // Disable automatic redirects to handle them manually
          maxRedirects: 0,
          validateStatus: status => status < 400 || status === 404
        });
        
        console.log('Successfully updated preferences:', response.data);
        return response.data;
        
      } catch (updateError) {
        logErrorDetails(updateError, 'Update Preferences');
        
        // If update fails with 404, try creating new preferences
        if (updateError.response?.status === 404) {
          console.log('No existing preferences found, creating new...');
          try {
            const response = await api.post(PREFERENCES_ENDPOINT, preferencesData, {
              baseURL: api.defaults.baseURL,
              url: PREFERENCES_ENDPOINT,
              maxRedirects: 0
            });
            console.log('Successfully created new preferences:', response.data);
            return response.data;
          } catch (createError) {
            logErrorDetails(createError, 'Create Preferences');
            const createErrorMessage = createError.response?.data?.detail || 
                                     createError.response?.data?.message || 
                                     createError.message ||
                                     'Failed to create new preferences.';
            throw new Error(createErrorMessage);
          }
        }
        
        // For other errors, rethrow the original error
        const updateErrorMessage = updateError.response?.data?.detail || 
                                 updateError.response?.data?.message || 
                                 updateError.message ||
                                 'Failed to update preferences.';
        throw new Error(updateErrorMessage);
      }
    } catch (error) {
      logErrorDetails(error, 'Unexpected Error in savePreferences');
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
    console.log('=== MAPPING FORM DATA TO PREFERENCES ===');
    console.log('Raw form data:', formData);
    
    // Map has_pets to has_dogs and has_cats
    let hasDogs = false;
    let hasCats = false;
    if (formData.has_pets) {
      if (formData.has_pets === 'Dog' || formData.has_pets === 'Both') hasDogs = true;
      if (formData.has_pets === 'Cat' || formData.has_pets === 'Both') hasCats = true;
    }

    // Map required_traits to wants_allergy_friendly
    const wantsAllergyFriendly = formData.required_traits?.includes('allergy_friendly') || false;
    
    // FIXED: Map activity_level to preferred_energy_level (form sends correct values)
    const energyLevelMap = {
      'LapPet': 'LapPet',
      'Calm': 'Calm',
      'Moderate': 'Moderate',
      'VeryActive': 'VeryActive',
      'NoPreference': 'NoPreference'
    };
    
    // Map preferred_age to match PetAgeGroup enum
    const ageMap = {
      'Baby': formData.pet_type === 'Dog' ? 'Puppy' : 'Kitten',
      'Young': 'Young',
      'Adult': 'Adult', 
      'Senior': 'Senior',
      'NoPreference': 'NoPreference'
    };

    // FIXED: Map preferred_sex to match PreferredSex enum (form sends correct values)
    const sexMap = {
      'Female': 'Female',
      'Male': 'Male',
      'NoPreference': 'NoPreference'
    };

    // FIXED: Map preferred_size to match PreferredSize enum (form sends correct values)
    const sizeMap = {
      'Small': 'Small',
      'Medium': 'Medium',
      'Large': 'Large',
      'ExtraLarge': 'ExtraLarge',
      'NoPreference': 'NoPreference'
    };

    // FIXED: Map hair_length to match HairLength enum (form sends correct values)
    const hairLengthMap = {
      'Short': 'Short',
      'Medium': 'Medium',
      'Long': 'Long',
      'NoPreference': 'NoPreference'
    };

    // Map ownership_experience to match OwnershipExperience enum
    const ownershipMap = {
      'FirstTime': 'FirstTime',
      'HadBefore': 'HadBefore', 
      'CurrentlyHave': 'CurrentlyHave'
    };

    // Map pet_purpose to match PetPurpose enum
    const purposeMap = {
      'Myself': 'Myself',
      'MyFamily': 'MyFamily'
    };
    
    // Log individual mappings for debugging
    console.log('Mapping details:');
    console.log('- pet_type:', formData.pet_type);
    console.log('- pet_purpose:', formData.pet_purpose, '->', purposeMap[formData.pet_purpose]);
    console.log('- ownership_experience:', formData.ownership_experience, '->', ownershipMap[formData.ownership_experience]);
    console.log('- preferred_age:', formData.preferred_age, '->', ageMap[formData.preferred_age]);
    console.log('- preferred_sex:', formData.preferred_sex, '->', sexMap[formData.preferred_sex]);
    console.log('- preferred_size:', formData.preferred_size, '->', sizeMap[formData.preferred_size]);
    console.log('- activity_level:', formData.activity_level, '->', energyLevelMap[formData.activity_level]);
    console.log('- hair_length:', formData.hair_length, '->', hairLengthMap[formData.hair_length]);
    console.log('- has_pets:', formData.has_pets, '-> hasDogs:', hasDogs, 'hasCats:', hasCats);
    
    const preferences = {
      preferred_species: formData.pet_type || 'Dog',
      pet_purpose: purposeMap[formData.pet_purpose] || 'Myself',
      has_children: Boolean(formData.has_children),
      has_dogs: hasDogs,
      has_cats: hasCats,
      ownership_experience: ownershipMap[formData.ownership_experience] || 'FirstTime',
      preferred_age: ageMap[formData.preferred_age] || 'NoPreference',
      preferred_sex: sexMap[formData.preferred_sex] || 'NoPreference',
      preferred_size: sizeMap[formData.preferred_size] || 'NoPreference',
      preferred_energy_level: energyLevelMap[formData.activity_level] || 'NoPreference',
      preferred_hair_length: hairLengthMap[formData.hair_length] || 'NoPreference',
      wants_allergy_friendly: wantsAllergyFriendly,
      accepts_special_needs: Boolean(formData.special_needs)
    };

    // Ensure all required fields are present and not undefined
    const requiredFields = [
      'preferred_species', 'pet_purpose', 'has_children', 'has_dogs', 'has_cats',
      'ownership_experience', 'preferred_age', 'preferred_sex', 'preferred_size',
      'preferred_energy_level', 'preferred_hair_length', 'wants_allergy_friendly',
      'accepts_special_needs'
    ];

    // Check for undefined values and warn
    const undefinedFields = [];
    requiredFields.forEach(field => {
      if (preferences[field] === undefined) {
        undefinedFields.push(field);
        console.warn(`Missing required field in preferences: ${field}`);
      }
    });

    if (undefinedFields.length > 0) {
      console.error('CRITICAL: Undefined fields detected:', undefinedFields);
    }

    console.log('Final mapped preferences:', preferences);
    console.log('=== END MAPPING ===');
    return preferences;
  }
};

export default preferencesService;