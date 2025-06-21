import React, { useState, Fragment, useRef, useEffect } from 'react';
import StatusBadge from '../common/StatusBadge';
import { format } from 'date-fns';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PhoneIcon, EnvelopeIcon, UserIcon, CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { visitService } from '../../services/visitService';

// These values must match the backend's VisitRequestStatus enum exactly
const statusOptions = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Cancelled', label: 'Cancelled' }
];

// Helper function to convert status to display format
const getStatusDisplay = (status) => {
  const option = statusOptions.find(opt => opt.value === status);
  return option ? option.label : status;
};

const VisitItem = ({
  visit,
  isSelected = false,
  onSelect = () => {},
  onDelete = null,
  showCheckbox = true,
  onStatusUpdate = null
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef(null);
  const statusButtonRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          statusButtonRef.current && !statusButtonRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format status for display (title case)
  const formatStatusDisplay = (status) => {
    if (!status) return '';
    return status.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Normalize status for API (lowercase with underscores)
  const normalizeStatusForApi = (status) => {
    if (!status) return 'pending';
    return status.toLowerCase().replace(/\s+/g, '_');
  };

  const handleStatusChange = async (newStatus) => {
    // Prevent multiple clicks
    if (isUpdating) return;
    
    // Normalize the status for comparison (case-insensitive)
    const currentStatus = (visit.status || '').toLowerCase().replace(/\s+/g, '_');
    const normalizedNewStatus = newStatus.toLowerCase(); // Keep it simple, backend will handle normalization
    
    if (currentStatus === normalizedNewStatus) {
      setIsStatusDropdownOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      console.log(`Updating status from ${visit.status} to: ${newStatus} (normalized: ${normalizedNewStatus})`);
      
      // Call the API to update the status with the exact value from the dropdown
      await visitService.updateVisitStatus(visit.id, newStatus);
      
      console.log('Status update successful, notifying parent component...');
      
      // Update local state immediately for better UX
      if (onStatusUpdate) {
        const success = await onStatusUpdate(visit.id, newStatus);
        if (!success) {
          throw new Error('Failed to update status in parent component');
        }
      }
      
      // Close the dropdown after successful update
      setIsStatusDropdownOpen(false);
      
      // Show success feedback with properly formatted status
      toast.success(`Status updated to ${formatStatusDisplay(newStatus)}`);
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         error.message ||
                         'Failed to update status. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleDetails = () => {
    setIsDetailsOpen(!isDetailsOpen);
  };

  // Safely parse the requested date
  const requestedDate = visit.requested_at ? new Date(visit.requested_at) : new Date();
  const formattedDate = format(requestedDate, 'PPPPp');

  // Safely get requester information with fallbacks
  const requesterName = visit.user?.full_name || visit.user?.name || visit.user_name || 'N/A';
  const requesterEmail = visit.user?.email || visit.user_email || 'No email provided';
  const requesterPhone = visit.user?.phone_number || visit.user?.phone || visit.user_phone || 'No phone provided';
  const petName = visit.pet?.name || visit.pet_name || 'Unknown Pet';
  
  // Determine species based on image URL
  const getPetSpecies = () => {
    if (visit.pet?.image_url) {
      if (visit.pet.image_url.includes('dog.ceo')) return 'Dog';
      if (visit.pet.image_url.includes('thecatapi')) return 'Cat';
    }
    // Default to 'Pet' if we can't determine
    return 'Pet';
  };
  
  const petSpecies = getPetSpecies();

  const getStatusVariant = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'confirmed';
      case 'cancelled':
        return 'cancelled';
      case 'pending approval':
        return 'pending';
      default:
        return 'default';
    }
  };

  // Status options with their display labels and colors
  const statusOptions = [
    { 
      value: 'pending', 
      label: 'Pending',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800'
    },
    { 
      value: 'confirmed', 
      label: 'Confirmed',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800'
    },
    { 
      value: 'cancelled', 
      label: 'Cancelled',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800'
    }
  ];

  // Get current status display info
  const currentStatus = statusOptions.find(opt => 
    opt.value === (visit.status || '').toLowerCase()
  ) || { label: formatStatusDisplay(visit.status), bgColor: 'bg-gray-100', textColor: 'text-gray-800' };

  // Status badge with dropdown
  const statusBadge = (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsStatusDropdownOpen(!isStatusDropdownOpen);
          }}
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${currentStatus.bgColor} ${currentStatus.textColor}`}
          disabled={isUpdating}
        >
          {isUpdating ? 'Updating...' : currentStatus.label}
          <ChevronDownIcon className="ml-1 h-4 w-4" />
        </button>
      </div>

      {/* Status dropdown */}
      {isStatusDropdownOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {statusOptions.map(({ value, label, bgColor, textColor }) => (
              <button
                key={value}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(value);
                }}
                className={`block w-full text-left px-4 py-2 text-sm ${textColor} hover:bg-gray-50 ${
                  (visit.status || '').toLowerCase() === value.toLowerCase() ? 'font-semibold' : ''
                }`}
                role="menuitem"
                disabled={isUpdating}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <img 
              className="h-10 w-10 rounded-full object-cover" 
              src={
                (visit.pet?.image_url || 
                visit.pet_image || 
                `https://source.unsplash.com/featured/200x200/${visit.pet_species?.toLowerCase() || 'pet'}`)
              } 
              alt={visit.pet_name || 'Pet'}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
              {visit.pet_species?.charAt(0) || 'P'}
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{petName}</div>
            <div className="text-sm text-gray-500">
              {petSpecies}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 flex items-center">
          <UserIcon className="h-4 w-4 mr-1 text-gray-500" />
          {requesterName}
        </div>
        <div className="text-sm text-gray-500 flex items-center">
          <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-500" />
          <span className="text-gray-900">{requesterEmail}</span>
        </div>
        <div className="text-sm text-gray-500 mt-1 flex items-center">
          <PhoneIcon className="h-4 w-4 mr-1 text-gray-500" />
          <span className="text-gray-900">{requesterPhone}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{formattedDate}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap relative">
        {statusBadge}
      </td>
      {showCheckbox && (
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(visit.id, !isSelected)}
            className="h-4 w-4 text-primary-red focus:ring-primary-red border-gray-300 rounded"
          />
        </td>
      )}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={toggleDetails}
          className="text-primary-red hover:text-primary-red-dark font-medium"
        >
          View Details
        </button>
      </td>

      {/* Visit Details Modal */}
      <Transition.Root show={isDetailsOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={toggleDetails}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div>
                    <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                      <button
                        type="button"
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2"
                        onClick={toggleDetails}
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                          Visit Request Details
                        </Dialog.Title>
                        <div className="mt-2">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center mb-4">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img 
                                  className="h-10 w-10 rounded-full" 
                                  src={visit.pet?.image_url || `https://source.unsplash.com/featured/200x200/${petSpecies?.toLowerCase() || 'pet'}`} 
                                  alt={petName}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                                <div className="hidden h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                                  {petSpecies?.charAt(0) || 'P'}
                                </div>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{petName}</p>
                                <p className="text-sm text-gray-500">{petSpecies}</p>
                              </div>
                            </div>
                            
                            <div className="border-t border-gray-200 pt-4">
                              <h4 className="text-sm font-medium text-gray-500 mb-2">Requester Information</h4>
                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-900">{requesterName}</span>
                                </div>
                                <div className="flex items-center">
                                  <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                                  <a href={`mailto:${requesterEmail}`} className="text-sm text-blue-600 hover:underline">
                                    {requesterEmail}
                                  </a>
                                </div>
                                <div className="flex items-center">
                                  <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                                  <a href={`tel:${requesterPhone.replace(/[^0-9+]/g, '')}`} className="text-sm text-blue-600 hover:underline">
                                    {requesterPhone}
                                  </a>
                                </div>
                              </div>
                            </div>
                            
                            <div className="border-t border-gray-200 pt-4 mt-4">
                              <h4 className="text-sm font-medium text-gray-500 mb-2">Visit Details</h4>
                              <dl className="grid grid-cols-1 gap-x-4 gap-y-2">
                                <div className="sm:col-span-1">
                                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                                  <dd className="mt-1 text-sm text-gray-900">
                                    <StatusBadge status={formatStatusDisplay(visit.status)} />
                                  </dd>
                                </div>
                                <div className="sm:col-span-1">
                                  <dt className="text-sm font-medium text-gray-500">Requested Date</dt>
                                  <dd className="mt-1 text-sm text-gray-900">
                                    {formattedDate}
                                  </dd>
                                </div>
                                {visit.notes && (
                                  <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                                      {visit.notes}
                                    </dd>
                                  </div>
                                )}

                              </dl>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-red text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={toggleDetails}
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default VisitItem;
