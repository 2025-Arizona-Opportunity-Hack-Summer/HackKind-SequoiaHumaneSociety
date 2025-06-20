import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { petService } from '../services/petService';
import PetCard from '../components/pets/PetCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import LoadMoreButton from '../components/ui/LoadMoreButton';
import VisitRequestModal from '../components/visits/VisitRequestModal';

export default function PetsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const petIdFromUrl = searchParams.get('petId');
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 6,
    hasMore: false
  });

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

  // Handle URL changes and auto-open modal
  useEffect(() => {
    if (petIdFromUrl) {
      console.log('Pet ID from URL:', petIdFromUrl);
      console.log('Available pets:', pets.map(p => ({ id: p.id, name: p.name })));
      
      const petToShow = pets.find(pet => String(pet.id) === String(petIdFromUrl));
      
      if (petToShow) {
        console.log('Found pet to show:', petToShow.name);
        setSelectedPet(petToShow);
      } else if (pets.length > 0) {
        console.log('Pet not found in current page. Fetching pet details...');
        // If pet not found in current page, try to fetch it directly
        const fetchPetDetails = async () => {
          try {
            const pet = await petService.getPet(petIdFromUrl);
            if (pet) {
              console.log('Fetched pet details:', pet.name);
              setSelectedPet(pet);
              // Add to pets list if not already there
              setPets(prevPets => {
                if (!prevPets.some(p => String(p.id) === String(pet.id))) {
                  return [...prevPets, pet];
                }
                return prevPets;
              });
            }
          } catch (error) {
            console.error('Error fetching pet details:', error);
          }
        };
        
        fetchPetDetails();
      }
    }
  }, [petIdFromUrl, pets]);

  const handlePetClick = (pet) => {
    setSelectedPet(pet);
    // Update URL with petId
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('petId', pet.id);
    setSearchParams(newSearchParams);
  };

  const handleCloseModal = () => {
    setSelectedPet(null);
    // Remove petId from URL when closing modal
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('petId');
    setSearchParams(newSearchParams);
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
      <h1 className="text-3xl font-bold mb-8 text-center">Available Pets</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pets.map((pet) => (
          <div key={pet.id} onClick={() => handlePetClick(pet)} className="cursor-pointer">
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
        <VisitRequestModal
          pet={selectedPet}
          onClose={handleCloseModal}
          onSuccess={handleCloseModal}
          showSignUpPrompt={!user}
        />
      )}
    </div>
  );
}
