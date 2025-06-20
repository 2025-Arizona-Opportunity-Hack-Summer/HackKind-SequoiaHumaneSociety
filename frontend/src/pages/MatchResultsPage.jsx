import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { petService } from "../services/petService";
import api from "../services/api";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format } from 'date-fns';

const getBadgeColor = (label, value) => {
  if (typeof value === 'boolean') {
    return value 
      ? 'bg-green-50 text-green-700 border-green-100' 
      : 'bg-red-50 text-red-700 border-red-100';
  }
  
  const colorMap = {
    species: 'bg-purple-50 text-purple-700 border-purple-100',
    breed: 'bg-blue-50 text-blue-700 border-blue-100',
    age: 'bg-amber-50 text-amber-700 border-amber-100',
    age_group: 'bg-amber-50 text-amber-700 border-amber-100',
    energy: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
    energy_level: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
    coat: 'bg-teal-50 text-teal-700 border-teal-100',
    hair_length: 'bg-teal-50 text-teal-700 border-teal-100',
    'exp level': 'bg-indigo-50 text-indigo-700 border-indigo-100',
    experience_level: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    sex: 'bg-pink-50 text-pink-700 border-pink-100',
    size: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    training: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    training_traits: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    default: 'bg-gray-50 text-gray-700 border-gray-100'
  };
  
  return colorMap[label.toLowerCase()] || colorMap.default;
};

