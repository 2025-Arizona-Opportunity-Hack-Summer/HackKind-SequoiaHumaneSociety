import { useState, useEffect } from 'react';

export default function QuestionnaireStep1({ onNext, formData, setFormData, errors = {} }) {
  const [showChildrenQuestion, setShowChildrenQuestion] = useState(false);
  const [touched, setTouched] = useState({
    pet_type: false,
    pet_purpose: false,
    has_children: false,
    has_pets: false,
    ownership_experience: false
  });

  const shouldShowError = (field) => {
    return touched[field] && errors[field];
  };

  // Update touched state when errors change
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const newTouched = { ...touched };
      Object.keys(errors).forEach(field => {
        if (errors[field] && !touched[field]) {
          newTouched[field] = true;
        }
      });
      setTouched(newTouched);
    }
  }, [errors]);

  const petTypes = [
    { value: 'Dog', label: 'Dog' },
    { value: 'Cat', label: 'Cat' },
    { value: 'NoPreference', label: 'No Preference' }
  ];

  const petPurposes = [
    { value: 'Myself', label: 'Myself' },
    { value: 'MyFamily', label: 'My Family' }
  ];

  const currentPetsOptions = [
    { value: 'none', label: 'None' },
    { value: 'Dog', label: 'Dog(s)' },
    { value: 'Cat', label: 'Cat(s)' },
    { value: 'Both', label: 'Both dog(s) and cat(s)' }
  ];

  const experienceLevels = [
    { value: 'FirstTime', label: 'First-time' },
    { value: 'HadBefore', label: 'Had pets before' },
    { value: 'CurrentlyHave', label: 'Currently have pets' }
  ];

  useEffect(() => {
    if (formData.pet_purpose === 'MyFamily') {
      setShowChildrenQuestion(true);
    }
  }, []);

  // Initialize showChildrenQuestion based on saved data
  useEffect(() => {
    if (formData.pet_purpose === 'MyFamily') {
      setShowChildrenQuestion(true);
    }
  }, [formData.pet_purpose]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    if (name === 'pet_purpose') {
      const willShowChildren = value === 'MyFamily';
      setShowChildrenQuestion(willShowChildren);
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        has_children: willShowChildren ? prev.has_children : undefined
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? newValue : value
      }));
    }
    
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const hasError = (field) => {
    return touched[field] && errors[field];
  };

  const getErrorClass = (field) => {
    return hasError(field) ? 'border-red-500' : 'border-medium-gray';
  };

  const handleNext = (e) => {
    e.preventDefault();
    // Mark all fields as touched to show all errors
    const allTouched = Object.keys(touched).reduce((acc, key) => ({
      ...acc,
      [key]: true
    }), {});
    setTouched(allTouched);
    
    onNext();
  };

  return (
    <form onSubmit={handleNext} className="w-full">
      <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">About You – Step 1 of 2</h2>
        
        <div className="space-y-6">
          {/* 1. Pet Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              1. What type of pet do you want to adopt? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {petTypes.map((pet) => (
                <button
                  key={pet.value}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, pet_type: pet.value }));
                    setTouched(prev => ({ ...prev, pet_type: true }));
                  }}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    formData.pet_type === pet.value 
                      ? 'border-primary-red bg-accent-blush' 
                      : `${hasError('pet_type') ? 'border-red-500' : 'border-medium-gray'} hover:bg-light-gray`
                  }`}
                >
                  {pet.label}
                </button>
              ))}
            </div>
            {hasError('pet_type') && (
              <p className="mt-1 text-sm text-red-600">{errors.pet_type}</p>
            )}
          </div>

          {/* 2. Pet Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              2. Who is this pet for? <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2 mt-2">
              {petPurposes.map((purpose) => (
                <div 
                  key={purpose.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.pet_purpose === purpose.value 
                      ? 'border-primary-red bg-accent-blush' 
                      : `${hasError('pet_purpose') ? 'border-red-500' : 'border-medium-gray'} hover:bg-light-gray`
                  }`}
                  onClick={() => {
                    const willShowChildren = purpose.value === 'MyFamily';
                    setShowChildrenQuestion(willShowChildren);
                    setFormData(prev => ({
                      ...prev,
                      pet_purpose: purpose.value,
                      has_children: willShowChildren ? prev.has_children : undefined
                    }));
                    setTouched(prev => ({ ...prev, pet_purpose: true }));
                  }}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="pet_purpose"
                      value={purpose.value}
                      checked={formData.pet_purpose === purpose.value}
                      onChange={() => {}}
                      className="h-4 w-4 text-primary-red focus:ring-primary-red border-medium-gray"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      {purpose.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {hasError('pet_purpose') && (
              <p className="mt-1 text-sm text-red-600">{errors.pet_purpose}</p>
            )}
          </div>

          {/* 2a. Children in home (conditional) */}
          {showChildrenQuestion && (
            <div className="ml-6 pl-4 border-l-2 border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Are there children in the home? <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-4">
                {[
                  { value: true, label: 'Yes' },
                  { value: false, label: 'No' }
                ].map((option) => (
                  <label key={option.value} className="inline-flex items-center">
                    <input
                      type="radio"
                      name="has_children"
                      checked={formData.has_children === option.value}
                      onChange={() => {
                        setFormData(prev => ({ ...prev, has_children: option.value }));
                        setTouched(prev => ({ ...prev, has_children: true }));
                      }}
                      className="h-4 w-4 text-primary-red focus:ring-primary-red border-medium-gray"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
              {shouldShowError('has_children') && (
                <p className="mt-1 text-sm text-red-600">{errors.has_children}</p>
              )}
            </div>
          )}

          {/* 3. Current Pets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              3. Do you currently own any pets? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {currentPetsOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, has_pets: option.value }));
                    setTouched(prev => ({ ...prev, has_pets: true }));
                  }}
                  className={`p-3 text-sm border rounded-lg transition-colors ${
                    formData.has_pets === option.value 
                      ? 'border-primary-red bg-accent-blush' 
                      : 'border-medium-gray hover:bg-light-gray'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {shouldShowError('has_pets') && (
              <p className="mt-1 text-sm text-red-600">{errors.has_pets}</p>
            )}
          </div>

          {/* 4. Ownership Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              4. What is your previous pet ownership experience? <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2 mt-2">
              {experienceLevels.map((level) => (
                <div 
                  key={level.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.ownership_experience === level.value 
                      ? 'border-primary-red bg-accent-blush' 
                      : 'border-medium-gray hover:bg-light-gray'
                  }`}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, ownership_experience: level.value }));
                    setTouched(prev => ({ ...prev, ownership_experience: true }));
                  }}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="ownership_experience"
                      value={level.value}
                      checked={formData.ownership_experience === level.value}
                      onChange={() => {}}
                      className="h-4 w-4 text-primary-red focus:ring-primary-red border-medium-gray"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      {level.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {shouldShowError('ownership_experience') && (
              <p className="mt-1 text-sm text-red-600">{errors.ownership_experience}</p>
            )}
          </div>
          
          {/* Next Button */}
          <div className="pt-6 border-t border-gray-200">
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-red hover:bg-primary-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-red transition-colors"
            >
              Next: Pet Preferences
            </button>
            
            {Object.keys(errors).length > 0 && !Object.values(touched).some(t => t) && (
              <p className="mt-2 text-sm text-red-600 text-center">
                {Object.values(errors).filter(Boolean)[0]}
              </p>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
