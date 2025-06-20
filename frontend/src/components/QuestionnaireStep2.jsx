import { useState, useEffect } from 'react';

export default function QuestionnaireStep2({ onNext, onBack, formData, setFormData, isSubmitting = false }) {
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({
    preferred_age: false,
    preferred_sex: false,
    preferred_size: false,
    activity_level: false,
    hair_length: false,
    required_traits: false,
    special_needs: false
  });

  const petType = formData.pet_type || 'dog';
  const isNoPreference = petType === 'NoPreference';
  const isDog = petType.toLowerCase() === 'dog';

  const ageOptions = [
    { value: 'NoPreference', label: 'No preference' },
    { value: 'Baby', label: isNoPreference ? 'Baby' : (isDog ? 'Puppy' : 'Kitten') },
    { value: 'Young', label: 'Young' },
    { value: 'Adult', label: 'Adult' },
    { value: 'Senior', label: 'Senior' }
  ];
  
  const sexOptions = [
    { value: 'NoPreference', label: 'No preference' },
    { value: 'Female', label: 'Female' },
    { value: 'Male', label: 'Male' }
  ];
  
  const sizeOptions = [
    { value: 'NoPreference', label: 'No preference' },
    { value: 'Small', label: 'Small' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Large', label: 'Large' },
    { value: 'ExtraLarge', label: 'Extra large' }
  ];
  
  const activityLevels = [
    { value: 'NoPreference', label: 'No preference' },
    { value: 'LapPet', label: 'Lap pet' },
    { value: 'Calm', label: 'Calm' },
    { value: 'Moderate', label: 'Moderately active' },
    { value: 'VeryActive', label: 'Very active' }
  ];
  
  const hairLengths = [
    { value: 'NoPreference', label: 'No preference' },
    { value: 'Short', label: 'Short' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Long', label: 'Long' }
  ];

  const requiredTraits = [
    { 
      id: 'house_trained', 
      label: 'House-trained',
      visible: true
    },
    { 
      id: 'litter_trained', 
      label: 'Litter-trained',
      visible: petType.toLowerCase() === 'cat'
    },
    { 
      id: 'allergy_friendly', 
      label: 'Allergy-friendly',
      visible: true
    },
    { 
      id: 'none', 
      label: 'None',
      value: 'none',
      exclusive: true,
      visible: true
    }
  ];

  useEffect(() => {
    if (error) validateForm();
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked, dataset } = e.target;
    
    if (name === 'required_traits') {
      const currentTraits = new Set(formData.required_traits || []);
      
      if (dataset.exclusive === 'true') {
        if (checked) {
          currentTraits.clear();
          currentTraits.add('none');
        } else {
          currentTraits.delete('none');
        }
      } else {
        currentTraits.delete('none');
        
        if (checked) {
          currentTraits.add(value);
        } else {
          currentTraits.delete(value);
        }
      }
      
      setFormData(prev => ({
        ...prev,
        required_traits: Array.from(currentTraits)
      }));
    } else if (type === 'radio' && name === 'special_needs') {
      setFormData(prev => ({
        ...prev,
        special_needs: value === 'true'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const validateForm = () => {
    const errors = [];
    
    const requiredFields = [
      { name: 'preferred_age', label: 'preferred age' },
      { name: 'preferred_sex', label: 'preferred gender' },
      { name: 'preferred_size', label: 'preferred size' },
      { name: 'activity_level', label: 'activity level' },
      { name: 'hair_length', label: 'hair length' },
      { name: 'special_needs', label: 'special needs preference' }
    ];
    
    requiredFields.forEach(field => {
      if (formData[field.name] === undefined || formData[field.name] === '') {
        errors.push(`Please select a ${field.label}`);
      }
    });
    
    if (!formData.required_traits || formData.required_traits.length === 0) {
      errors.push('Please select at least one required trait or "None"');
    }
    
    setError(errors.length > 0 ? errors[0] : '');
    return errors.length === 0;
  };

  const handleNext = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onNext();
    }
  };

  const shouldShowError = (field) => {
    return touched[field] && error.toLowerCase().includes(field.replace('_', ' '));
  };

  return (
    <form onSubmit={handleNext} className="w-full">
      <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Pet Preferences – Step 2 of 2</h2>
        
        <div className="space-y-8">
          {/* 1. Preferred Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1. Preferred Age <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {ageOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, preferred_age: option.value }));
                    setTouched(prev => ({ ...prev, preferred_age: true }));
                  }}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    formData.preferred_age === option.value 
                      ? 'border-primary-red bg-accent-blush' 
                      : 'border-medium-gray hover:bg-light-gray'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {shouldShowError('preferred_age') && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* 2. Preferred Sex */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              2. Preferred Sex <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {sexOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, preferred_sex: option.value }));
                    setTouched(prev => ({ ...prev, preferred_sex: true }));
                  }}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    formData.preferred_sex === option.value
                      ? 'border-primary-red bg-accent-blush'
                      : 'border-medium-gray hover:bg-light-gray'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {shouldShowError('preferred_sex') && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* 3. Preferred Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              3. Preferred Size <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              {sizeOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, preferred_size: option.value }));
                    setTouched(prev => ({ ...prev, preferred_size: true }));
                  }}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    formData.preferred_size === option.value
                      ? 'border-primary-red bg-accent-blush'
                      : 'border-medium-gray hover:bg-light-gray'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {shouldShowError('preferred_size') && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* 4. Activity Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              4. Activity Level <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
              {activityLevels.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, activity_level: option.value }));
                    setTouched(prev => ({ ...prev, activity_level: true }));
                  }}
                  className={`p-4 border rounded-lg text-center text-sm transition-colors ${
                    formData.activity_level === option.value
                      ? 'border-primary-red bg-accent-blush'
                      : 'border-medium-gray hover:bg-light-gray'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {shouldShowError('activity_level') && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* 5. Hair Length */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              5. Preferred Hair Length <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              {hairLengths.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, hair_length: option.value }));
                    setTouched(prev => ({ ...prev, hair_length: true }));
                  }}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    formData.hair_length === option.value
                      ? 'border-primary-red bg-accent-blush'
                      : 'border-medium-gray hover:bg-light-gray'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {shouldShowError('hair_length') && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* 6. Required Traits */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              6. Required Traits <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2 mt-2">
              {requiredTraits
                .filter(trait => trait.visible)
                .map(trait => (
                  <div key={trait.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={trait.id}
                      name="required_traits"
                      value={trait.id}
                      checked={formData.required_traits?.includes(trait.id) || false}
                      onChange={handleChange}
                      data-exclusive={trait.exclusive || false}
                      className="h-4 w-4 text-primary-red focus:ring-primary-red border-medium-gray rounded"
                    />
                    <label htmlFor={trait.id} className="ml-2 block text-sm text-gray-700">
                      {trait.label}
                    </label>
                  </div>
                ))}
            </div>
            {shouldShowError('required_traits') && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* 7. Special Needs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              7. Would you be open to adopting a pet with special needs? <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-4 mt-2">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="special_needs"
                  value="true"
                  checked={formData.special_needs === true}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-red focus:ring-primary-red border-medium-gray"
                />
                <span className="ml-2 text-sm text-gray-700">Yes</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="special_needs"
                  value="false"
                  checked={formData.special_needs === false}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-red focus:ring-primary-red border-medium-gray"
                />
                <span className="ml-2 text-sm text-gray-700">No</span>
              </label>
            </div>
            {shouldShowError('special_needs') && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Error message */}
          {error && !Object.keys(touched).some(key => touched[key] && error.toLowerCase().includes(key.replace('_', ' '))) && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md border border-red-100">
              {error}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center px-4 py-2 border border-medium-gray shadow-sm text-sm font-medium rounded-md text-charcoal bg-white hover:bg-light-gray focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-red transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isSubmitting ? 'bg-primary-red/70' : 'bg-primary-red hover:bg-primary-red-dark'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-red transition-colors`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Find My Match'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