const PetCard = ({ pet, onSelect, isSelected, isRequested }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  
  const renderBadge = (label, value, customColor) => {
    if (value === undefined || value === null || value === '') return null;
    
    let icon = null;
    let displayValue = typeof value === 'boolean' ? '' : value;
    
    if (typeof value === 'boolean') {
      if (value) {
        icon = (
          <svg className="w-3 h-3 ml-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        );
      } else {
        icon = (
          <svg className="w-3 h-3 ml-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      }
    }
    
    const colorClass = customColor || getBadgeColor(label, value);
    
    return (
      <span 
        key={`${label}-${value}`}
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass} mr-2 mb-2`}
      >
        <span className="font-semibold">{label}</span>{displayValue && ': ' + displayValue} {icon}
      </span>
    );
  };
  
  const generatePrimaryBadges = () => {
    const primaryBadges = [
      { label: 'Species', value: pet.species },
      { label: 'Breed', value: pet.breed },
      { label: 'Age', value: pet.age_group },
      { label: 'Sex', value: pet.sex },
      { label: 'Size', value: pet.size },
      { label: 'Energy', value: pet.energy_level },
      { label: 'Coat', value: pet.hair_length },
      { label: 'Exp Level', value: pet.experience_level }
    ];
    
    return primaryBadges
      .filter(badge => badge.value !== undefined && badge.value !== null && badge.value !== '')
      .map(({ label, value, color }) => renderBadge(label, value, color));
  };

  const generateAdditionalBadges = () => {
    const booleanBadges = [
      { label: 'Allergy Friendly', value: pet.allergy_friendly },
      { label: 'Kid Friendly', value: pet.kid_friendly },
      { label: 'Pet Friendly', value: pet.pet_friendly },
      { label: 'Special Needs', value: pet.special_needs }
    ].filter(badge => badge.value !== undefined);

    const trainingBadges = pet.training_traits?.map(trait => ({
      label: trait.replace(/([A-Z])/g, ' $1').trim(),
      value: true,
      color: 'bg-green-50 text-green-700 border-green-100'
    })) || [];
    
    const allAdditionalBadges = [
      ...booleanBadges,
      ...trainingBadges
    ];
    
    return allAdditionalBadges.map(({ label, value, color }) => 
      renderBadge(label, value, color)
    );
  };
  
  const hasAdditionalBadges = 
    (pet.allergy_friendly !== undefined ||
     pet.kid_friendly !== undefined ||
     pet.pet_friendly !== undefined ||
     pet.special_needs !== undefined ||
     (pet.training_traits && pet.training_traits.length > 0));
  
  return (
    <div 
      className={`relative bg-white rounded-xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 ${
        isSelected 
          ? 'ring-2 ring-red-500 shadow-lg' 
          : 'border border-gray-100 hover:shadow-lg hover:border-gray-200'
      } ${isRequested ? 'opacity-80' : 'hover:opacity-95'}`}
      onClick={() => onSelect(pet)}
      style={{
        boxShadow: isSelected ? '0 10px 25px -5px rgba(99, 102, 241, 0.1), 0 10px 10px -5px rgba(99, 102, 241, 0.04)' : 'none'
      }}
    >
      {isRequested && (
        <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full z-10 flex items-center shadow-md">
          <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Visit Scheduled
        </div>
      )}
      
      <div className="relative h-56 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse"></div>
        )}
        {pet.image_url ? (
          <img 
            src={pet.image_url} 
            alt={pet.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-400">No photo available</span>
          </div>
        )}
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 group-hover:text-red-600 transition-colors">
              {pet.name}
            </h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <span className="capitalize">{pet.species}</span>
              {pet.breed && (
                <>
                  <span className="mx-1.5">•</span>
                  <span>{pet.breed}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {pet.special_needs && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                Special Needs
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {generatePrimaryBadges()}
        </div>
        
        {hasAdditionalBadges && (
          <>
            <div className={`overflow-hidden transition-all duration-300 ${showMoreInfo ? 'max-h-96' : 'max-h-0'}`}>
              <div className="flex flex-wrap gap-2 mb-3">
                {generateAdditionalBadges()}
              </div>
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowMoreInfo(!showMoreInfo);
              }}
              className="text-xs font-medium text-red-600 hover:text-red-800 flex items-center"
            >
              {showMoreInfo ? 'Show less' : 'Show more'}
              <svg 
                className={`w-3 h-3 ml-1 transition-transform duration-200 ${showMoreInfo ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </>
        )}
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            {pet.shelter_notes || 'No additional notes available for this pet.'}
          </p>
        </div>
      </div>
    </div>
  );
};

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
  const timeSlots = [];
  for (let hour = 10; hour < 16; hour++) {
    timeSlots.push({
      value: `${hour.toString().padStart(2, '0')}:00`,
      label: `${hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`
    });
    timeSlots.push({
      value: `${hour.toString().padStart(2, '0')}:30`,
      label: `${hour}:30 ${hour >= 12 ? 'PM' : 'AM'}`
    });
  }

  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date);
      }
    }
    return dates;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-6 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-xl leading-6 font-bold text-gray-900" id="modal-title">
                  Meet {pet?.name}!
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Schedule a visit to meet your potential new companion
                </p>
              </div>
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select a date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="block w-full pl-3 pr-10 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-xl shadow-sm"
                    disabled={isLoading}
                    required
                  >
                    <option value="">Choose a date</option>
                    {getAvailableDates().map((date) => {
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      return (
                        <option 
                          key={date.toISOString()} 
                          value={format(date, 'yyyy-MM-dd')}
                          disabled={isWeekend}
                          className={isWeekend ? 'bg-gray-100 text-gray-400' : ''}
                        >
                          {format(date, 'EEEE, MMMM d, yyyy')}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select a time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="time"
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    className="block w-full pl-3 pr-10 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-xl shadow-sm"
                    disabled={isLoading || !visitDate}
                    required
                  >
                    <option value="">Choose a time</option>
                    {timeSlots.map((slot) => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mt-2 bg-red-50 p-4 rounded-xl">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">What to expect</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>• Please arrive 5 minutes before your scheduled time</p>
                      <p>• Bring a valid ID</p>
                      <p>• Plan to spend about 30 minutes with us</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-6 py-4 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-2xl">
            <button
              type="button"
              onClick={onSubmit}
              disabled={isLoading || !visitDate || !visitTime}
              className={`w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-6 py-3 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200 ${
                isLoading || !visitDate || !visitTime
                  ? 'bg-red-300 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Scheduling...
                </>
              ) : (
                'Schedule Visit'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
            >
              Cancel
            </button>
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
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 6,
    hasMore: false
  });

  const checkQuestionnaireCompletion = useCallback(async () => {
    try {
      const response = await api.get('/users/me');
      
      const hasPreferences = response.data?.preferences && 
                           Object.keys(response.data.preferences).length > 0;
      const hasTrainingTraits = response.data?.training_traits && 
                              response.data.training_traits.length > 0;
      
      return hasPreferences || hasTrainingTraits; 
    } catch (error) {
      // Error checking user profile
      return false;
    }
  }, []);

  const fetchMatchedPets = useCallback(async (page = 1, append = false, forceRefresh = false) => {
    try {
      if (page === 1) {
        setIsLoading(true);
        setPets([]);
      } else {
        setIsLoadingMore(true);
      }
      
      setError('');
      
      const hasPreferences = await checkQuestionnaireCompletion();
      
      if (!hasPreferences) {
        throw new Error('Please complete the questionnaire to see your pet matches.');
      }
      
      const response = await petService.getMatches({
        page,
        pageSize: pagination.pageSize,
        forceRefresh: forceRefresh || undefined
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
        
        if (forceRefresh && response.length === 0) {
          toast.info("We couldn't find any matches based on your preferences. Try adjusting your criteria.");
        }
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         'Failed to load pet matches. Please try again.';
      setError(errorMessage);
      
      if (err.response?.status === 403 || err.message.includes('questionnaire')) {
        setError('Please complete the questionnaire to see your pet matches.');
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [pagination.pageSize, checkQuestionnaireCompletion]);
 
  useEffect(() => {
    if (user) {
      const shouldRefresh = location.state?.refreshMatches;
      
      if (shouldRefresh) {
        window.history.replaceState(
          { ...window.history.state, refreshMatches: undefined },
          ''
        );
      }
      
      fetchMatchedPets(1, false, shouldRefresh).catch(() => {
      });
    } else {
      setError('Please log in to view your matches.');
      setIsLoading(false);
    }
  }, [user, fetchMatchedPets, location.state]);

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
      const dateTime = new Date(`${visitDate}T${visitTime}`);
      
      await api.post(`/visit-requests/${selectedPet.id}`, {
        requested_at: dateTime.toISOString()
      });
      
      setRequestedVisits(prev => [...prev, selectedPet.id]);
      
      const petName = selectedPet.name;
      setSelectedPet(null);
      setVisitDate("");
      setVisitTime("");
      
      toast.success(`Visit request submitted for ${petName}!`, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err) {
      // Error submitting visit request
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
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Complete Questionnaire
              </a>
            ) : error.includes('log in') ? (
              <a
                href="/login"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Log In
              </a>
            ) : (
              <button
                onClick={() => fetchMatchedPets(1)}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
                        isLoadingMore ? 'bg-primary-red/80' : 'bg-primary-red hover:bg-primary-red-dark'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-red`}
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
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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