import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import QuestionnaireStep1 from "../components/QuestionnaireStep1";
import QuestionnaireStep2 from "../components/QuestionnaireStep2";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { preferencesService } from "../services/preferencesService";

export default function Questionnaire() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
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
      let errorMessage = 'Failed to save preferences. Please try again.';
      
      if (error.response) {
        if (error.response.status === 422) {
          errorMessage = 'Validation error. Please check your inputs and try again.';
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection and try again.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
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
            {step === 1 && (
              <QuestionnaireStep1 
                onNext={() => setStep(2)} 
                formData={formData} 
                setFormData={setFormData} 
              />
            )}
            {step === 2 && (
              <QuestionnaireStep2 
                onNext={handleSubmit}
                onBack={() => setStep(1)}
                formData={formData} 
                setFormData={setFormData}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
