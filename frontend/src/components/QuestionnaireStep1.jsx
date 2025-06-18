import { useState, useEffect } from 'react';

export default function QuestionnaireStep1({ onNext, formData, setFormData }) {
  const [error, setError] = useState("");
  const [showChildrenQuestion, setShowChildrenQuestion] = useState(false);
  const [touched, setTouched] = useState({
    pet_type: false,
    pet_purpose: false,
    has_children: false,
    has_pets: false,
    ownership_experience: false
  });

  // Pet type options
  const petTypes = [
    { value: 'Dog', label: 'Dog' },
    { value: 'Cat', label: 'Cat' }
  ];

  // Pet purpose options
  const petPurposes = [
    { value: 'Myself', label: 'Myself' },
    { value: 'MyFamily', label: 'My Family' }
  ];

  // Current pets options
  const currentPetsOptions = [
    { value: 'none', label: 'None' },
    { value: 'Dog', label: 'Dog(s)' },
    { value: 'Cat', label: 'Cat(s)' },
    { value: 'Both', label: 'Both dog(s) and cat(s)' }
  ];

  // Ownership experience options
  const experienceLevels = [
    { value: 'FirstTime', label: 'First-time' },
    { value: 'HadBefore', label: 'Had pets before' },
    { value: 'CurrentlyHave', label: 'Currently have pets' }
  ];

  // Initialize showChildrenQuestion based on initial form data
  useEffect(() => {
    if (formData.pet_purpose === 'MyFamily') {
      setShowChildrenQuestion(true);
    }
  }, []);

  // Validate form whenever formData changes
  useEffect(() => {
    if (error) validateForm();
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    // Show/hide children question based on pet purpose
    if (name === 'pet_purpose') {
      const willShowChildren = value === 'MyFamily';
      setShowChildrenQuestion(willShowChildren);
      
      // Update form data with the new purpose and reset has_children if needed
      setFormData(prev => ({
        ...prev,
        [name]: value,
        has_children: willShowChildren ? prev.has_children : undefined
      }));
    } else {
      // For all other fields
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? newValue : value
      }));
    }
    
    // Mark the field as touched
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.pet_type) {
      errors.push("Please select a pet type");
    }
    
    if (!formData.pet_purpose) {
      errors.push("Please select who this pet is for");
    }
    
    if (showChildrenQuestion && formData.has_children === undefined) {
      errors.push("Please indicate if there are children in the home");
    }
    
    if (!formData.has_pets) {
      errors.push("Please indicate if you currently own any pets");
    }
    
    if (!formData.ownership_experience) {
      errors.push("Please select your previous pet ownership experience");
    }

    setError(errors.length > 0 ? errors[0] : "");
    return errors.length === 0;
  };

  const handleNext = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onNext();
    }
  };

  // Show error only after the field is touched
  const shouldShowError = (field) => {
    return touched[field] && error.toLowerCase().includes(field.replace('_', ' '));
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
            <div className="grid grid-cols-2 gap-3 mt-2">
              {petTypes.map((pet) => (
                <button
                  key={pet.value}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, pet_type: pet.value }));
                    setTouched(prev => ({ ...prev, pet_type: true }));
                  }}
                  className={`p-4 border rounded-lg text-center ${
                    formData.pet_type === pet.value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pet.label}
                </button>
              ))}
            </div>
            {shouldShowError('pet_type') && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
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
                  className={`p-3 border rounded-lg cursor-pointer ${
                    formData.pet_purpose === purpose.value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    const willShowChildren = purpose.value === 'family';
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
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      {purpose.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {shouldShowError('pet_purpose') && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
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
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
              {shouldShowError('has_children') && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
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
                  className={`p-2 text-sm border rounded ${
                    formData.has_pets === option.value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {shouldShowError('has_pets') && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
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
                  className={`p-3 border rounded-lg cursor-pointer ${
                    formData.ownership_experience === level.value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:bg-gray-50'
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
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      {level.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {shouldShowError('ownership_experience') && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>
          
          {/* Next Button */}
          <div className="pt-6 border-t border-gray-200">
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Next: Pet Preferences
            </button>
            
            {error && !Object.values(touched).some(t => t) && (
              <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
