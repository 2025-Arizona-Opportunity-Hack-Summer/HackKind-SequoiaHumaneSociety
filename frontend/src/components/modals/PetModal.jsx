import React, { useState, useEffect } from 'react';
import { ENUMS } from '../../utils/enums';
import petTrainingTraitsService from '../../services/petTrainingTraitsService';

const initialFormData = {
  name: '',
  species: '',
  breed: '',
  age_group: '',
  sex: '',
  size: '',
  status: 'Available',
  energy_level: '',
  experience_level: '',
  hair_length: '',
  allergy_friendly: false,
  special_needs: false,
  kid_friendly: false,
  pet_friendly: false,
  house_trained: false,
  litter_trained: false,
  shelter_notes: ''
};

const PetModal = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  pet = null,
  isProcessing = false,
  error = null
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [previewImage, setPreviewImage] = useState(pet?.image_url || null);
  const [isKitten, setIsKitten] = useState(false);

  useEffect(() => {
    if (pet) {
      // Fetch training traits for the pet
      const fetchTrainingTraits = async () => {
        try {
          const traits = await petTrainingTraitsService.getTrainingTraits(pet.id || pet._id);
          const traitNames = traits.map(t => t.trait || t);
          
          setFormData(prev => ({
            ...prev,
            house_trained: traitNames.includes('HouseTrained'),
            litter_trained: traitNames.includes('LitterTrained')
          }));
        } catch (error) {
          console.error('Error fetching training traits:', error);
        }
      };
      
      fetchTrainingTraits();
      
      const petData = {
        ...initialFormData,
        ...pet,
        // Ensure status is properly capitalized to match enums
        status: pet.status ? pet.status.charAt(0).toUpperCase() + pet.status.slice(1) : 'Available'
      };
      
      setFormData(prev => ({
        ...prev,
        ...petData
      }));
      
      // Check if it's a kitten
      const isPetKitten = pet.species?.toLowerCase() === 'cat' && 
                        pet.age_group?.toLowerCase().includes('kitten');
      setIsKitten(isPetKitten);
    } else {
      // Reset form to initial state when adding a new pet
      setFormData(initialFormData);
      setPreviewImage(null);
      setIsKitten(false);
    }
  }, [pet]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
          setFormData(prev => ({
            ...prev,
            image: file
          }));
        };
        reader.readAsDataURL(file);
      }
    };

    const handleTrainingTraitChange = (trait, isChecked) => {
      setFormData(prev => ({
        ...prev,
        [trait]: isChecked
      }));
    };

    if (type === 'file') {
      handleImageChange(e);
      return;
    }
    
    // Handle species change to update isKitten state
    if (name === 'species' || name === 'age_group') {
      const newFormData = {
        ...formData,
        [name]: value
      };
      
      const isCat = name === 'species' ? value.toLowerCase() === 'cat' : formData.species?.toLowerCase() === 'cat';
      const isKittenAge = name === 'age_group' ? value.toLowerCase().includes('kitten') : 
                          formData.age_group?.toLowerCase().includes('kitten');
      
      setIsKitten(isCat && isKittenAge);
      
      // If it's a dog, unset litter_trained
      if (name === 'species' && value.toLowerCase() === 'dog') {
        setFormData(prev => ({
          ...newFormData,
          litter_trained: false
        }));
        return;
      }
      
      setFormData(newFormData);
      return;
    }
    
    if (name === 'house_trained' || name === 'litter_trained') {
      handleTrainingTraitChange(name, checked);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Extract training traits from the form data
    const trainingTraits = [];
    if (formData.house_trained) trainingTraits.push('HouseTrained');
    if (formData.litter_trained) trainingTraits.push('LitterTrained');
    
    // Create a copy of form data without the training traits
    const { house_trained, litter_trained, ...petData } = formData;
    
    // Prepare form data for submission
    const formDataToSubmit = new FormData();
    
    // Handle file uploads separately
    if (petData.image && petData.image instanceof File) {
      formDataToSubmit.append('image', petData.image);
    }
    
    // Append all other fields
    Object.entries(petData).forEach(([key, value]) => {
      // Skip image field if it's a string (URL) and no new image was selected
      if (key === 'image') {
        return;
      }
      
      // Skip undefined or null values for new pets to avoid sending empty strings
      if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '' && !pet)) {
        return;
      }
      
      // Skip training traits as they're handled separately
      if (key === 'house_trained' || key === 'litter_trained') {
        return;
      }
      
      // Append to form data
      formDataToSubmit.append(key, value);
    });
    
    // If it's an edit and no new image was selected, ensure we keep the existing image_url
    if (pet?.image_url && !petData.image) {
      formDataToSubmit.append('image_url', pet.image_url);
    }
    
    // Only include status if it's being edited or explicitly set for a new pet
    if (pet || formData.status) {
      formDataToSubmit.append('status', formData.status || 'Available');
    }
    
    // Convert FormData to object if not a file upload
    const dataToSubmit = formData.image ? formDataToSubmit : Object.fromEntries(formDataToSubmit.entries());
    
    // For new pets, ensure we don't send empty strings for optional fields
    if (!pet) {
      Object.keys(dataToSubmit).forEach(key => {
        if (dataToSubmit[key] === '') {
          delete dataToSubmit[key];
        }
      });
    }
    
    // Pass both the pet data and training traits to the parent component
    onSubmit({
      ...dataToSubmit,
      trainingTraits
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full space-y-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {pet ? 'Edit Pet' : 'Add New Pet'}
                  </h3>
                  
                  {error && (
                    <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                      <p>{error}</p>
                    </div>
                  )}
                  
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-200 pb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Species *</label>
                        <select
                          name="species"
                          value={formData.species}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                          required
                        >
                          <option value="">Select a species</option>
                          {ENUMS.species.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Breed *</label>
                        <input
                          type="text"
                          name="breed"
                          value={formData.breed}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Age Group *</label>
                        <select
                          name="age_group"
                          value={formData.age_group}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                          required
                        >
                          <option value="">Select an age group</option>
                          {ENUMS.ageGroups.map(ag => (
                            <option key={ag} value={ag}>{ag}</option>
                          ))}
                        </select>
                      </div>
                     
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Sex *</label>
                        <select
                          name="sex"
                          value={formData.sex}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                          required
                        >
                          <option value="">Select sex</option>
                          {ENUMS.sex.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Size *</label>
                        <select
                          name="size"
                          value={formData.size}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                          required
                        >
                          <option value="">Select size</option>
                          {ENUMS.sizes.map(size => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status *</label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                          required
                        >
                          {ENUMS.statuses.map(status => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Shelter Notes</label>
                        <textarea
                          name="shelter_notes"
                          rows={3}
                          value={formData.shelter_notes || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-red focus:border-primary-red sm:text-sm"
                          placeholder="Add any additional notes about this pet..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional Pet Attributes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-200 pb-6 px-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Energy Level</label>
                <select
                  name="energy_level"
                  value={formData.energy_level}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                >
                  <option value="">Select energy level</option>
                  {ENUMS.energyLevels?.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Experience Level</label>
                <select
                  name="experience_level"
                  value={formData.experience_level}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                >
                  <option value="">Select experience level</option>
                  {ENUMS.experienceLevels?.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Hair Length</label>
                <select
                  name="hair_length"
                  value={formData.hair_length}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                >
                  <option value="">Select hair length</option>
                  {ENUMS.hairLengths?.map(length => (
                    <option key={length} value={length}>{length}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pet Traits Section */}
            <div className="border-b border-gray-200 pb-6 px-6">
              <label className="block text-sm font-medium text-gray-700 mb-4">Pet Traits</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    id="house_trained"
                    name="house_trained"
                    type="checkbox"
                    checked={formData.house_trained || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-red focus:ring-primary-red border-gray-300 rounded"
                  />
                  <label htmlFor="house_trained" className="ml-2 block text-sm text-gray-700">
                    House Trained
                  </label>
                </div>
                
                {formData.species?.toLowerCase() === 'cat' && !isKitten && (
                  <div className="flex items-center">
                    <input
                      id="litter_trained"
                      name="litter_trained"
                      type="checkbox"
                      checked={formData.litter_trained || false}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-red focus:ring-primary-red border-gray-300 rounded"
                    />
                    <label htmlFor="litter_trained" className="ml-2 block text-sm text-gray-700">
                      Litter Trained
                    </label>
                  </div>
                )}
                
                <div className="flex items-center">
                  <input
                    id="kid_friendly"
                    name="kid_friendly"
                    type="checkbox"
                    checked={formData.kid_friendly || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-red focus:ring-primary-red border-gray-300 rounded"
                  />
                  <label htmlFor="kid_friendly" className="ml-2 block text-sm text-gray-700">
                    Kid Friendly
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="pet_friendly"
                    name="pet_friendly"
                    type="checkbox"
                    checked={formData.pet_friendly || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-red focus:ring-primary-red border-gray-300 rounded"
                  />
                  <label htmlFor="pet_friendly" className="ml-2 block text-sm text-gray-700">
                    Pet Friendly
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="special_needs"
                    name="special_needs"
                    type="checkbox"
                    checked={formData.special_needs || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-red focus:ring-primary-red border-gray-300 rounded"
                  />
                  <label htmlFor="special_needs" className="ml-2 block text-sm text-gray-700">
                    Special Needs
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="allergy_friendly"
                    name="allergy_friendly"
                    type="checkbox"
                    checked={formData.allergy_friendly || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-red focus:ring-primary-red border-gray-300 rounded"
                  />
                  <label htmlFor="allergy_friendly" className="ml-2 block text-sm text-gray-700">
                    Allergy-friendly
                  </label>
                </div>
              </div>
            </div>

            {/* Pet Image Upload Section */}
            <div className="col-span-2 bg-gray-50 p-6 rounded-lg mt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pet Image</h3>
              <div className="flex items-center">
                <div className="flex-shrink-0 h-32 w-32 rounded-lg overflow-hidden border-2 border-gray-300">
                  {previewImage ? (
                    <img 
                      src={previewImage} 
                      alt="Pet preview" 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`h-full w-full bg-gray-100 flex items-center justify-center ${previewImage ? 'hidden' : ''}`}>
                    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-6">
                  <label className="inline-block px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-red cursor-pointer">
                    {previewImage ? 'Change Image' : 'Upload Image'}
                    <input
                      type="file"
                      name="image"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleChange}
                    />
                  </label>
                  <p className="mt-2 text-sm text-gray-500">
                    JPG, PNG, or GIF (max 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Form Buttons */}
            <div className="col-span-2 flex justify-end space-x-3 mt-6 pb-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-red sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
              
              {pet && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this pet? This action cannot be undone.')) {
                      onDelete(pet._id);
                    }
                  }}
                  disabled={isProcessing}
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete Pet
                </button>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className={`inline-flex items-center justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-red text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-red sm:ml-3 sm:w-auto sm:text-sm ${
                  isProcessing ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  pet ? 'Update Pet' : 'Add Pet'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PetModal;
