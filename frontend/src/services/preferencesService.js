import api from './api';

const PREFERENCES_ENDPOINT = '/users/me/preferences';

const logErrorDetails = (error, context) => {
  // Error details are now handled by the error handling in the API layer
};

export const preferencesService = {
  async savePreferences(preferencesData) {
    
    let preferences, trainingTraits;
    if (preferencesData.preferences && preferencesData.trainingTraits !== undefined) {
      preferences = preferencesData.preferences;
      trainingTraits = preferencesData.trainingTraits;
    } else {
      preferences = preferencesData;
      trainingTraits = [];
    }
    
    const fullUrl = `${api.defaults.baseURL}${PREFERENCES_ENDPOINT}`.replace('//api', '/api');
    try {
      let preferencesResult;
      try {
        const response = await api.put(PREFERENCES_ENDPOINT, preferences, {
          baseURL: api.defaults.baseURL,
          url: PREFERENCES_ENDPOINT,
          maxRedirects: 0,
          validateStatus: status => status < 400 || status === 404
        });
        
        preferencesResult = response.data;
        
      } catch (updateError) {
        logErrorDetails(updateError, 'Update Preferences');
        
        if (updateError.response?.status === 404) {
          try {
            const response = await api.post(PREFERENCES_ENDPOINT, preferences, {
              baseURL: api.defaults.baseURL,
              url: PREFERENCES_ENDPOINT,
              maxRedirects: 0
            });
            preferencesResult = response.data;
          } catch (createError) {
            logErrorDetails(createError, 'Create Preferences');
            const createErrorMessage = createError.response?.data?.detail || 
                                     createError.response?.data?.message || 
                                     createError.message ||
                                     'Failed to create new preferences.';
            throw new Error(createErrorMessage);
          }
        } else {
          const updateErrorMessage = updateError.response?.data?.detail || 
                                   updateError.response?.data?.message || 
                                   updateError.message ||
                                   'Failed to update preferences.';
          throw new Error(updateErrorMessage);
        }
      }
      
      if (trainingTraits && trainingTraits.length > 0) {
        try {
          await this.saveTrainingTraits(trainingTraits);
        } catch (traitsError) {
          console.error('Failed to save training traits, but preferences were saved:', traitsError);
        }
      } else {
        console.log('No training traits to save. trainingTraits:', trainingTraits);
      }
      
      return preferencesResult;
      
    } catch (error) {
      logErrorDetails(error, 'Unexpected Error in savePreferences');
      const errorMessage = error.message || 'An unexpected error occurred while saving preferences.';
      throw new Error(errorMessage);
    }
  },

  async getMyPreferences() {
    try {
      const response = await api.get(PREFERENCES_ENDPOINT);
      return response.data || {};
    } catch (error) {
      if (error.response?.status === 404) {
        return {}; 
      }
      console.error('Error fetching user preferences:', error);
      throw error;
    }
  },

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

  async saveTrainingTraits(traitsArray) {
    try {
      
      if (!traitsArray || !Array.isArray(traitsArray)) {
        console.error('Invalid traitsArray:', traitsArray);
        return;
      }
      
      const currentTraits = await this.getTrainingTraits();
      
      const currentTraitNames = currentTraits.map(t => t.trait || t);
      
      const traitsToSave = traitsArray
        .filter(trait => {
          const isValid = trait && trait !== 'none' && trait !== 'allergy_friendly';
          if (!isValid) {
            console.log(`Skipping invalid trait: ${trait}`);
          }
          return isValid;
        })
        .filter(trait => {
          const isDuplicate = currentTraitNames.includes(trait);
          if (isDuplicate) {
            console.log(`Skipping duplicate trait: ${trait}`);
          }
          return !isDuplicate;
        });
      
      const savePromises = traitsToSave.map(trait => {
        return api.post('/preferences/training-traits', { trait })
          .then(response => {
            return response;
          })
          .catch(error => {
            console.error(`Error saving trait ${trait}:`, error);
            if (error.response) {
              console.error('Response data:', error.response.data);
              console.error('Status:', error.response.status);
            }
            throw error; 
          });
      });
      
      if (savePromises.length > 0) {
        const results = await Promise.all(savePromises);
        return results;
      } else {
        console.log('No new training traits to save');
        return [];
      }
    } catch (error) {
      console.error('Error in saveTrainingTraits:', error);
      logErrorDetails(error, 'Save Training Traits');
      throw new Error('Failed to save training traits');
    }
  },
  
  async getTrainingTraits() {
    try {
      const response = await api.get('/preferences/training-traits');
      return response.data || [];
    } catch (error) {
      if (error.response?.status === 404) {
        return []; 
      }
      console.error('Error fetching training traits:', error);
      throw error;
    }
  },

  mapQuestionnaireToPreferences(formData) {
    const trainingTraitMap = {
      'house_trained': 'HouseTrained',
      'litter_trained': 'LitterTrained',
      'HouseTrained': 'HouseTrained',    
      'LitterTrained': 'LitterTrained',  
    };

    const trainingTraits = (formData.required_traits || [])
    .filter(trait => trait !== 'none' && trait !== 'allergy_friendly')
    .map(trait => trainingTraitMap[trait])
    .filter(trait => trait); 
    
    let hasDogs = false;
    let hasCats = false;
    if (formData.has_pets) {
      if (formData.has_pets === 'Dog' || formData.has_pets === 'Both') hasDogs = true;
      if (formData.has_pets === 'Cat' || formData.has_pets === 'Both') hasCats = true;
    }

    const wantsAllergyFriendly = formData.required_traits?.includes('allergy_friendly') || false;
    
    const energyLevelMap = {
      'LapPet': 'LapPet',
      'Calm': 'Calm',
      'Moderate': 'Moderate',
      'VeryActive': 'VeryActive',
      'NoPreference': 'NoPreference'
    };
    
    // Determine if we should use 'NoPreference' for species
    const hasNoPreferenceSpecies = formData.pet_type === 'NoPreference';
    
    // Age mapping - use 'Baby' when no preference is selected for species
    const ageMap = {
      'Baby': hasNoPreferenceSpecies ? 'Baby' : 
             (formData.pet_type || '').toLowerCase() === 'dog' ? 'Puppy' : 'Kitten',
      'Young': 'Young',
      'Adult': 'Adult', 
      'Senior': 'Senior',
      'NoPreference': 'NoPreference'
    };

    const sexMap = {
      'Female': 'Female',
      'Male': 'Male',
      'NoPreference': 'NoPreference'
    };

    const sizeMap = {
      'Small': 'Small',
      'Medium': 'Medium',
      'Large': 'Large',
      'ExtraLarge': 'ExtraLarge',
      'NoPreference': 'NoPreference'
    };

    const hairLengthMap = {
      'Short': 'Short',
      'Medium': 'Medium',
      'Long': 'Long',
      'NoPreference': 'NoPreference'
    };

    const ownershipMap = {
      'FirstTime': 'FirstTime',
      'HadBefore': 'HadBefore', 
      'CurrentlyHave': 'CurrentlyHave'
    };

    const purposeMap = {
      'Myself': 'Myself',
      'MyFamily': 'MyFamily'
    };
    
    const preferences = {
      // Set preferred_species to null when 'NoPreference' is selected
      preferred_species: hasNoPreferenceSpecies ? null : (formData.pet_type || 'Dog'),
      pet_purpose: purposeMap[formData.pet_purpose] || 'Myself',
      has_children: Boolean(formData.has_children),
      has_dogs: hasDogs,
      has_cats: hasCats,
      ownership_experience: ownershipMap[formData.ownership_experience] || 'FirstTime',
      // Use ageMap to determine the correct age label based on pet type preference
      preferred_age: ageMap[formData.preferred_age] || 'NoPreference',
      preferred_sex: sexMap[formData.preferred_sex] || 'NoPreference',
      preferred_size: sizeMap[formData.preferred_size] || 'NoPreference',
      preferred_energy_level: energyLevelMap[formData.activity_level] || 'NoPreference',
      preferred_hair_length: hairLengthMap[formData.hair_length] || 'NoPreference',
      wants_allergy_friendly: wantsAllergyFriendly,
      accepts_special_needs: Boolean(formData.special_needs)
    };

    // These fields are required but some can be null
    const requiredFields = [
      'preferred_species', 'pet_purpose', 'has_children', 'has_dogs', 'has_cats',
      'ownership_experience', 'preferred_age', 'preferred_sex', 'preferred_size',
      'wants_allergy_friendly', 'accepts_special_needs'
    ];
    
    // These fields are optional and can be null
    const optionalFields = [
      'preferred_energy_level', 'preferred_hair_length'
    ];

    const undefinedFields = [];
    
    // Check required fields
    requiredFields.forEach(field => {
      if (preferences[field] === undefined) {
        undefinedFields.push(field);
      }
    });

    // Check that optional fields are either valid or null
    optionalFields.forEach(field => {
      if (preferences[field] === undefined) {
        preferences[field] = null; // Ensure optional fields are explicitly set to null if undefined
      }
    });

    if (undefinedFields.length > 0) {
      console.error('CRITICAL: Required fields are undefined:', undefinedFields);
    }

    return { preferences, trainingTraits };
  }
};

export default preferencesService;