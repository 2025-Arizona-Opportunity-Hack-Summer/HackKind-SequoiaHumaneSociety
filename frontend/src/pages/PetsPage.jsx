import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { petService } from '../services/petService';
import api from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PetCard from '../components/pets/PetCard';
import PetModal from '../components/pets/PetModal';
import VisitRequestModal from '../components/visits/VisitRequestModal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import LoadMoreButton from '../components/ui/LoadMoreButton';

export default function PetsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [showVisitRequest, setShowVisitRequest] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 6,
    hasMore: false
  });
  
  // Check for petId in URL when pets are loaded
  useEffect(() => {
    if (pets.length > 0) {
      const petId = searchParams.get('petId');
      if (petId) {
        const pet = pets.find(p => p.id.toString() === petId);
        if (pet) {
          setSelectedPet(pet);
        }
      }
    }
  }, [pets, searchParams]);

  const fetchPets = useCallback(async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setIsLoading(true);
        if (!append) setPets([]);
      } else {
        setIsLoadingMore(true);
      }
      
      setError('');
      
      // Increase page size to load more pets at once
      const pageSize = 12; // Increased from 6 to 12 for better performance
      const response = await petService.getPets(
        (page - 1) * pageSize,
        pageSize
      );
      
      if (response && Array.isArray(response)) {
        setPets(prev => {
          const newPets = append ? [...prev, ...response] : response;
          const uniquePets = Array.from(new Map(newPets.map(pet => [pet.id, pet])).values());
          return uniquePets;
        });
        
        // Continue loading more if we got a full page of results
        // This will keep loading until we get less than pageSize results
        if (response.length === pageSize) {
          // Small delay before loading next page to avoid overwhelming the server
          setTimeout(() => {
            fetchPets(page + 1, true);
          }, 100);
        } else {
          setPagination(prev => ({
            ...prev,
            hasMore: false,
            page
          }));
        }
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching pets:', err);
      setError('Failed to load pets. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []); // Removed pagination.pageSize from dependencies to prevent infinite loops

  useEffect(() => {
    fetchPets(1);
  }, [fetchPets]);

  const handleLoadMore = () => {
    if (!isLoadingMore) {
      fetchPets(pagination.page + 1, true);
    }
  };

  const handlePetClick = (pet) => {
    // Update URL with petId when a pet is selected
    const params = new URLSearchParams(searchParams);
    params.set('petId', pet.id);
    setSearchParams(params);
    setSelectedPet(pet);
  };

  const handleCloseModal = () => {
    // Remove petId from URL when modal is closed
    const params = new URLSearchParams(searchParams);
    params.delete('petId');
    setSearchParams(params);
    setSelectedPet(null);
    setShowVisitRequest(false);
  };

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
      
      // Show success toast
      toast.success(`Visit request submitted for ${selectedPet.name}!`, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Close the modals
      setShowVisitRequest(false);
      handleCloseModal();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to submit visit request. Please try again.';
      setError(errorMessage);
      
      // Show error toast
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
  }, [selectedPet, navigate]);

  const handleRequestVisitClick = (pet) => {
    if (!user) {
      // Redirect to sign-up if not logged in
      navigate('/signup');
      return;
    }
    setSelectedPet(pet);
    setShowVisitRequest(true);
  };

  const navigateToPet = (direction) => {
    if (!selectedPet) return;
    
    const currentIndex = pets.findIndex(pet => pet.id === selectedPet.id);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < pets.length) {
      handlePetClick(pets[newIndex]);
    }
  };

  if (isLoading && !pets.length) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => fetchPets(1)} />;
  }

  if (!isLoading && !pets.length) {
    return <EmptyState message="No pets found" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
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
      <h1 className="text-3xl font-bold mb-8 text-center">Available Pets</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pets.map((pet) => (
          <div key={pet.id} onClick={() => handlePetClick(pet)}>
            <PetCard 
              pet={pet} 
              onSelect={() => {}} 
              isSelected={false} 
              isRequested={false}
            />
          </div>
        ))}
      </div>

      {pagination.hasMore && (
        <div className="mt-8 text-center">
          <LoadMoreButton 
            isLoading={isLoadingMore} 
            onClick={handleLoadMore} 
          />
        </div>
      )}

      {selectedPet && (
        <>
          <PetModal
            pet={selectedPet}
            onClose={handleCloseModal}
            onNext={() => navigateToPet('next')}
            onPrev={() => navigateToPet('prev')}
            hasNext={pets.findIndex(p => p.id === selectedPet.id) < pets.length - 1}
            hasPrev={pets.findIndex(p => p.id === selectedPet.id) > 0}
            onRequestVisit={handleRequestVisit}
            user={user}
          />
          {user && showVisitRequest && (
            <VisitRequestModal
              pet={selectedPet}
              onClose={() => setShowVisitRequest(false)}
              onSubmit={handleRequestVisit}
              isLoading={isSubmitting}
              error={error}
              visitDate={visitDate}
              setVisitDate={setVisitDate}
              visitTime={visitTime}
              setVisitTime={setVisitTime}
            />
          )}
        </>
      )}
    </div>
  );
}
