import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { format, addDays, isWeekend } from 'date-fns';

// Fallback image for when pet images fail to load
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';

// Generate available time slots (10 AM to 4 PM, every 30 minutes)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 10; hour < 16; hour++) {
    slots.push({
      value: `${hour.toString().padStart(2, '0')}:00`,
      label: `${hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`
    });
    slots.push({
      value: `${hour.toString().padStart(2, '0')}:30`,
      label: `${hour}:30 ${hour >= 12 ? 'PM' : 'AM'}`
    });
  }
  return slots;
};

// Get available dates (next 14 weekdays)
const getAvailableDates = () => {
  const dates = [];
  const today = new Date();
  
  for (let i = 1; i <= 14; i++) {
    const date = addDays(today, i);
    if (!isWeekend(date)) {
      dates.push(date);
    }
  }
  return dates;
};

const PetModal = ({ pet, onClose, onNext, onPrev, hasNext, hasPrev, onRequestVisit }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [activeImage, setActiveImage] = useState(pet.primary_photo_url?.large || pet.primary_photo_url || FALLBACK_IMAGE);
  const [isScheduling, setIsScheduling] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const timeSlots = generateTimeSlots();
  const availableDates = getAvailableDates();
  // Close modal when clicking outside content
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNext();
      } else if (e.key === 'ArrowLeft' && hasPrev) {
        onPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev, hasNext, hasPrev]);

  if (!pet) return null;

  const handleImageError = (e) => {
    if (e.target.src !== FALLBACK_IMAGE) {
      e.target.src = FALLBACK_IMAGE;
      setImageError(true);
    }
  };
  
  // Get the pet's image URL, falling back to the primary photo URL if available
  const getPetImageUrl = () => {
    if (pet.image_url) return pet.image_url;
    if (pet.primary_photo_url?.large) return pet.primary_photo_url.large;
    if (pet.primary_photo_url) return pet.primary_photo_url;
    return FALLBACK_IMAGE;
  };
  
  const petImageUrl = getPetImageUrl();

  const handleSignUp = () => {
    navigate('/signup', { state: { from: 'pet', petId: pet.id } });
  };

  const handleLogin = () => {
    navigate('/login', { state: { from: 'pet', petId: pet.id } });
  };

  const handleStartScheduling = () => {
    setIsScheduling(true);
  };

  const handleCancelScheduling = () => {
    setIsScheduling(false);
    setVisitDate('');
    setVisitTime('');
    setError('');
  };

  const handleSubmitVisit = async (e) => {
    e.preventDefault();
    
    // Reset any previous errors
    setError('');
    
    // Validate inputs
    if (!visitDate || !visitTime) {
      const errorMsg = 'Please select both date and time';
      setError(errorMsg);
      if (window.toast) {
        window.toast.error(errorMsg, { position: 'top-center', autoClose: 5000 });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the onRequestVisit prop with the selected date and time
      const result = await onRequestVisit(visitDate, visitTime);
      
      // Check the result object for success/error
      if (result && result.success) {
        // Show success toast with the message from the result or a default one
        const successMessage = result.message || 'Visit request submitted successfully!';
        if (window.toast) {
          window.toast.success(successMessage, {
            position: 'top-center',
            autoClose: 5000,
          });
        }
        
        // Close the modal after a short delay to allow the toast to be seen
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        // Handle error case from the result object
        const errorMessage = result?.message || 'Failed to schedule visit. Please try again.';
        
        // Show error toast
        if (window.toast) {
          window.toast.error(errorMessage, {
            position: 'top-center',
            autoClose: 5000,
          });
        }
        
        // Close the modal after showing the error
        setTimeout(() => {
          onClose();
        }, 1000);
      }
      
    } catch (err) {
      // This catch block is now only for unexpected errors
      console.error('Unexpected error in handleSubmitVisit:', err);
      
      // Show a generic error message for unexpected errors
      const errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (window.toast) {
        window.toast.error(errorMessage, {
          position: 'top-center',
          autoClose: 5000,
        });
      }
      
      // Close the modal on any error
      setTimeout(() => {
        onClose();
      }, 1000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 bg-white rounded-full p-2 shadow-md hover:bg-red-50 z-10 transition-colors"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6 text-red-700" />
        </button>

        <div className="grid md:grid-cols-2 gap-8 p-8">
          {/* Pet Images */}
          <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden">
            <img
              src={petImageUrl}
              alt={pet.name}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          </div>

          {/* Pet Details */}
          <div className="space-y-6 p-4">
            <h2 className="text-3xl font-bold text-gray-900 border-b pb-2">{pet.name}</h2>

            {/* Summary Section */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">About {pet.name}</h3>
              <div className="bg-red-50 p-6 rounded-lg border border-red-100">
                <p className="text-gray-800 leading-relaxed">
                  {pet.summary || pet.description || `${pet.name} is a wonderful companion looking for a loving home.`}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-4">
              {!user ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 text-center">Sign up or log in to request a visit</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleSignUp}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 shadow-sm"
                    >
                      Sign Up
                    </button>
                    <button
                      onClick={handleLogin}
                      className="bg-white hover:bg-gray-50 text-red-600 font-medium py-3 px-4 border border-red-300 rounded-lg transition-colors duration-200 shadow-sm"
                    >
                      Log In
                    </button>
                  </div>
                </div>
              ) : isScheduling ? (
                <form onSubmit={handleSubmitVisit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                      <p className="text-sm">{error}</p>
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                      Select a date <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    >
                      <option value="">Choose a date</option>
                      {availableDates.map((date) => (
                        <option key={date.toISOString()} value={format(date, 'yyyy-MM-dd')}>
                          {format(date, 'EEEE, MMMM d, yyyy')}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                      Select a time <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="time"
                      value={visitTime}
                      onChange={(e) => setVisitTime(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      disabled={!visitDate}
                      required
                    >
                      <option value="">Choose a time</option>
                      {timeSlots.map((slot) => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                    <h4 className="text-sm font-medium text-red-800 mb-1">What to expect</h4>
                    <ul className="text-xs text-red-700 space-y-1">
                      <li>• Please arrive 5 minutes before your scheduled time</li>
                      <li>• Bring a valid ID</li>
                      <li>• Plan to spend about 30 minutes with us</li>
                    </ul>
                  </div>
                  
                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCancelScheduling}
                      className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                      disabled={isSubmitting || !visitDate || !visitTime}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Scheduling...
                        </>
                      ) : 'Schedule Visit'}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={handleStartScheduling}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm"
                >
                  Schedule a Visit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {hasPrev && (
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-2 md:-left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm"
            aria-label="Previous pet"
          >
            <svg className="h-6 w-6 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {hasNext && (
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-2 md:-right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm"
            aria-label="Next pet"
          >
            <svg className="h-6 w-6 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default PetModal;
