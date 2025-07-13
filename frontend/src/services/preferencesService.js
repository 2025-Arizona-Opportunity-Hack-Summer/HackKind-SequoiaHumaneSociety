import api from './api';

const PREFERENCES_ENDPOINT = '/users/me/preferences';

const logErrorDetails = (error, context) => {
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
      try {
        await api.get('/auth/csrf/');
      } catch (csrfError) {
      }
      
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
        }
      } else {
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
      throw error;
    }
  },

  async updatePreferences(updates) {
    try {
      const response = await api.patch(PREFERENCES_ENDPOINT, updates);
      return response.data || {};
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Failed to update preferences. Please try again.';
      throw new Error(errorMessage);
    }
  },

  async saveTrainingTraits(traitsArray) {
    try {
      
      if (!traitsArray || !Array.isArray(traitsArray)) {
        return;
      }
      
      const currentTraits = await this.getTrainingTraits();
      
      const currentTraitNames = currentTraits.map(t => t.trait || t);
      
      const traitsToSave = traitsArray
        .filter(trait => {
          const isValid = trait && trait !== 'none' && trait !== 'allergy_friendly';
          if (!isValid) {
          }
          return isValid;
        })
        .filter(trait => {
          const isDuplicate = currentTraitNames.includes(trait);
          if (isDuplicate) {
          }
          return !isDuplicate;
        });
      
      const savePromises = traitsToSave.map(trait => {
        return api.post('/preferences/training-traits', { trait })
          .then(response => {
            return response;
          })
          .catch(error => {
            if (error.response) {
            }
            throw error; 
          });
      });
      
      if (savePromises.length > 0) {
        const results = await Promise.all(savePromises);
        return results;
      } else {
        return [];
      }
    } catch (error) {
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
    
    const hasNoPreferenceSpecies = formData.pet_type === 'NoPreference';
    
    const ageMap = {
      'Baby': 'Baby',
      'Puppy': 'Baby',
      'Kitten': 'Baby',
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
      preferred_species: hasNoPreferenceSpecies ? 'NoPreference' : (formData.pet_type || 'Dog'),
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

    const requiredFields = [
      'preferred_species', 'pet_purpose', 'has_children', 'has_dogs', 'has_cats',
      'ownership_experience', 'preferred_age', 'preferred_sex', 'preferred_size',
      'wants_allergy_friendly', 'accepts_special_needs'
    ];
    
    const optionalFields = [
      'preferred_energy_level', 'preferred_hair_length'
    ];

    const undefinedFields = [];
    
    requiredFields.forEach(field => {
      if (preferences[field] === undefined) {
        undefinedFields.push(field);
      }
    });

    optionalFields.forEach(field => {
      if (preferences[field] === undefined) {
        preferences[field] = null;
      }
    });

    if (undefinedFields.length > 0) {
    }

    return { preferences, trainingTraits };
  }
};

export default preferencesService;