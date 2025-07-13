import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { petService } from '../services/petService';
import { visitService } from '../services/visitService';
import petTrainingTraitsService from '../services/petTrainingTraitsService';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

import Section from '../components/common/Section';
import PetList from '../components/pets/PetList';
import VisitList from '../components/visits/VisitList';
import PetModal from '../components/modals/PetModal';
import VisitModal from '../components/modals/VisitModal';
import ConfirmationModal from '../components/common/ConfirmationModal';

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [allPets, setAllPets] = useState([]);
  const [displayedPets, setDisplayedPets] = useState([]);
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [petError, setPetError] = useState('');
  const [petPage, setPetPage] = useState(1);
  const [hasMorePets, setHasMorePets] = useState(false);
  const petsPerPage = 10;
  
  const [allVisits, setAllVisits] = useState([]);
  const [displayedVisits, setDisplayedVisits] = useState([]);
  const [isLoadingVisits, setIsLoadingVisits] = useState(true);
  const [visitError, setVisitError] = useState('');
  const [visitPage, setVisitPage] = useState(1);
  const [hasMoreVisits, setHasMoreVisits] = useState(false);
  const visitsPerPage = 10;
  
  const [showPetModal, setShowPetModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [currentPet, setCurrentPet] = useState(null);
  const [currentVisit, setCurrentVisit] = useState(null);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState({ id: null, type: '' });
  
  const [bulkAction, setBulkAction] = useState('');
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchPets(), fetchVisits()]);
      } catch (error) {
        toast.error('Failed to load data. Please try again.');
      }
    };
    
    fetchData();
  }, []);

  const fetchPets = async () => {
    try {
      setIsLoadingPets(true);
      
      const allPetsData = await petService.getAllPets();
      setAllPets(allPetsData);
      
      const initialPets = allPetsData.slice(0, petsPerPage);
      setDisplayedPets(initialPets);
      setHasMorePets(allPetsData.length > petsPerPage);
      setPetError('');
    } catch (error) {
      setPetError('Failed to load pets. Please try again.');
      toast.error('Failed to load pets');
      setAllPets([]);
      setDisplayedPets([]);
    } finally {
      setIsLoadingPets(false);
    }
  };
  
  const loadMorePets = () => {
    if (isLoadingPets) return;
    
    const nextPage = petPage + 1;
    const nextPets = allPets.slice(0, nextPage * petsPerPage);
    
    setDisplayedPets(nextPets);
    setPetPage(nextPage);
    setHasMorePets(nextPets.length < allPets.length);
  };
  
  const handlePetListScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 20;
    
    if (isNearBottom && hasMorePets) {
      loadMorePets();
    }
  };

  const fetchVisits = async () => {
    try {
      setIsLoadingVisits(true);
      
      const allVisitsData = await visitService.getAllVisits();
      setAllVisits(allVisitsData);
      
      const initialVisits = allVisitsData.slice(0, visitsPerPage);
      setDisplayedVisits(initialVisits);
      setHasMoreVisits(allVisitsData.length > visitsPerPage);
      setVisitError('');
    } catch (error) {
      setVisitError('Failed to load visits. Please try again.');
      toast.error('Failed to load visits');
      setAllVisits([]);
      setDisplayedVisits([]);
    } finally {
      setIsLoadingVisits(false);
    }
  };
  
  const loadMoreVisits = () => {
    if (isLoadingVisits) return;
    
    const nextPage = visitPage + 1;
    const nextVisits = allVisits.slice(0, nextPage * visitsPerPage);
    
    setDisplayedVisits(nextVisits);
    setVisitPage(nextPage);
    setHasMoreVisits(nextVisits.length < allVisits.length);
  };
  
  const handleVisitListScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 20;
    
    if (isNearBottom && hasMoreVisits) {
      loadMoreVisits();
    }
  };

  const normalizeStatus = (status) => {
    if (!status) return 'pending';
    
    const statusLower = status.toLowerCase().trim();
    
    const statusMap = {
      'pending': 'pending',
      'pending approval': 'pending',
      'approved': 'approved',
      'confirmed': 'confirmed',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
      'rejected': 'cancelled',
      'denied': 'cancelled'
    };
    
    const normalizedStatus = statusMap[statusLower] || statusLower;
    
    return normalizedStatus;
  };

  const formatStatusForDisplay = (status) => {
    if (!status) return 'Available';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const handlePetSubmit = async (submissionData) => {
    try {
      setIsProcessing(true);
      
      const { trainingTraits = [], ...petData } = submissionData;
      
      const isFormData = petData instanceof FormData;
      
      let updatedPet;
      
      if (currentPet) {
        const petId = currentPet._id || currentPet.id;
        
        const updateData = isFormData ? petData : {
          ...petData,
          status: ['Available', 'Pending', 'Adopted'].includes(petData.status) 
            ? petData.status 
            : 'Available'
        };
        
        updatedPet = await petService.updatePet(petId, updateData);
        
        if (!updatedPet) {
          const error = new Error('No data returned from update');
          throw error;
        }
        
        if (Array.isArray(trainingTraits)) {
          try {
            await petTrainingTraitsService.updateTrainingTraits(petId, trainingTraits);
          } catch (traitsError) {
            toast.error('Pet updated, but there was an error updating training traits');
          }
        }
        
        const refreshedPet = await petService.getPet(petId);
        
        setAllPets(prevPets => 
          prevPets.map(pet => 
            (pet._id === petId || pet.id === petId) ? { ...pet, ...refreshedPet } : pet
          )
        );
        
        setDisplayedPets(prevPets => 
          prevPets.map(pet => 
            (pet._id === petId || pet.id === petId) ? { ...pet, ...refreshedPet } : pet
          )
        );
        
        toast.success('Pet updated successfully');
      } else {
        const newPetData = {
          ...petData,
          name: petData.name || '',
          age_group: petData.age_group || '',
          sex: petData.sex || '',
          species: petData.species || '',
          status: ['Available', 'Pending', 'Adopted'].includes(petData.status) 
            ? petData.status 
            : 'Available'
        };
        
        const createdPet = await petService.createPet(newPetData);
        
        if (Array.isArray(trainingTraits) && trainingTraits.length > 0) {
          try {
            await petTrainingTraitsService.updateTrainingTraits(createdPet.id || createdPet._id, trainingTraits);
            
            const refreshedPet = await petService.getPet(createdPet.id || createdPet._id);
            createdPet.trainingTraits = refreshedPet.trainingTraits || [];
          } catch (traitsError) {
            toast.error('Pet created, but there was an error adding training traits');
          }
        }
        
        setAllPets(prevPets => [createdPet, ...prevPets]);
        setDisplayedPets(prevPets => [createdPet, ...prevPets.slice(0, petsPerPage - 1)]);
        
        toast.success('Pet created successfully');
      }
      
      setShowPetModal(false);
      setCurrentPet(null);
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeletePet = async (petId) => {
    try {
      setIsProcessing(true);
      await petService.deletePet(petId);
      setAllPets(prevPets => prevPets.filter(pet => (pet._id || pet.id) !== petId));
      setDisplayedPets(prevPets => prevPets.filter(pet => (pet._id || pet.id) !== petId));
      toast.success('Pet deleted successfully');
      await fetchPets();
      setShowDeleteModal(false);
      setItemToDelete({ id: null, type: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete pet');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVisitSubmit = async (visitData) => {
    try {
      setIsProcessing(true);
      
      if (currentVisit) {
        await api.put(`/visit-requests/${currentVisit.id}`, {
          requested_at: visitData.requested_at,
          status: visitData.status
        });
        toast.success('Visit request updated successfully');
      } else {
        const response = await api.post(`/visit-requests/${visitData.pet_id}`, {
          requested_at: visitData.requested_at
        });
        
        if (response.data && response.data.success === false) {
          throw new Error(response.data.message || 'Could not schedule visit');
        }
        
        toast.success('Visit request created successfully');
      }
      
      setShowVisitModal(false);
      setCurrentVisit(null);
      await fetchVisits();
    } catch (error) {
      toast.error(error.message || `Failed to ${currentVisit ? 'update' : 'create'} visit request`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteClick = (id, type) => {
    setItemToDelete({ id, type });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete.id || !itemToDelete.type) return;
    
    try {
      setIsProcessing(true);
      
      if (itemToDelete.type === 'pet') {
        await petService.deletePet(itemToDelete.id);
        setAllPets(prevPets => prevPets.filter(pet => (pet._id || pet.id) !== itemToDelete.id));
        setDisplayedPets(prevPets => prevPets.filter(pet => (pet._id || pet.id) !== itemToDelete.id));
        toast.success('Pet deleted successfully');
      } else if (itemToDelete.type === 'visit') {
        await visitService.deleteVisit(itemToDelete.id);
        setAllVisits(prevVisits => prevVisits.filter(visit => (visit._id || visit.id) !== itemToDelete.id));
        setDisplayedVisits(prevVisits => prevVisits.filter(visit => (visit._id || visit.id) !== itemToDelete.id));
        toast.success('Visit deleted successfully');
      }
      
      setShowDeleteModal(false);
      setItemToDelete({ id: null, type: '' });
    } catch (error) {
      toast.error(`Failed to delete ${itemToDelete.type}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkAction = async (selectedIds, action) => {
    if (!selectedIds.length) return;
    
    try {
      setIsBulkProcessing(true);
      
      if (action === 'delete') {
        setBulkAction('delete');
        setItemToDelete({ ids: selectedIds, type: 'bulk' });
        setShowBulkActionModal(true);
        return;
      }
      
      const formattedStatus = action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
      
      const petsToUpdate = allPets.filter(pet => selectedIds.includes(pet.id));
      
      const updatePromises = selectedIds.map(id => {
        const existingPet = petsToUpdate.find(pet => pet.id === id);
        return petService.updatePet(id, { status: formattedStatus }, existingPet)
          .then(() => ({ success: true, id }))
          .catch(error => {
            return { success: false, id, error: error.message };
          });
      });
      
      const results = await Promise.all(updatePromises);
      const failedUpdates = results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        failedUpdates.forEach(failed => {
        });
        toast.error(`Failed to update ${failedUpdates.length} pet(s). See console for details.`);
      }
      
      const successCount = selectedIds.length - failedUpdates.length;
      if (successCount > 0) {
        toast.success(`Successfully updated ${successCount} pet(s) to ${formattedStatus}`);
        await fetchPets();
      }
    } catch (error) {
      toast.error(`Failed to perform bulk action: ${error.message}`);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleVisitStatusUpdate = async (visitId, newStatus) => {
    try {
      const normalizedStatus = normalizeStatus(newStatus);
      
      await visitService.updateVisitStatus(visitId, normalizedStatus);
      
      const updateVisit = (visit) => 
        (visit.id === visitId || visit._id === visitId)
          ? { ...visit, status: normalizedStatus }
          : visit;
      
      setAllVisits(prev => prev.map(updateVisit));
      setDisplayedVisits(prev => prev.map(updateVisit));
      
      toast.success('Visit status updated successfully');
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update visit status';
      toast.error(errorMessage);
      return false;
    }
  };

  const handleConfirmBulkAction = async () => {
    if (!itemToDelete.ids || !itemToDelete.ids.length) {
      toast.error('No items selected');
      return;
    }

    try {
      setIsBulkProcessing(true);
      
      if (itemToDelete.type === 'bulk') {
        if (bulkAction === 'delete') {
          const deleteResults = await Promise.allSettled(
            itemToDelete.ids.map(id => petService.deletePet(id))
          );
          
          const successfulDeletes = deleteResults
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);
            
          if (successfulDeletes.length > 0) {
            setAllPets(prevPets => prevPets.filter(pet => !successfulDeletes.includes(pet._id || pet.id)));
            setDisplayedPets(prevPets => prevPets.filter(pet => !successfulDeletes.includes(pet._id || pet.id)));
          }
          
          if (successfulDeletes.length === itemToDelete.ids.length) {
            toast.success(`Successfully deleted ${successfulDeletes.length} pets`);
          } else {
            toast.success(`Deleted ${successfulDeletes.length} of ${itemToDelete.ids.length} selected pets`);
          }
        } else if (bulkAction.startsWith('status:')) {
          const status = bulkAction.split(':')[1].toLowerCase();
          const updatePromises = itemToDelete.ids.map(id => 
            petService.updatePet(id, { status })
              .then(() => ({ id, success: true }))
              .catch(error => ({
                id,
                success: false,
                error: error.response?.data?.message || error.message
              }))
          );
          
          const results = await Promise.all(updatePromises);
          const successfulUpdates = results.filter(r => r.success);
          
          if (successfulUpdates.length > 0) {
            const updatedPetIds = successfulUpdates.map(r => r.id);
            
            setAllPets(prevPets =>
              prevPets.map(pet =>
                updatedPetIds.includes(pet._id || pet.id)
                  ? { ...pet, status }
                  : pet
              )
            );
            
            setDisplayedPets(prevPets =>
              prevPets.map(pet =>
                updatedPetIds.includes(pet._id || pet.id)
                  ? { ...pet, status }
                  : pet
              )
            );
            
            if (successfulUpdates.length === itemToDelete.ids.length) {
              toast.success(`Updated status for ${successfulUpdates.length} pets to ${status}`);
            } else {
              toast.success(`Updated ${successfulUpdates.length} of ${itemToDelete.ids.length} selected pets`);
            }
          } else {
            throw new Error('Failed to update any pets');
          }
        }
      } else if (itemToDelete.type === 'bulk-visit') {
        if (bulkAction === 'delete') {
          const deleteResults = await Promise.allSettled(
            itemToDelete.ids.map(id => visitService.deleteVisit(id))
          );
          
          const successfulDeletes = deleteResults
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);
            
          if (successfulDeletes.length > 0) {
            setAllVisits(prevVisits => prevVisits.filter(visit => !successfulDeletes.includes(visit._id || visit.id)));
            setDisplayedVisits(prevVisits => prevVisits.filter(visit => !successfulDeletes.includes(visit._id || visit.id)));
          }
          
          if (successfulDeletes.length === itemToDelete.ids.length) {
            toast.success(`Successfully deleted ${successfulDeletes.length} visits`);
          } else {
            toast.success(`Deleted ${successfulDeletes.length} of ${itemToDelete.ids.length} selected visits`);
          }
        } else if (bulkAction.startsWith('status:')) {
          const status = bulkAction.split(':')[1];
          const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
          
          const result = await visitService.updateVisitsStatus(itemToDelete.ids, normalizedStatus);
          
          if (result && result.success) {
            const updateVisitStatus = (visit) => 
              itemToDelete.ids.includes(visit._id || visit.id)
                ? { ...visit, status: normalizedStatus }
                : visit;
            
            setAllVisits(prevVisits => prevVisits.map(updateVisitStatus));
            setDisplayedVisits(prevVisits => prevVisits.map(updateVisitStatus));
            
            toast.success(`Updated ${itemToDelete.ids.length} visits to ${normalizedStatus}`);
          } else {
            throw new Error('Failed to update some visits');
          }
        }
      }
      
      setShowBulkActionModal(false);
      setItemToDelete({ id: null, type: '' });
      setBulkAction('');
      
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to perform bulk action');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkVisitAction = async (selectedIds, action) => {
    if (!selectedIds || !selectedIds.length) {
      toast.error('No visits selected');
      return;
    }

    try {
      setIsBulkProcessing(true);
      
      const normalizedStatus = action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
      
      const result = await visitService.updateVisitsStatus(selectedIds, normalizedStatus);
      
      if (result && result.success) {
        const updateVisitStatus = (visit) => 
          selectedIds.includes(visit._id || visit.id)
            ? { ...visit, status: normalizedStatus }
            : visit;
        
        setAllVisits(prevVisits => prevVisits.map(updateVisitStatus));
        setDisplayedVisits(prevVisits => prevVisits.map(updateVisitStatus));
        
        toast.success(`Updated ${selectedIds.length} visits to ${normalizedStatus}`);
      } else {
        throw new Error('Failed to update some visits');
      }
    } catch (error) {
      toast.error(`Failed to update visits: ${error.message}`);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const confirmBulkDelete = async () => {
    if (!itemToDelete.ids || !itemToDelete.ids.length) {
      setShowBulkActionModal(false);
      return;
    }
    
    try {
      setIsBulkProcessing(true);
      
      if (itemToDelete.type === 'bulk') {
        await Promise.all(
          itemToDelete.ids.map(id => petService.deletePet(id))
        );
        setAllPets(prevPets => prevPets.filter(pet => !itemToDelete.ids.includes(pet._id || pet.id)));
        setDisplayedPets(prevPets => prevPets.filter(pet => !itemToDelete.ids.includes(pet._id || pet.id)));
        toast.success(`Deleted ${itemToDelete.ids.length} pets`);
        await fetchPets();
      } else if (itemToDelete.type === 'bulk-visit') {
        await Promise.all(
          itemToDelete.ids.map(id => api.delete(`/visits/${id}`))
        );
        setAllVisits(prevVisits => prevVisits.filter(visit => !itemToDelete.ids.includes(visit._id || visit.id)));
        setDisplayedVisits(prevVisits => prevVisits.filter(visit => !itemToDelete.ids.includes(visit._id || visit.id)));
        toast.success(`Deleted ${itemToDelete.ids.length} visit requests`);
        await fetchVisits();
      }
      
      setShowBulkActionModal(false);
      setItemToDelete({ id: null, type: '' });
    } catch (error) {
      toast.error('Failed to delete selected items');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Section 
          title="Pet Management"
          actions={
            <button
              onClick={() => {
                setCurrentPet(null);
                setShowPetModal(true);
              }}
              disabled={isProcessing}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-red hover:bg-primary-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-red ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isProcessing ? 'Processing...' : 'Add New Pet'}
            </button>
          }
          className="mb-8"
        >
          <div 
            className="overflow-y-auto" 
            style={{ maxHeight: '500px' }}
            onScroll={handlePetListScroll}
          >
            {isLoadingPets ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-red"></div>
              </div>
            ) : petError ? (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{petError}</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <PetList 
                  pets={displayedPets}
                  onEdit={(pet) => {
                    setCurrentPet(pet);
                    setShowPetModal(true);
                  }}
                  onDelete={(id) => handleDeleteClick(id, 'pet')}
                  onBulkAction={handleBulkAction}
                  isProcessing={isBulkProcessing}
                />
                {hasMorePets && (
                  <div className="text-center py-4">
                    <button
                      onClick={loadMorePets}
                      disabled={isLoadingPets}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-red"
                    >
                      {isLoadingPets ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </Section>

        <Section 
          title="Visit Requests"
          actions={
            <button
              onClick={() => {
                setCurrentVisit(null);
                setShowVisitModal(true);
              }}
              disabled={isProcessing}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-red hover:bg-primary-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-red ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isProcessing ? 'Processing...' : 'Schedule Visit'}
            </button>
          }
        >
          <div 
            className="overflow-y-auto" 
            style={{ maxHeight: '500px' }}
            onScroll={handleVisitListScroll}
          >
            {isLoadingVisits ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-red"></div>
              </div>
            ) : visitError ? (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{visitError}</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <VisitList 
                  visits={displayedVisits}
                  pets={displayedPets}
                  onEdit={(visit) => {
                    setCurrentVisit(visit);
                    setShowVisitModal(true);
                  }}
                  onDelete={(id) => handleDeleteClick(id, 'visit')}
                  onBulkAction={handleBulkVisitAction}
                  onStatusUpdate={handleVisitStatusUpdate}
                  isProcessing={isBulkProcessing}
                />
                {hasMoreVisits && (
                  <div className="text-center py-4">
                    <button
                      onClick={loadMoreVisits}
                      disabled={isLoadingVisits}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-red"
                    >
                      {isLoadingVisits ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </Section>
      </main>

      <PetModal
        isOpen={showPetModal}
        onClose={() => {
          setShowPetModal(false);
          setCurrentPet(null);
        }}
        onSubmit={handlePetSubmit}
        onDelete={handleDeletePet}
        pet={currentPet}
        pets={displayedPets}
        isProcessing={isProcessing}
      />

      <VisitModal
        isOpen={showVisitModal}
        onClose={() => setShowVisitModal(false)}
        onSubmit={handleVisitSubmit}
        visit={currentVisit}
        pets={allPets}
        isProcessing={isProcessing}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${itemToDelete.type}`}
        message={`Are you sure you want to delete this ${itemToDelete.type}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isProcessing={isProcessing}
      />

      <ConfirmationModal
        isOpen={showBulkActionModal}
        onClose={() => setShowBulkActionModal(false)}
        onConfirm={handleConfirmBulkAction}
        title={`${bulkAction === 'delete' ? 'Delete' : 'Update'} Multiple ${itemToDelete.type === 'bulk-pet' ? 'Pets' : 'Visits'}`}
        message={`Are you sure you want to ${bulkAction} ${itemToDelete.ids?.length || 0} ${itemToDelete.type === 'bulk-pet' ? 'pets' : 'visits'}? This action cannot be undone.`}
        confirmText={bulkAction === 'delete' ? 'Delete' : 'Update'}
        cancelText="Cancel"
        isProcessing={isBulkProcessing}
      />

      <Toaster position="top-right" />
    </div>
  );
};

export default AdminDashboard;
