import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { petService } from "../services/petService";
import api from "../services/api";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format } from 'date-fns';

// Helper component for the pet card
const PetCard = ({ pet, onSelect, isSelected, isRequested }) => (
  <div 
    className={`relative rounded-lg overflow-hidden shadow-md transition-all duration-300 transform hover:scale-105 ${
      isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'
    } ${isRequested ? 'opacity-75' : ''}`}
    onClick={() => onSelect(pet)}
  >
    {isRequested && (
      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
        Visit Requested
      </div>
    )}
    <div className="h-48 bg-gray-200 overflow-hidden">
      {pet.photo_url ? (
        <img 
          src={pet.photo_url} 
          alt={pet.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
          }}
        />
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400">No image available</span>
        </div>
      )}
    </div>
    <div className="p-4">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-gray-900">{pet.name}</h3>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {pet.breed}
        </span>
      </div>
      <div className="mt-2 flex items-center text-sm text-gray-600">
        <span className="capitalize">{pet.gender}</span>
        <span className="mx-1">•</span>
        <span>{pet.age}</span>
        <span className="mx-1">•</span>
        <span className="capitalize">{pet.size}</span>
      </div>
      <p className="mt-2 text-sm text-gray-500 line-clamp-2">
        {pet.description || 'No description available.'}
      </p>
      <div className="mt-3 flex flex-wrap gap-1">
        {pet.temperament?.slice(0, 3).map((trait, idx) => (
          <span 
            key={idx} 
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
          >
            {trait}
          </span>
        ))}
      </div>
    </div>
  </div>
);

