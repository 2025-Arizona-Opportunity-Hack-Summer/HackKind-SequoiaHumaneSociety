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
      
      const pageSize = 12;
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
        
        if (response.length === pageSize) {
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
      setError('Failed to load pets. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPets(1);
  }, [fetchPets]);

  const handleLoadMore = () => {
    if (!isLoadingMore) {
      fetchPets(pagination.page + 1, true);
    }
  };

  const handlePetClick = (pet) => {
    const params = new URLSearchParams(searchParams);
    params.set('petId', pet.id);
    setSearchParams(params);
    setSelectedPet(pet);
  };

  const handleCloseModal = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('petId');
    setSearchParams(params);
    setSelectedPet(null);
    setShowVisitRequest(false);
  };

  const handleRequestVisit = useCallback(async (date, time) => {
    if (!date || !time) {
      const errorMessage = "Please select both a date and time.";
      setError(errorMessage);
      return { success: false, error: 'validation_error', message: errorMessage };
    }

    if (!selectedPet) {
      const errorMessage = "No pet selected for visit.";
      setError(errorMessage);
      return { success: false, error: 'no_pet_selected', message: errorMessage };
    }

    setIsSubmitting(true);
    setError("");

    try {
      const dateTime = new Date(`${date}T${time}`);
      
      const response = await api.post(`/visit-requests/${selectedPet.id}`, {
        requested_at: dateTime.toISOString()
      });
      
      if (response.data && response.data.success === false) {
        setError(response.data.message || 'Could not schedule visit');
        return { 
          success: false, 
          error: 'api_error',
          message: response.data.message || 'Could not schedule visit'
        };
      }
      
      return { 
        success: true, 
        message: `Visit request submitted for ${selectedPet.name}!`,
        petName: selectedPet.name
      };
      
    } catch (err) {
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      return { 
        success: false, 
        error: 'unexpected_error', 
        message: errorMessage,
        details: err.message 
      };
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedPet, navigate]);

  const handleRequestVisitClick = (pet) => {
    if (!user) {
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
