import api from './api';

const petTrainingTraitsService = {
  /**
   * Get all training traits for a specific pet
   * @param {number} petId - The ID of the pet
   * @returns {Promise<Array>} - Array of training traits
   */
  async getTrainingTraits(petId) {
    try {
      const response = await api.get(`/pets/${petId}/training-traits`);
      return response.data || [];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Add a training trait to a pet
   * @param {number} petId - The ID of the pet
   * @param {string} trait - The training trait to add (must be one of: 'HouseTrained', 'LitterTrained')
   * @returns {Promise<Object>} - The response from the API
   */
  async addTrainingTrait(petId, trait) {
    try {
      const response = await api.post(
        `/pets/${petId}/training-traits`,
        trait,
        {
          headers: {
            'Content-Type': 'text/plain',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Remove a training trait from a pet
   * @param {number} petId - The ID of the pet
   * @param {string} trait - The training trait to remove (must be one of: 'HouseTrained', 'LitterTrained')
   * @returns {Promise<Object>} - The response from the API
   */
  async removeTrainingTrait(petId, trait) {
    try {
      const response = await api.delete(`/pets/${petId}/training-traits/${trait}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update all training traits for a pet
   * This will first remove all existing traits and then add the new ones
   * @param {number} petId - The ID of the pet
   * @param {Array<string>} newTraits - Array of training traits to set
   * @returns {Promise<Array>} - Array of results from the API calls
   */
  async updateTrainingTraits(petId, newTraits = []) {
    try {
      const currentTraits = await this.getTrainingTraits(petId);
      const currentTraitNames = currentTraits.map(t => t.trait || t);
      
      const traitsToAdd = newTraits.filter(trait => !currentTraitNames.includes(trait));
      const traitsToRemove = currentTraitNames.filter(trait => !newTraits.includes(trait));
      
      const addPromises = traitsToAdd.map(trait => this.addTrainingTrait(petId, trait));
      const removePromises = traitsToRemove.map(trait => this.removeTrainingTrait(petId, trait));
      
      const results = await Promise.allSettled([...addPromises, ...removePromises]);
      
      const failedOperations = results.filter(result => result.status === 'rejected');
      if (failedOperations.length > 0) {
      }
      
      return results;
    } catch (error) {
      throw error;
    }
  }
};

export default petTrainingTraitsService;
