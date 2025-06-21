import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import QuestionnaireStep1 from "../components/QuestionnaireStep1";
import QuestionnaireStep2 from "../components/QuestionnaireStep2";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { preferencesService } from "../services/preferencesService";

const MAX_RETRIES = 3;

export default function Questionnaire() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();


  // Load saved preferences on component mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedPrefs = await preferencesService.getMyPreferences();
        if (savedPrefs && Object.keys(savedPrefs).length > 0) {
          setFormData(prev => ({
            ...prev,
            ...savedPrefs
          }));
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        toast.error('Failed to load saved preferences. Starting with a fresh form.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const validateStep = (step) => {
    const errors = {};
    
    if (step === 1) {
      if (!formData.pet_type) errors.pet_type = 'Please select a pet type';
      if (!formData.pet_purpose) errors.pet_purpose = 'Please select who this pet is for';
      if (formData.pet_purpose === 'MyFamily' && formData.has_children === undefined) {
        errors.has_children = 'Please specify if there are children in the home';
      }
      if (formData.has_pets === undefined) errors.has_pets = 'Please specify if you have other pets';
      if (!formData.ownership_experience) errors.ownership_experience = 'Please select your experience level';
    } else if (step === 2) {
      if (!formData.preferred_age) errors.preferred_age = 'Please select a preferred age';
      if (!formData.preferred_sex) errors.preferred_sex = 'Please select a preferred gender';
      if (!formData.preferred_size) errors.preferred_size = 'Please select a preferred size';
      if (!formData.activity_level) errors.activity_level = 'Please select an activity level';
      if (!formData.hair_length) errors.hair_length = 'Please select a hair length';
      if (!formData.required_traits || formData.required_traits.length === 0) {
        errors.required_traits = 'Please select at least one required trait or "None"';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(step)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    if (step < 2) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFormErrors({});
    
    try {
      const preferencesData = preferencesService.mapQuestionnaireToPreferences(formData);
      await preferencesService.savePreferences(preferencesData);
      
      toast.success('Preferences saved successfully! Redirecting to your matches...');
      
      navigate('/match-results', {
        replace: true,
        state: {
          refreshMatches: true,
        },
      });
    } catch (error) {
      let errorMessage = 'Failed to save preferences. ';
      
      if (error.response) {
        if (error.response.status === 422) {
          errorMessage += 'Validation error. Please check your inputs and try again.';
          const validationErrors = error.response.data?.errors || {};
          setFormErrors(validationErrors);
        } else if (error.response.status >= 500) {
          errorMessage += 'Server error. Please try again later.';
          if (retryCount < MAX_RETRIES) {
            setRetryCount(prev => prev + 1);
            toast.warning(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
            setTimeout(handleSubmit, 1000 * retryCount);
            return;
          }
        }
      } else if (error.request) {
        errorMessage += 'No response from server. Please check your connection and try again.';
      } else {
        errorMessage += error.message || 'An unexpected error occurred.';
      }
      
      if (retryCount >= MAX_RETRIES) {
        errorMessage += ' Maximum retry attempts reached.';
      }
      
      toast.error(errorMessage);
      
      if (error.response?.status >= 500) {
        // Error will be caught by the ErrorBoundary in index.js
        throw error;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-8">
          Tell Us About Your Ideal Pet
        </h1>
        
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <LoadingSpinner size="large" />
              <p className="mt-4 text-center">Saving your preferences...</p>
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center min-h-96">
            <LoadingSpinner size="large" />
            <span className="ml-3">Loading your preferences...</span>
          </div>
        ) : (
          <div className="relative">
            {/* Progress indicator */}
            <div className="flex justify-between mb-8 px-8 max-w-md mx-auto">
              {[1, 2].map((stepNum) => (
                <div key={stepNum} className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                      step >= stepNum ? 'bg-primary-red' : 'bg-light-gray'
                    }`}
                  >
                    {stepNum}
                  </div>
                  <span className="text-xs mt-1">
                    {stepNum === 1 ? 'Your Info' : 'Pet Preferences'}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Form steps */}
            <div className="min-h-96">
              {/* Global form errors */}
              {Object.keys(formErrors).length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500">
                  <h3 className="text-red-700 font-medium">Please fix the following errors:</h3>
                  <ul className="list-disc pl-5 mt-2 text-red-600">
                    {Object.values(formErrors).map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {step === 1 && (
                <QuestionnaireStep1 
                  onNext={handleNext} 
                  formData={formData} 
                  setFormData={setFormData} 
                  errors={formErrors}
                />
              )}
              {step === 2 && (
                <QuestionnaireStep2 
                  onNext={handleNext}
                  onBack={handleBack}
                  formData={formData} 
                  setFormData={setFormData}
                  isSubmitting={isSubmitting}
                  errors={formErrors}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