// Helper component for the visit request modal
const VisitRequestModal = ({ 
  isOpen, 
  onClose, 
  pet, 
  onSubmit, 
  isLoading, 
  error,
  visitDate,
  setVisitDate,
  visitTime,
  setVisitTime
}) => {
  if (!isOpen) return null;
  
  // Generate time slots (10am-4pm in 30 min intervals)
  const timeSlots = [];
  for (let hour = 10; hour < 16; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  // Get dates for the next 14 days
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      // Skip Sundays (0) and Saturdays (6)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date);
      }
    }
    return dates;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              Schedule a Visit with {pet?.name}
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select a Date <span className="text-red-500">*</span>
              </label>
              <select
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                disabled={isLoading}
                required
              >
                <option value="">Select a date</option>
                {getAvailableDates().map((date) => (
                  <option key={date.toISOString()} value={format(date, 'yyyy-MM-dd')}>
                    {format(date, 'EEEE, MMMM d, yyyy')}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select a Time <span className="text-red-500">*</span>
              </label>
              <select
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                disabled={isLoading || !visitDate}
                required
              >
                <option value="">Select a time</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={isLoading || !visitDate || !visitTime}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                  isLoading || !visitDate || !visitTime
                    ? 'bg-indigo-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {isLoading ? 'Sending...' : 'Schedule Visit'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MatchResultsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestedVisits, setRequestedVisits] = useState([]);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 6,
    hasMore: false
  });

  // Check if user has completed the questionnaire
  const checkQuestionnaireCompletion = useCallback(async () => {
    try {
      const profileResponse = await api.get('/users/me');
      const hasPreferences = profileResponse.data?.preferences && 
                           Object.keys(profileResponse.data.preferences).length > 0;
      
      if (!hasPreferences) {
        console.log('No preferences found for user');
        return false;
      }
      
      return true;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('User profile not found, assuming no preferences');
        return false;
      }
      console.error('Error checking user profile:', error);
      throw error;
    }
  }, []);

  // Fetch matched pets from the backend
  const fetchMatchedPets = useCallback(async (page = 1, append = false, forceRefresh = false) => {
    try {
      if (page === 1) {
        setIsLoading(true);
        setPets([]);
      } else {
        setIsLoadingMore(true);
      }
      
      setError('');
      
      try {
        const hasPreferences = await checkQuestionnaireCompletion();
        
        if (!hasPreferences) {
          // If no preferences but we have a force refresh, it means we just completed the questionnaire
          if (forceRefresh) {
            // Wait a moment and try again
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchMatchedPets(page, append, false);
          }
          throw new Error('No Matches Found'); // Original error message: 'Please complete the questionnaire to see your pet matches.'
        }
        
        const response = await petService.getMatches({
          page,
          pageSize: pagination.pageSize,
          forceRefresh: forceRefresh || undefined // Only include if true
        });
        
        if (response && Array.isArray(response)) {
          setPets(prev => {
            const newPets = append ? [...prev, ...response] : response;
            const uniquePets = Array.from(new Map(newPets.map(pet => [pet.id, pet])).values());
            return uniquePets;
          });
          
          setPagination(prev => ({
            ...prev,
            hasMore: response.length === pagination.pageSize,
            page
          }));
          
          // Reset retry count on successful fetch
          setRetryCount(0);
          
          // If we forced a refresh but got no results, show a message
          if (forceRefresh && response.length === 0) {
            toast.info("We couldn't find any matches based on your preferences. Try adjusting your criteria.");
          }
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (err) {
        console.error('Error:', err);
        const errorMessage = err.response?.data?.message || 
                           err.message || 
                           'Failed to load pet matches. Please try again.';
        setError(errorMessage);
        
        if (err.response?.status === 403 || err.message.includes('questionnaire')) {
          setError('Please complete the questionnaire to see your pet matches.');
        }
        throw err;
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [pagination.pageSize, checkQuestionnaireCompletion]);

  // Handle retry mechanism
  const handleRetry = useCallback(() => {
    setRetryCount(prev => {
      const newCount = prev + 1;
      if (newCount <= 3) { // Limit number of retries
        fetchMatchedPets(1);
      }
      return newCount;
    });
  }, [fetchMatchedPets]);

  // Initial load and retry effect
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        // Check if we need to force refresh (e.g., after questionnaire completion)
        const shouldRefresh = location.state?.refreshMatches;
        
        // Clear the refresh flag from location state to prevent refetching on re-renders
        if (shouldRefresh) {
          // Replace current entry in history to remove the refresh flag
          window.history.replaceState(
            { ...window.history.state, refreshMatches: undefined },
            ''
          );
        }
        
        // Always fetch fresh data when coming from questionnaire
        fetchMatchedPets(1, false, shouldRefresh).catch(() => {
          // Error is already handled in fetchMatchedPets
        });
      }, retryCount > 0 ? 2000 : 0);
      
      return () => clearTimeout(timer);
    } else {
      setError('Please log in to view your matches.');
      setIsLoading(false);
    }
  }, [user, retryCount, fetchMatchedPets, location.state]);

  const handleLoadMore = () => {
    if (!isLoadingMore && pagination.hasMore) {
      fetchMatchedPets(pagination.page + 1, true);
    }
  };

  const handleSubmitRequest = async () => {
    if (!visitDate || !visitTime) {
      setError("Please select both a date and time.");
      return;
    }

    if (!selectedPet) {
      setError("No pet selected for visit.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Combine date and time into a single ISO string
      const dateTime = new Date(`${visitDate}T${visitTime}`);
      
      // Send the visit request to the backend
      await api.post(`/visit-requests`, {
        pet_id: selectedPet.id,
        requested_date: dateTime.toISOString(),
        status: 'pending'
      });
      
      // Update local state
      setRequestedVisits(prev => [...prev, selectedPet.id]);
      
      // Clear modal state
      const petName = selectedPet.name;
      setSelectedPet(null);
      setVisitDate("");
      setVisitTime("");
      
      // Show success toast - this will only trigger after successful submission
      toast.success(`Visit request submitted for ${petName}!`, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err) {
      console.error('Error submitting visit request:', err);
      const errorMessage = err.response?.data?.message || 'Failed to submit visit request. Please try again.';
      setError(errorMessage);
      
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePetSelect = (pet) => {
    setSelectedPet(pet);
    setError('');
  };

  const closeModal = () => {
    setSelectedPet(null);
    setVisitDate('');
    setVisitTime('');
    setError('');
  };

  // Format date to display in the UI
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Your Perfect Matches
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Based on your preferences, we've found these wonderful pets that might be a great fit for you.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center p-8 max-w-2xl mx-auto bg-white rounded-lg shadow">
            <div className="text-red-500 mb-6 text-lg">{error}</div>
            {error.includes('questionnaire') ? (
              <a 
                href="/questionnaire" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Complete Questionnaire
              </a>
            ) : error.includes('log in') ? (
              <a
                href="/login"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Log In
              </a>
            ) : (
              <button
                onClick={() => fetchMatchedPets(1)}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Try Again
              </button>
            )}
          </div>
        ) : (
          <>
            {pets.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {pets.map((pet) => (
                    <PetCard
                      key={pet.id}
                      pet={pet}
                      onSelect={handlePetSelect}
                      isSelected={selectedPet?.id === pet.id}
                      isRequested={requestedVisits.includes(pet.id)}
                    />
                  ))}
                </div>
                
                {pagination.hasMore && (
                  <div className="mt-10 text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                        isLoadingMore ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    >
                      {isLoadingMore ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading...
                        </>
                      ) : (
                        'Load More Matches'
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No matches found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  We couldn't find any pets that match your current preferences. Try adjusting your criteria.
                </p>
                <div className="mt-6">
                  <a
                    href="/questionnaire"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 1 1 0 001.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                    Update Preferences
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Visit Request Modal */}
      <VisitRequestModal
        isOpen={!!selectedPet}
        onClose={closeModal}
        pet={selectedPet}
        onSubmit={handleSubmitRequest}
        isLoading={isSubmitting}
        error={error}
        visitDate={visitDate}
        setVisitDate={setVisitDate}
        visitTime={visitTime}
        setVisitTime={setVisitTime}
      />

      {/* React Toastify Container - this handles all toast notifications */}
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}