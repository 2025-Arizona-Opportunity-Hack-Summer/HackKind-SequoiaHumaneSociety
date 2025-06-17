import { useState, useEffect } from "react";

export default function QuestionnaireStep3({ onNext, onBack, formData, setFormData }) {
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({
    gender: false,
    size: false,
    activity: false,
    age: false
  });

  const isDog = formData.petType === "dog";
  const isCat = formData.petType === "cat";

  // Age options based on pet type
  const getAgeOptions = () => {
    const baseOptions = [
      { value: 'young', label: 'Young (1-3 years)' },
      { value: 'adult', label: 'Adult (3-7 years)' },
      { value: 'senior', label: 'Senior (7+ years)' },
    ];
    
    const puppyKittenOption = isDog 
      ? { value: 'puppy', label: 'Puppy (under 1 year)' }
      : { value: 'kitten', label: 'Kitten (under 1 year)' };
    
    return [
      { value: '', label: 'No preference' },
      puppyKittenOption,
      ...baseOptions
    ];
  };

  // Validate form whenever formData changes
  useEffect(() => {
    if (error) validateForm();
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const validateForm = () => {
    const errors = [];
    const requiredFields = ['gender', 'size', 'activity', 'age'];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        errors.push(`Please select a preference for ${field}`);
      }
    });

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
    return touched[field] && error.includes(field);
  };

  const selectClasses = (field) => 
    `mt-1 block w-full pl-3 pr-10 py-2 text-base border ${
      shouldShowError(field) ? 'border-red-500' : 'border-gray-300'
    } focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md`;

  return (
    <form onSubmit={handleNext} className="w-full">
      <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Pet Preferences – Step 3 of 4</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              5. Preferred gender? <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 space-y-2">
              {[
                { value: '', label: 'No preference' },
                { value: 'female', label: 'Female' },
                { value: 'male', label: 'Male' },
              ].map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value={option.value}
                    checked={formData.gender === option.value}
                    onChange={handleChange}
                    onBlur={() => setTouched(prev => ({ ...prev, gender: true }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
            {shouldShowError('gender') && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              6. Preferred size? <span className="text-red-500">*</span>
            </label>
            <select
              name="size"
              value={formData.size || ""}
              onChange={handleChange}
              onBlur={() => setTouched(prev => ({ ...prev, size: true }))}
              className={selectClasses('size')}
              required
            >
              <option value="">Select a size</option>
              <option value="small">Small (under 20 lbs / 9 kg)</option>
              <option value="medium">Medium (20-50 lbs / 9-23 kg)</option>
              <option value="large">Large (50-90 lbs / 23-41 kg)</option>
              <option value="xl">Extra Large (90+ lbs / 41+ kg)</option>
            </select>
            {shouldShowError('size') && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              7. Preferred activity level? <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 bg-gray-50 p-4 rounded-lg">
              {[
                { 
                  value: 'lap', 
                  label: 'Lap Pet', 
                  description: 'Prefers cuddles and naps, minimal exercise needed' 
                },
                { 
                  value: 'calm', 
                  label: 'Calm', 
                  description: 'Enjoys short walks and play sessions' 
                },
                { 
                  value: 'moderate', 
                  label: 'Moderately Active', 
                  description: 'Needs regular walks and playtime' 
                },
                { 
                  value: 'active', 
                  label: 'Very Active', 
                  description: 'Requires lots of exercise and mental stimulation' 
                },
              ].map((option) => (
                <label key={option.value} className="flex items-start p-3 rounded hover:bg-gray-100">
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      name="activity"
                      value={option.value}
                      checked={formData.activity === option.value}
                      onChange={handleChange}
                      onBlur={() => setTouched(prev => ({ ...prev, activity: true }))}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <span className="font-medium text-gray-700">{option.label}</span>
                    <p className="text-gray-500">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
            {shouldShowError('activity') && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              8. Preferred age? <span className="text-red-500">*</span>
            </label>
            <select
              name="age"
              value={formData.age || ""}
              onChange={handleChange}
              onBlur={() => setTouched(prev => ({ ...prev, age: true }))}
              className={selectClasses('age')}
              required
            >
              {getAgeOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {shouldShowError('age') && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>

        {error && !Object.values(touched).some(t => t) && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="-ml-1 mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Next Step
            <svg className="ml-2 -mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}
