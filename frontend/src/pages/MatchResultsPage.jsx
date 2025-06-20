import { useState, useEffect, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { petService } from "../services/petService";
import api from "../services/api";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import PetCard from '../components/pets/PetCard';
import PetModal from '../components/pets/PetModal';
import MatchResultsHeader from '../components/MatchResultsHeader';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import LoadMoreButton from '../components/ui/LoadMoreButton';

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
      
      fetchMatchedPets(1, false, shouldRefresh).catch(() => {});
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

  // handleSubmitRequest has been replaced with handleRequestVisit

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

  const handleNextPet = useCallback(() => {
    if (!selectedPet) return;
    const currentIndex = pets.findIndex(pet => pet.id === selectedPet.id);
    if (currentIndex < pets.length - 1) {
      setSelectedPet(pets[currentIndex + 1]);
    }
  }, [pets, selectedPet]);

  const handlePrevPet = useCallback(() => {
    if (!selectedPet) return;
    const currentIndex = pets.findIndex(pet => pet.id === selectedPet.id);
    if (currentIndex > 0) {
      setSelectedPet(pets[currentIndex - 1]);
    }
  }, [pets, selectedPet]);

  const handleRequestVisit = useCallback(async (date, time) => {
    if (!date || !time) {
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
      const dateTime = new Date(`${date}T${time}`);
      
      await api.post(`/visit-requests/${selectedPet.id}`, {
        requested_at: dateTime.toISOString()
      });
      
      setRequestedVisits(prev => [...prev, selectedPet.id]);
      closeModal();
      
      toast.success(`Visit request submitted for ${selectedPet.name}!`, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err) {
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
  }, [selectedPet]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <MatchResultsHeader 
            title="Your Perfect Matches"
            subtitle="Based on your preferences, we're finding pets that might be a great fit for you."
          />
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <MatchResultsHeader 
            title="Your Perfect Matches"
            subtitle="We're having trouble loading your matches."
          />
          {error.includes('questionnaire') ? (
            <ErrorState 
              error={error}
              actionLabel="Complete Questionnaire"
              actionHref="/questionnaire"
            />
          ) : error.includes('log in') ? (
            <ErrorState 
              error={error}
              actionLabel="Log In"
              actionHref="/login"
            />
          ) : (
            <ErrorState 
              error={error}
              onRetry={() => fetchMatchedPets(1)}
              actionLabel="Try Again"
            />
          )}
        </div>
      </div>
    );
  }

  // Render empty state
  if (pets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <MatchResultsHeader 
            title="Your Perfect Matches"
            subtitle="Based on your preferences, we've found these wonderful pets that might be a great fit for you."
          />
          <EmptyState 
            title="No matches found"
            description="We couldn't find any pets that match your current preferences. Try adjusting your criteria."
            action={
              <Link
                to="/questionnaire"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 1 1 0 001.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                Update Preferences
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <MatchResultsHeader 
          title="Your Perfect Matches"
          subtitle="Based on your preferences, we've found these wonderful pets that might be a great fit for you."
        />

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

        <LoadMoreButton 
          onClick={handleLoadMore}
          isLoading={isLoadingMore}
          hasMore={pagination.hasMore}
          loadingText="Loading more matches..."
          buttonText="Load More Matches"
          className="mt-10"
        />
      </div>

      {selectedPet && (
        <PetModal
          pet={selectedPet}
          onClose={closeModal}
          onNext={handleNextPet}
          onPrev={handlePrevPet}
          hasNext={pets.findIndex(pet => pet.id === selectedPet.id) < pets.length - 1}
          hasPrev={pets.findIndex(pet => pet.id === selectedPet.id) > 0}
          onRequestVisit={handleRequestVisit}
        />
      )}

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
