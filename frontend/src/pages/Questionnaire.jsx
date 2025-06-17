import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from 'react-toastify';
import QuestionnaireStep1 from "../components/QuestionnaireStep1";
import QuestionnaireStep2 from "../components/QuestionnaireStep2";
// Removed unused step components since we only need 2 steps
import LoadingSpinner from "../components/common/LoadingSpinner";
import { preferencesService } from "../services/preferencesService";
import { useAuth } from "../contexts/AuthContext";

export default function Questionnaire() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Map form data to API format
      const preferencesData = preferencesService.mapQuestionnaireToPreferences(formData);
      
      // Store preferences in session storage for after registration
      const tempPreferences = {
        preferences: preferencesData,
        redirectTo: '/matches',
        from: location.state?.from || { pathname: '/dashboard' },
        refreshMatches: true
      };
      
      console.log('Storing temp preferences:', tempPreferences);
      sessionStorage.setItem('tempPreferences', JSON.stringify(tempPreferences));
      
      // If user is authenticated, save preferences and go to matches
      if (isAuthenticated) {
        console.log('User is authenticated, saving preferences...');
        await preferencesService.savePreferences(preferencesData);
        toast.success('Preferences saved successfully! Redirecting to your matches...');
        navigate('/matches', { 
          replace: true,
          state: { 
            from: location.state?.from || { pathname: '/dashboard' },
            refreshMatches: true
          }
        });
      } else {
        console.log('User is not authenticated, redirecting to signup...');
        // If not authenticated, redirect to signup with stored preferences
        navigate('/signup', { 
          replace: true,
          state: { 
            from: {
              pathname: '/matches',
              state: { refreshMatches: true }
            },
            savedPreferences: true,
            message: 'Please create an account to save your preferences and view your matches.'
          }
        });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error(error.message || 'Failed to save preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking auth status
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-8">
          {isAuthenticated ? 'Update Your Preferences' : 'Tell Us About Your Ideal Pet'}
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
                    step >= stepNum ? 'bg-blue-600' : 'bg-gray-300'
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
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
